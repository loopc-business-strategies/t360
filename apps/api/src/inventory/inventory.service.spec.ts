import { ConflictException } from "@nestjs/common";
import { InventoryService } from "./inventory.service";

describe("InventoryService transactions", () => {
  const audit = { log: jest.fn() };

  function makeService(prisma: Record<string, unknown>) {
    return new InventoryService(prisma as never, audit as never);
  }

  it("adjust rejects when physical would go below reserved", async () => {
    const inv = {
      id: "inv1",
      branchId: "b1",
      variantId: "v1",
      physicalQty: 5,
      reservedQty: 3,
      version: 1,
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          inventory: {
            findUnique: jest.fn().mockResolvedValue(inv),
            create: jest.fn(),
            updateMany: jest.fn(),
            findUniqueOrThrow: jest.fn(),
          },
          inventoryMovement: { create: jest.fn() },
        }),
      ),
    };
    const svc = makeService(prisma);
    await expect(
      svc.adjust({ branchId: "b1", variantId: "v1", qtyDelta: -3 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("commit decreases physical and reserved", async () => {
    const inv = {
      id: "inv1",
      branchId: "b1",
      variantId: "v1",
      physicalQty: 10,
      reservedQty: 4,
      version: 2,
    };
    const reservation = {
      id: "r1",
      branchId: "b1",
      variantId: "v1",
      qty: 2,
      status: "active",
      expiresAt: new Date(Date.now() + 60_000),
    };
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const movementCreate = jest.fn();
    const reservationUpdate = jest.fn();
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          stockReservation: {
            findUnique: jest.fn().mockResolvedValue(reservation),
            update: reservationUpdate,
          },
          inventory: {
            findUnique: jest.fn().mockResolvedValue(inv),
            create: jest.fn(),
            updateMany,
          },
          inventoryMovement: { create: movementCreate },
        }),
      ),
    };
    const svc = makeService(prisma);
    await expect(svc.commitReservation("r1")).resolves.toEqual({ committed: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "inv1", version: 2 },
      data: {
        physicalQty: 8,
        reservedQty: 2,
        version: { increment: 1 },
      },
    });
    expect(reservationUpdate).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { status: "committed" },
    });
    expect(movementCreate).toHaveBeenCalled();
  });

  it("parallel reserve race: second updateMany fails with version conflict", async () => {
    const inv = {
      id: "inv1",
      branchId: "b1",
      variantId: "v1",
      physicalQty: 5,
      reservedQty: 0,
      version: 1,
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          inventory: {
            findUnique: jest.fn().mockResolvedValue(inv),
            create: jest.fn(),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          stockReservation: { create: jest.fn() },
          inventoryMovement: { create: jest.fn() },
        }),
      ),
    };
    const svc = makeService(prisma);
    await expect(
      svc.reserve({ branchId: "b1", variantId: "v1", qty: 2 }),
    ).rejects.toMatchObject({ response: { code: "VERSION_CONFLICT" } });
  });
});
