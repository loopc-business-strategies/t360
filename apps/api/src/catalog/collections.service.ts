import { Injectable, NotFoundException } from "@nestjs/common";
import type { CollectionCreateInput, CollectionUpdateInput } from "@t360/validation";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { slugify } from "../catalog/catalog.utils";

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listPublic() {
    return this.prisma.collection.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        mobileImageUrl: true,
        featured: true,
        _count: { select: { products: true } },
      },
    });
  }

  async getBySlug(slug: string) {
    const row = await this.prisma.collection.findFirst({
      where: { slug, deletedAt: null, status: "active" },
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                images: { orderBy: { sortOrder: "asc" }, take: 2 },
                variants: { where: { deletedAt: null }, orderBy: { sku: "asc" }, take: 1 },
              },
            },
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException({ code: "COLLECTION_NOT_FOUND", message: "Collection not found" });
    }
    return row;
  }

  async adminList() {
    return this.prisma.collection.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
  }

  async create(input: CollectionCreateInput, actorId?: string) {
    const slug = input.slug ?? slugify(input.name);
    const row = await this.prisma.collection.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? "",
        imageUrl: input.imageUrl ?? null,
        mobileImageUrl: input.mobileImageUrl ?? null,
        status: input.status ?? "active",
        sortOrder: input.sortOrder ?? 0,
        featured: input.featured ?? false,
      },
    });
    if (input.productIds?.length) {
      await this.setProducts(row.id, input.productIds, actorId);
    }
    await this.audit.log({
      actorId,
      action: "collection.create",
      entityType: "Collection",
      entityId: row.id,
    });
    return this.adminGet(row.id);
  }

  async adminGet(id: string) {
    const row = await this.prisma.collection.findFirst({
      where: { id, deletedAt: null },
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: { product: { select: { id: true, name: true, slug: true, status: true } } },
        },
      },
    });
    if (!row) {
      throw new NotFoundException({ code: "COLLECTION_NOT_FOUND", message: "Collection not found" });
    }
    return row;
  }

  async update(id: string, input: CollectionUpdateInput, actorId?: string) {
    await this.adminGet(id);
    const row = await this.prisma.collection.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        imageUrl: input.imageUrl === undefined ? undefined : input.imageUrl,
        mobileImageUrl: input.mobileImageUrl === undefined ? undefined : input.mobileImageUrl,
        status: input.status,
        sortOrder: input.sortOrder,
        featured: input.featured,
      },
    });
    if (input.productIds) {
      await this.setProducts(id, input.productIds, actorId);
    }
    await this.audit.log({
      actorId,
      action: "collection.update",
      entityType: "Collection",
      entityId: id,
    });
    return this.adminGet(row.id);
  }

  async delete(id: string, actorId?: string) {
    await this.adminGet(id);
    await this.prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date(), status: "inactive" },
    });
    await this.audit.log({
      actorId,
      action: "collection.delete",
      entityType: "Collection",
      entityId: id,
    });
    return { deleted: true };
  }

  async collectionIdsForProduct(productId: string) {
    const rows = await this.prisma.collectionProduct.findMany({
      where: { productId },
      select: { collectionId: true },
    });
    return rows.map((r) => r.collectionId);
  }

  async syncProductCollections(productId: string, collectionIds: string[], actorId?: string) {
    const wanted = new Set(collectionIds);
    const current = await this.collectionIdsForProduct(productId);
    const toAdd = collectionIds.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !wanted.has(id));

    for (const collectionId of toAdd) {
      const detail = await this.adminGet(collectionId);
      const ids = detail.products.map((p) => p.productId);
      if (!ids.includes(productId)) {
        await this.setProducts(collectionId, [...ids, productId], actorId);
      }
    }
    for (const collectionId of toRemove) {
      const detail = await this.adminGet(collectionId);
      const ids = detail.products.map((p) => p.productId).filter((id) => id !== productId);
      await this.setProducts(collectionId, ids, actorId);
    }
    return this.collectionIdsForProduct(productId);
  }

  async setProducts(collectionId: string, productIds: string[], actorId?: string) {
    await this.adminGet(collectionId);
    await this.prisma.collectionProduct.deleteMany({ where: { collectionId } });
    if (productIds.length) {
      await this.prisma.collectionProduct.createMany({
        data: productIds.map((productId, i) => ({
          collectionId,
          productId,
          sortOrder: i,
        })),
        skipDuplicates: true,
      });
    }
    await this.audit.log({
      actorId,
      action: "collection.products.update",
      entityType: "Collection",
      entityId: collectionId,
      metadata: { count: productIds.length },
    });
    return this.adminGet(collectionId);
  }
}
