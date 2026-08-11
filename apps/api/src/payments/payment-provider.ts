export type CreatePaymentOrderInput = {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
};

export type ProviderOrder = {
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  checkout: Record<string, unknown>;
};

export type ProviderEvent = {
  eventId: string;
  type: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  paid: boolean;
  raw: unknown;
};

export type RefundInput = {
  providerPaymentId: string;
  amountPaise: number;
  idempotencyKey: string;
};

export type ProviderRefund = {
  providerRefundId: string;
  status: string;
};

export interface PaymentProvider {
  readonly name: string;
  createOrder(input: CreatePaymentOrderInput): Promise<ProviderOrder>;
  verifyWebhook(headers: Record<string, string>, rawBody: Buffer): ProviderEvent;
  refund(input: RefundInput): Promise<ProviderRefund>;
}

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
