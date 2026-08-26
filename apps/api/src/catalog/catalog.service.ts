import {
  Injectable,
  NotFoundException,
  Inject,
  Optional,
  Logger,
  forwardRef,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MEDIA_STORAGE, MediaStorage } from "../media/media-storage";
import { AuditService } from "../audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { SEARCH_PROVIDER, type SearchProvider } from "../search/providers/search-provider";
import { isUuid, parseProductCsv, slugify, validateCsvProductRow } from "./catalog.utils";
import type { ProductCreateInput, ProductListQuery } from "@t360/validation";
import { AiFashionService } from "../ai-fashion/ai-fashion.service";

const productInclude = {
  category: true,
  brand: true,
  variants: { where: { deletedAt: null }, orderBy: { sku: "asc" as const } },
  images: { orderBy: { sortOrder: "asc" as const } },
  attributes: { include: { attribute: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
    @Inject(MEDIA_STORAGE) private readonly media: MediaStorage,
    @Inject(SEARCH_PROVIDER) private readonly search: SearchProvider,
    @Optional()
    @Inject(forwardRef(() => AiFashionService))
    private readonly aiFashion?: AiFashionService,
  ) {}

  async listCategories() {
    const rows = await this.prisma.category.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return this.buildTree(rows);
  }

  async listBrands() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: { name: "asc" },
    });
  }

  async listProducts(query: ProductListQuery, opts?: { admin?: boolean }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const hit = await this.search.searchProducts(query, opts);
    const products = await this.prisma.product.findMany({
      where: { id: { in: hit.ids } },
      include: productInclude,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const ordered = hit.ids.map((id) => byId.get(id)).filter(Boolean);
    const withStock = await this.attachAvailability(ordered as typeof products, query.branch);

    return {
      items: withStock,
      meta: { page, pageSize, total: hit.total },
    };
  }

  async getProduct(slugOrId: string, opts?: { admin?: boolean; branch?: string }) {
    const product = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        ...(isUuid(slugOrId)
          ? { OR: [{ slug: slugOrId }, { id: slugOrId }] }
          : { slug: slugOrId }),
        ...(opts?.admin ? {} : { status: "published" }),
      },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Product not found" });
    }
    const [withStock] = await this.attachAvailability([product], opts?.branch);
    return withStock;
  }

  private async attachAvailability<
    T extends { id: string; variants: Array<{ id: string }> },
  >(products: T[], branch?: string) {
    const variantIds = products.flatMap((p) => p.variants.map((v) => v.id));
    let branchId: string | undefined;
    if (branch) {
      const b = await this.prisma.branch.findFirst({
        where: {
          deletedAt: null,
          OR: [{ id: branch }, { code: branch }],
        },
      });
      branchId = b?.id;
    }
    const stockMap = await this.inventory.stockByVariantIds(variantIds, branchId);
    return products.map((p) => {
      const variants = p.variants.map((v) => {
        const availableQty = stockMap.get(v.id) ?? 0;
        return {
          ...v,
          availableQty,
          inStock: availableQty > 0,
        };
      });
      const availableQty = variants.reduce((sum, v) => sum + v.availableQty, 0);
      return {
        ...p,
        variants,
        availableQty,
        inStock: availableQty > 0,
      };
    });
  }

  async createCategory(input: {
    name: string;
    slug?: string;
    parentId?: string | null;
    sortOrder?: number;
    status?: string;
  }, actorId?: string) {
    const slug = input.slug ?? slugify(input.name);
    const row = await this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        parentId: input.parentId ?? null,
        sortOrder: input.sortOrder ?? 0,
        status: input.status ?? "active",
      },
    });
    await this.audit.log({ actorId, action: "category.create", entityType: "Category", entityId: row.id });
    return row;
  }

  async updateCategory(id: string, input: Record<string, unknown>, actorId?: string) {
    const row = await this.prisma.category.update({
      where: { id },
      data: {
        name: input.name as string | undefined,
        slug: input.slug as string | undefined,
        parentId: (input.parentId as string | null | undefined) ?? undefined,
        sortOrder: input.sortOrder as number | undefined,
        status: input.status as string | undefined,
      },
    });
    await this.audit.log({ actorId, action: "category.update", entityType: "Category", entityId: id });
    return row;
  }

  async deleteCategory(id: string, actorId?: string) {
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date(), status: "inactive" } });
    await this.audit.log({ actorId, action: "category.delete", entityType: "Category", entityId: id });
    return { deleted: true };
  }

  async createBrand(input: {
    name: string;
    slug?: string;
    logoUrl?: string | null;
    status?: string;
  }, actorId?: string) {
    const slug = input.slug ?? slugify(input.name);
    const row = await this.prisma.brand.create({
      data: {
        name: input.name,
        slug,
        logoUrl: input.logoUrl ?? null,
        status: input.status ?? "active",
      },
    });
    await this.audit.log({ actorId, action: "brand.create", entityType: "Brand", entityId: row.id });
    return row;
  }

  async updateBrand(id: string, input: Record<string, unknown>, actorId?: string) {
    const row = await this.prisma.brand.update({
      where: { id },
      data: {
        name: input.name as string | undefined,
        slug: input.slug as string | undefined,
        logoUrl: input.logoUrl as string | null | undefined,
        status: input.status as string | undefined,
      },
    });
    await this.audit.log({ actorId, action: "brand.update", entityType: "Brand", entityId: id });
    return row;
  }

  async deleteBrand(id: string, actorId?: string) {
    await this.prisma.brand.update({ where: { id }, data: { deletedAt: new Date(), status: "inactive" } });
    await this.audit.log({ actorId, action: "brand.delete", entityType: "Brand", entityId: id });
    return { deleted: true };
  }

  async createProduct(input: ProductCreateInput, actorId?: string) {
    const slug = input.slug ?? slugify(input.name);
    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description ?? "",
          status: input.status ?? "draft",
          categoryId: input.categoryId,
          brandId: input.brandId ?? null,
          variants: {
            create: input.variants.map((v) => ({
              sku: v.sku,
              barcode: v.barcode ?? null,
              price: v.price,
              cost: v.cost ?? null,
              salePrice: v.salePrice ?? null,
              attributes: v.attributes ?? {},
              status: v.status ?? "active",
            })),
          },
        },
      });

      if (input.imageUrls?.length) {
        let order = 0;
        for (const url of input.imageUrls) {
          const asset = await this.media.uploadFromUrl(url);
          await tx.productImage.create({
            data: {
              productId: created.id,
              url: asset.url,
              publicId: asset.publicId,
              sortOrder: order++,
              alt: input.name,
            },
          });
        }
      }

      if (input.attributeValues?.length) {
        for (const av of input.attributeValues) {
          const def = await tx.attributeDefinition.findUnique({ where: { code: av.attributeCode } });
          if (!def) continue;
          await tx.productAttributeValue.create({
            data: { productId: created.id, attributeId: def.id, value: av.value },
          });
        }
      }

      return created;
    });

    await this.audit.log({ actorId, action: "product.create", entityType: "Product", entityId: product.id });
    const result = await this.getProduct(product.id, { admin: true });

    if (actorId && this.aiFashion) {
      void this.aiFashion
        .maybeEnqueueOnProductCreate(product.id, actorId, Boolean(input.generateAiFashion))
        .catch((err) => {
          this.logger.warn(
            `AI Fashion auto-enqueue failed: ${err instanceof Error ? err.message : "unknown"}`,
          );
        });
    }

    return result;
  }

  async updateProduct(
    id: string,
    input: Partial<ProductCreateInput> & { tryOnImageId?: string | null },
    actorId?: string,
  ) {
    await this.prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        status: input.status,
        categoryId: input.categoryId,
        brandId: input.brandId === undefined ? undefined : input.brandId,
        tryOnEnabled: input.tryOnEnabled === undefined ? undefined : input.tryOnEnabled,
      },
    });

    if (input.tryOnImageId !== undefined) {
      await this.prisma.productImage.updateMany({
        where: { productId: id },
        data: { isTryOnSource: false },
      });
      if (input.tryOnImageId) {
        await this.prisma.productImage.updateMany({
          where: { id: input.tryOnImageId, productId: id },
          data: { isTryOnSource: true },
        });
      }
    }

    if (input.imageUrls?.length) {
      const existing = await this.prisma.productImage.count({
        where: { productId: id },
      });
      let order = existing;
      for (const url of input.imageUrls) {
        const already = await this.prisma.productImage.findFirst({
          where: { productId: id, url },
        });
        if (already) continue;
        const asset = await this.media.uploadFromUrl(url);
        await this.prisma.productImage.create({
          data: {
            productId: id,
            url: asset.url,
            publicId: asset.publicId,
            sortOrder: order++,
            alt: input.name ?? undefined,
          },
        });
      }
    }

    if (input.variants?.length) {
      for (const v of input.variants) {
        await this.prisma.productVariant.upsert({
          where: { sku: v.sku },
          create: {
            productId: id,
            sku: v.sku,
            barcode: v.barcode ?? null,
            price: v.price,
            cost: v.cost ?? null,
            salePrice: v.salePrice ?? null,
            attributes: v.attributes ?? {},
            status: v.status ?? "active",
          },
          update: {
            barcode: v.barcode ?? null,
            price: v.price,
            cost: v.cost ?? null,
            salePrice: v.salePrice ?? null,
            attributes: v.attributes ?? {},
            status: v.status ?? "active",
            deletedAt: null,
          },
        });
      }
    }

    await this.audit.log({ actorId, action: "product.update", entityType: "Product", entityId: id });
    return this.getProduct(id, { admin: true });
  }

  async deleteProduct(id: string, actorId?: string) {
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" },
    });
    await this.audit.log({ actorId, action: "product.delete", entityType: "Product", entityId: id });
    return { deleted: true };
  }

  async importCsv(content: string, actorId?: string) {
    const rows = parseProductCsv(content);
    const errors: Array<{ row: number; errors: string[] }> = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors = validateCsvProductRow(row);
      if (rowErrors.length) {
        errors.push({ row: i + 2, errors: rowErrors });
        continue;
      }
      const categorySlug = row.category_slug || row.category;
      const category = await this.prisma.category.findFirst({
        where: { OR: [{ slug: categorySlug }, { name: categorySlug }], deletedAt: null },
      });
      if (!category) {
        errors.push({ row: i + 2, errors: [`category not found: ${categorySlug}`] });
        continue;
      }
      let brandId: string | null = null;
      if (row.brand_slug || row.brand) {
        const brand = await this.prisma.brand.findFirst({
          where: {
            OR: [{ slug: row.brand_slug || row.brand }, { name: row.brand_slug || row.brand }],
            deletedAt: null,
          },
        });
        brandId = brand?.id ?? null;
      }

      try {
        await this.createProduct(
          {
            name: row.name,
            slug: row.slug || undefined,
            description: row.description || "",
            status: (row.status as "draft" | "published" | "archived") || "draft",
            categoryId: category.id,
            brandId,
            variants: [
              {
                sku: row.sku,
                barcode: row.barcode || null,
                price: Number(row.price),
                salePrice: row.sale_price ? Number(row.sale_price) : null,
                attributes: {
                  ...(row.size ? { size: row.size } : {}),
                  ...(row.colour || row.color ? { colour: row.colour || row.color } : {}),
                },
              },
            ],
            imageUrls: row.image_url ? [row.image_url] : [],
          },
          actorId,
        );
        created++;
      } catch (e) {
        errors.push({
          row: i + 2,
          errors: [e instanceof Error ? e.message : "import failed"],
        });
      }
    }

    return { created, errors };
  }

  async exportCsv() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true, brand: true, variants: { where: { deletedAt: null } } },
    });
    const header = [
      "name",
      "slug",
      "category_slug",
      "brand_slug",
      "status",
      "sku",
      "barcode",
      "price",
      "sale_price",
      "size",
      "colour",
      "description",
    ];
    const lines = [header.join(",")];
    for (const p of products) {
      for (const v of p.variants) {
        const attrs = (v.attributes ?? {}) as Record<string, string>;
        lines.push(
          [
            csvEscape(p.name),
            csvEscape(p.slug),
            csvEscape(p.category.slug),
            csvEscape(p.brand?.slug ?? ""),
            csvEscape(p.status),
            csvEscape(v.sku),
            csvEscape(v.barcode ?? ""),
            String(v.price),
            v.salePrice != null ? String(v.salePrice) : "",
            csvEscape(attrs.size ?? ""),
            csvEscape(attrs.colour ?? ""),
            csvEscape(p.description),
          ].join(","),
        );
      }
    }
    return lines.join("\n");
  }

  async adminListCategories() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async adminListBrands() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  private buildTree(
    rows: Array<{ id: string; parentId: string | null; name: string; slug: string; sortOrder: number; status: string }>,
  ) {
    type Node = (typeof rows)[number] & { children: Node[] };
    const map = new Map<string, Node>();
    rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
    const roots: Node[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
