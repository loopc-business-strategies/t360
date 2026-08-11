import { ConflictException } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";

describe("WishlistService", () => {
  it("rejects duplicate add", async () => {
    const customers = {
      requireCustomer: jest.fn().mockResolvedValue({ id: "c1" }),
    };
    const prisma = {
      productVariant: {
        findFirst: jest.fn().mockResolvedValue({ id: "v1" }),
      },
      wishlistItem: {
        create: jest.fn().mockRejectedValue(new Error("unique")),
      },
    };
    const audit = { log: jest.fn() };
    const svc = new WishlistService(prisma as never, customers as never, audit as never);
    await expect(svc.add("u1", "v1")).rejects.toBeInstanceOf(ConflictException);
  });

  it("adds wishlist item", async () => {
    const customers = {
      requireCustomer: jest.fn().mockResolvedValue({ id: "c1" }),
    };
    const item = { id: "w1", variantId: "v1" };
    const prisma = {
      productVariant: {
        findFirst: jest.fn().mockResolvedValue({ id: "v1" }),
      },
      wishlistItem: {
        create: jest.fn().mockResolvedValue(item),
      },
    };
    const audit = { log: jest.fn() };
    const svc = new WishlistService(prisma as never, customers as never, audit as never);
    await expect(svc.add("u1", "v1")).resolves.toEqual(item);
    expect(audit.log).toHaveBeenCalled();
  });
});
