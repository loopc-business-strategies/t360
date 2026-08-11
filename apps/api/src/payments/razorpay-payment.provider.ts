import { createHmac, timingSafeEqual } from "crypto";
import { BadRequestException } from "@nestjs/common";
import {
  CreatePaymentOrderInput,
  PaymentProvider,
  ProviderEvent,
  ProviderOrder,
  ProviderRefund,
  RefundInput,
} from "./payment-provider";

/**
 * Razorpay adapter — requires RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET.
 * Uses Orders API create; webhook signature verification per Razorpay docs.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = "razorpay";

  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret: string,
  ) {}

  async createOrder(input: CreatePaymentOrderInput): Promise<ProviderOrder> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new BadRequestException({
        code: "RAZORPAY_ORDER_FAILED",
        message: text.slice(0, 200),
      });
    }
    const data = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      providerOrderId: data.id,
      amountPaise: data.amount,
      currency: data.currency,
      checkout: {
        provider: "razorpay",
        key: this.keyId,
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
      },
    };
  }

  verifyWebhook(headers: Record<string, string>, rawBody: Buffer): ProviderEvent {
    const signature = headers["x-razorpay-signature"] ?? headers["X-Razorpay-Signature"];
    if (!signature || !this.webhookSecret) {
      throw new BadRequestException({ code: "INVALID_WEBHOOK", message: "Missing signature" });
    }
    const expected = createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException({ code: "INVALID_WEBHOOK", message: "Bad signature" });
    }
    const payload = JSON.parse(rawBody.toString("utf8")) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: { id?: string; order_id?: string; status?: string };
        };
      };
    };
    const payment = payload.payload?.payment?.entity;
    const eventId =
      headers["x-razorpay-event-id"] ??
      `${payload.event}:${payment?.id ?? expected.slice(0, 16)}`;
    return {
      eventId,
      type: payload.event ?? "unknown",
      providerOrderId: payment?.order_id,
      providerPaymentId: payment?.id,
      paid: payment?.status === "captured" || payload.event === "payment.captured",
      raw: payload,
    };
  }

  async refund(input: RefundInput): Promise<ProviderRefund> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/payments/${input.providerPaymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "X-Razorpay-Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({ amount: input.amountPaise }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new BadRequestException({
        code: "RAZORPAY_REFUND_FAILED",
        message: text.slice(0, 200),
      });
    }
    const data = (await res.json()) as { id: string; status: string };
    return { providerRefundId: data.id, status: data.status };
  }
}
