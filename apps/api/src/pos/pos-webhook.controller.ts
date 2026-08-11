import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { posWebhookSchema } from "@t360/validation";
import { Public } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PosService } from "./pos.service";

@ApiTags("pos-webhook")
@Controller("pos")
export class PosWebhookController {
  constructor(private readonly pos: PosService) {}

  @Public()
  @Post("webhook")
  async webhook(
    @Body(new ZodValidationPipe(posWebhookSchema))
    body: {
      eventId: string;
      type: string;
      sku?: string | null;
      barcode?: string | null;
      branchCode: string;
      qtyDelta?: number;
      physicalQty?: number;
    },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.pos.ingestWebhook(body),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
