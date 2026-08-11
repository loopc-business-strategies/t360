import { parseInventoryCsv } from "./pos.utils";
import { MockPosAdapter } from "./providers/mock-pos.adapter";
import { PosService } from "./pos.service";

describe("pos.utils", () => {
  it("parses inventory CSV", () => {
    const rows = parseInventoryCsv(
      "sku,barcode,branchCode,qtyDelta\nSKU-1,,MAIN,-1\n,BC-2,MAIN,2\n",
    );
    expect(rows).toEqual([
      { sku: "SKU-1", barcode: undefined, branchCode: "MAIN", physicalQty: undefined, qtyDelta: -1 },
      { sku: undefined, barcode: "BC-2", branchCode: "MAIN", physicalQty: undefined, qtyDelta: 2 },
    ]);
  });
});

describe("MockPosAdapter", () => {
  it("healthcheck returns true without network", async () => {
    const mock = new MockPosAdapter();
    await expect(mock.healthcheck()).resolves.toBe(true);
    await expect(mock.pullInventory()).resolves.toEqual([]);
  });
});

describe("PosService webhook idempotency", () => {
  it("skips duplicate provider+eventId", async () => {
    const existing = {
      id: "e1",
      provider: "pos-mock",
      eventId: "evt-1",
      processedAt: new Date(),
    };
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
        update: jest.fn(),
      },
      integration: { upsert: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
      branch: { findFirst: jest.fn() },
      productVariant: { findFirst: jest.fn() },
      inventory: { findUnique: jest.fn() },
    };
    const inventory = { adjust: jest.fn() };
    const audit = { log: jest.fn() };
    const adapter = new MockPosAdapter();
    const svc = new PosService(prisma as never, audit as never, inventory as never, adapter);

    await expect(
      svc.ingestWebhook({
        eventId: "evt-1",
        type: "inventory.adjust",
        sku: "SKU-1",
        branchCode: "MAIN",
        qtyDelta: -1,
      }),
    ).resolves.toEqual({ duplicate: true, processed: true });

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(inventory.adjust).not.toHaveBeenCalled();
  });

  it("applyDeltas resolves SKU and calls adjust", async () => {
    const prisma = {
      branch: {
        findFirst: jest.fn().mockResolvedValue({ id: "b1", code: "MAIN" }),
      },
      productVariant: {
        findFirst: jest.fn().mockResolvedValue({ id: "v1", sku: "SKU-1" }),
      },
      inventory: { findUnique: jest.fn() },
      webhookEvent: {},
      integration: {},
    };
    const inventory = { adjust: jest.fn().mockResolvedValue({}) };
    const svc = new PosService(
      prisma as never,
      { log: jest.fn() } as never,
      inventory as never,
      new MockPosAdapter(),
    );

    const result = await svc.applyDeltas(
      [{ sku: "SKU-1", branchCode: "MAIN", qtyDelta: -1 }],
      "admin1",
      "pos.test",
    );
    expect(result.applied).toBe(1);
    expect(inventory.adjust).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: "b1",
        variantId: "v1",
        qtyDelta: -1,
        actorId: "admin1",
      }),
    );
  });
});
