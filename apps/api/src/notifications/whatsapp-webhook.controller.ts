import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "../common/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { WHATSAPP_PROVIDER, WhatsappProvider } from "./providers/whatsapp-provider";
import { NotificationsQueueService } from "./notifications-queue.service";

@ApiTags("whatsapp")
@Controller("whatsapp")
export class WhatsappWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationsQueueService,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsappProvider,
  ) {}

  @Public()
  @Get("webhook")
  challenge(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? "t360-dev-verify";
    if (mode === "subscribe" && token === expected) {
      return challenge;
    }
    throw new ForbiddenException({ code: "WA_VERIFY_FAILED", message: "Verification failed" });
  }

  @Public()
  @Post("webhook")
  async ingest(
    @Body() body: Record<string, unknown>,
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Req() req: Request,
  ) {
    const raw =
      typeof (req as Request & { rawBody?: string }).rawBody === "string"
        ? (req as Request & { rawBody?: string }).rawBody!
        : JSON.stringify(body);

    if (this.whatsapp.name !== "mock" && !this.whatsapp.verifyWebhookSignature(raw, signature)) {
      throw new ForbiddenException({ code: "WA_BAD_SIGNATURE", message: "Invalid signature" });
    }

    const eventId =
      (body as { entry?: Array<{ id?: string }> }).entry?.[0]?.id ??
      `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "whatsapp", eventId } },
    });
    if (existing?.processedAt) {
      return {
        success: true,
        data: { duplicate: true },
        requestId: (req as Request & { requestId?: string }).requestId,
      };
    }

    const row = await this.prisma.webhookEvent.upsert({
      where: { provider_eventId: { provider: "whatsapp", eventId } },
      create: { provider: "whatsapp", eventId, payload: body as object },
      update: {},
    });

    await this.queue.enqueueWhatsappInbound(row.id);
    await this.prisma.webhookEvent.update({
      where: { id: row.id },
      data: { processedAt: new Date() },
    });

    return {
      success: true,
      data: { accepted: true, eventId },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
