import { OrdersService } from "./orders.service";

describe("OrdersService payment confirm idempotency", () => {
  it("second confirm is duplicate and does not recommit", async () => {
    const commitReservation = jest.fn();
    const inventory = { commitReservation, releaseReservation: jest.fn(), reserve: jest.fn(), adjust: jest.fn() };
    const payments = { name: "mock", createOrder: jest.fn(), verifyWebhook: jest.fn(), refund: jest.fn() };
    let processedAt: Date | null = null;
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockImplementation(async () =>
          processedAt ? { processedAt } : null,
        ),
        upsert: jest.fn(),
        update: jest.fn().mockImplementation(async () => {
          processedAt = new Date();
        }),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue({
          id: "pay1",
          status: "pending",
          orderId: "o1",
          order: { id: "o1", status: "PaymentPending", reservationIds: ["r1"] },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      order: {
        update: jest.fn().mockResolvedValue({
          id: "o1",
          customerId: "c1",
          number: "TR1",
          total: 100,
          status: "Confirmed",
        }),
      },
      orderEvent: {
        create: jest.fn(),
      },
      customer: {
        findUnique: jest.fn().mockResolvedValue({ userId: "u1" }),
      },
    };
    const svc = new OrdersService(
      prisma as never,
      {} as never,
      {} as never,
      inventory as never,
      { log: jest.fn() } as never,
      {} as never,
      { earnForOrder: jest.fn() } as never,
      { dispatch: jest.fn() } as never,
      payments as never,
    );

    const first = await svc.confirmPaymentByProviderOrderId("po1", "pp1", "evt1", {});
    expect(first).toEqual({ confirmed: true, orderId: "o1" });
    expect(commitReservation).toHaveBeenCalledTimes(1);

    prisma.payment.findFirst = jest.fn().mockResolvedValue({
      id: "pay1",
      status: "captured",
      orderId: "o1",
      order: { id: "o1", status: "Confirmed", reservationIds: [] },
    });
    const second = await svc.confirmPaymentByProviderOrderId("po1", "pp1", "evt1", {});
    expect(second).toEqual({ duplicate: true });
    expect(commitReservation).toHaveBeenCalledTimes(1);
  });
});
