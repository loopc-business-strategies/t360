import { NotFoundException } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

describe("CatalogService.getProduct", () => {
  const prisma = {
    product: { findFirst: jest.fn() },
    branch: { findFirst: jest.fn() },
  };
  const inventory = {
    stockByVariantIds: jest.fn().mockResolvedValue(new Map()),
  };
  const audit = { log: jest.fn() };
  const media = {};
  const search = {};

  function createService() {
    return new CatalogService(
      prisma as never,
      audit as never,
      inventory as never,
      media as never,
      search as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries by slug only when param is not a UUID", async () => {
    const product = {
      id: "5fc9ef48-0309-4144-92a0-9f7c9e81c468",
      slug: "kids-party-dress-30",
      variants: [{ id: "v1" }],
    };
    prisma.product.findFirst.mockResolvedValue(product);
    const service = createService();
    await service.getProduct("kids-party-dress-30");
    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "kids-party-dress-30",
          deletedAt: null,
          status: "published",
        }),
      }),
    );
    const where = prisma.product.findFirst.mock.calls[0][0].where;
    expect(where.OR).toBeUndefined();
    expect(where.id).toBeUndefined();
  });

  it("queries by slug OR id when param is a UUID", async () => {
    const id = "5fc9ef48-0309-4144-92a0-9f7c9e81c468";
    prisma.product.findFirst.mockResolvedValue({
      id,
      slug: "kids-party-dress-30",
      variants: [{ id: "v1" }],
    });
    const service = createService();
    await service.getProduct(id);
    const where = prisma.product.findFirst.mock.calls[0][0].where;
    expect(where.OR).toEqual([{ slug: id }, { id }]);
  });

  it("throws NotFound when missing", async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    const service = createService();
    await expect(service.getProduct("missing-slug")).rejects.toBeInstanceOf(NotFoundException);
  });
});
