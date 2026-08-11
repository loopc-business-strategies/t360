import { MarketingService } from "./marketing.service";

describe("MarketingService", () => {
  it("enqueueCampaign creates recipients and queue jobs", async () => {
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({
          id: "camp1",
          status: "draft",
          segmentId: null,
          segment: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      customer: {
        findMany: jest.fn().mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]),
      },
      campaignRecipient: {
        upsert: jest
          .fn()
          .mockResolvedValueOnce({ id: "r1" })
          .mockResolvedValueOnce({ id: "r2" }),
      },
    };
    const audit = { log: jest.fn() };
    const notifications = { dispatch: jest.fn() };
    const queue = { enqueueCampaignRecipient: jest.fn().mockResolvedValue(undefined) };

    const svc = new MarketingService(
      prisma as never,
      audit as never,
      notifications as never,
      queue as never,
    );

    await expect(svc.enqueueCampaign("camp1", "admin1")).resolves.toEqual({ recipients: 2 });
    expect(prisma.campaignRecipient.upsert).toHaveBeenCalledTimes(2);
    expect(queue.enqueueCampaignRecipient).toHaveBeenCalledWith("r1");
    expect(queue.enqueueCampaignRecipient).toHaveBeenCalledWith("r2");
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "campaign.enqueue", metadata: { recipients: 2 } }),
    );
  });

  it("processAbandonedCarts skips empty and recent-order carts", async () => {
    const prisma = {
      systemSetting: {
        findMany: jest.fn().mockResolvedValue([
          { key: "marketing.abandonedCartEnabled", value: true },
          { key: "marketing.abandonedCartDelayHours", value: 24 },
          { key: "marketing.abandonedCartMaxReminders", value: 1 },
        ]),
      },
      cart: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "cart-recent-order",
            customerId: "c1",
            updatedAt: new Date(Date.now() - 48 * 3600_000),
            customer: { userId: "u1" },
            items: [{ id: "i1" }],
            abandonedReminders: [],
          },
          {
            id: "cart-ok",
            customerId: "c2",
            updatedAt: new Date(Date.now() - 48 * 3600_000),
            customer: { userId: "u2" },
            items: [{ id: "i2" }],
            abandonedReminders: [],
          },
        ]),
      },
      order: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: "o1" })
          .mockResolvedValueOnce(null),
      },
      abandonedCartReminder: {
        create: jest.fn().mockResolvedValue({ id: "rem1" }),
      },
    };

    const audit = { log: jest.fn() };
    const notifications = { dispatch: jest.fn().mockResolvedValue({ created: 1, ids: ["n1"] }) };
    const queue = { enqueueCampaignRecipient: jest.fn() };

    const svc = new MarketingService(
      prisma as never,
      audit as never,
      notifications as never,
      queue as never,
    );

    await expect(svc.processAbandonedCarts()).resolves.toEqual({ sent: 1 });
    expect(notifications.dispatch).toHaveBeenCalledTimes(1);
    expect(notifications.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u2", eventCode: "cart.abandoned" }),
    );
    expect(prisma.abandonedCartReminder.create).toHaveBeenCalledTimes(1);
  });

  it("processAbandonedCarts returns early when disabled", async () => {
    const prisma = {
      systemSetting: {
        findMany: jest.fn().mockResolvedValue([
          { key: "marketing.abandonedCartEnabled", value: false },
          { key: "marketing.abandonedCartDelayHours", value: 24 },
          { key: "marketing.abandonedCartMaxReminders", value: 1 },
        ]),
      },
      cart: { findMany: jest.fn() },
    };
    const svc = new MarketingService(
      prisma as never,
      { log: jest.fn() } as never,
      { dispatch: jest.fn() } as never,
      { enqueueCampaignRecipient: jest.fn() } as never,
    );
    await expect(svc.processAbandonedCarts()).resolves.toEqual({ sent: 0 });
    expect(prisma.cart.findMany).not.toHaveBeenCalled();
  });
});
