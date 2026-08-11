import { CustomersService } from "./customers.service";

describe("CustomersService address default", () => {
  it("sets first address as default when none flagged", async () => {
    const customer = { id: "c1", userId: "u1" };
    const created = {
      id: "a1",
      customerId: "c1",
      isDefault: true,
      label: "Home",
      name: "A",
      phone: "1",
      line1: "x",
      line2: "",
      city: "Pudukkottai",
      state: "TN",
      pincode: "622001",
    };
    const prisma = {
      customer: {
        findUnique: jest.fn().mockResolvedValue(customer),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          address: {
            updateMany: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue(created),
          },
        }),
      ),
    };
    const audit = { log: jest.fn() };
    const svc = new CustomersService(prisma as never, audit as never);
    const row = await svc.createAddress("u1", {
      name: "A",
      phone: "1",
      line1: "x",
      city: "Pudukkottai",
      state: "TN",
      pincode: "622001",
    });
    expect(row.isDefault).toBe(true);
  });

  it("clears other defaults when isDefault true", async () => {
    const customer = { id: "c1", userId: "u1" };
    const updateMany = jest.fn();
    const prisma = {
      customer: {
        findUnique: jest.fn().mockResolvedValue(customer),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          address: {
            updateMany,
            count: jest.fn().mockResolvedValue(2),
            create: jest.fn().mockResolvedValue({ id: "a2", isDefault: true }),
          },
        }),
      ),
    };
    const audit = { log: jest.fn() };
    const svc = new CustomersService(prisma as never, audit as never);
    await svc.createAddress("u1", {
      name: "B",
      phone: "2",
      line1: "y",
      city: "Chennai",
      state: "TN",
      pincode: "600001",
      isDefault: true,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { customerId: "c1", deletedAt: null },
      data: { isDefault: false },
    });
  });
});
