import {
  Controller,
  Headers,
  Inject,
  Param,
  Post,
  Req,
  RawBodyRequest,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "../common/decorators";
import { OrdersService } from "../orders/orders.service";
import { PAYMENT_PROVIDER, PaymentProvider } from "./payment-provider";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly orders: OrdersService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  @Public()
  @Post("razorpay/webhook")
  async razorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const event = this.provider.verifyWebhook(headers, raw);
    if (!event.paid || !event.providerOrderId) {
      return { success: true, data: { ignored: true } };
    }
    const data = await this.orders.confirmPaymentByProviderOrderId(
      event.providerOrderId,
      event.providerPaymentId ?? "",
      event.eventId,
      event.raw,
    );
    return { success: true, data };
  }

  @ApiBearerAuth()
  @Post(":orderId/mock-complete")
  async mockComplete(@Param("orderId") orderId: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.orders.mockComplete(orderId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
