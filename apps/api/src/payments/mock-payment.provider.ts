import { createHash, randomUUID } from "crypto";
import {
  CreatePaymentOrderInput,
  PaymentProvider,
  ProviderEvent,
  ProviderOrder,
  ProviderRefund,
  RefundInput,
} from "./payment-provider";

/** Dev-only mock — clearly labeled; never use as production success path without env. */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createOrder(input: CreatePaymentOrderInput): Promise<ProviderOrder> {
    const providerOrderId = `mock_order_${randomUUID()}`;
    return {
      providerOrderId,
      amountPaise: input.amountPaise,
      currency: input.currency,
      checkout: {
        provider: "mock",
        orderId: providerOrderId,
        amount: input.amountPaise,
        currency: input.currency,
        key: "mock_key",
      },
    };
  }

  verifyWebhook(headers: Record<string, string>, rawBody: Buffer): ProviderEvent {
    const payload = JSON.parse(rawBody.toString("utf8")) as {
      eventId?: string;
      providerOrderId?: string;
      providerPaymentId?: string;
      paid?: boolean;
    };
    const eventId =
      payload.eventId ??
      headers["x-mock-event-id"] ??
      createHash("sha256").update(rawBody).digest("hex");
    return {
      eventId,
      type: "payment.captured",
      providerOrderId: payload.providerOrderId,
      providerPaymentId: payload.providerPaymentId ?? `mock_pay_${randomUUID()}`,
      paid: payload.paid !== false,
      raw: payload,
    };
  }

  async refund(input: RefundInput): Promise<ProviderRefund> {
    return {
      providerRefundId: `mock_rfnd_${input.idempotencyKey.slice(0, 8)}`,
      status: "processed",
    };
  }
}
