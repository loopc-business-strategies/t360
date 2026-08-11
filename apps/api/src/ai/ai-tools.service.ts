import { ForbiddenException, Injectable } from "@nestjs/common";
import { CatalogService } from "../catalog/catalog.service";
import { InventoryService } from "../inventory/inventory.service";
import { OrdersService } from "../orders/orders.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AiToolDef } from "./providers/ai-provider";

export type ToolContext = {
  userId: string;
  audience: "customer" | "admin";
};

@Injectable()
export class AiToolsService {
  constructor(
    private readonly catalog: CatalogService,
    private readonly inventory: InventoryService,
    private readonly orders: OrdersService,
    private readonly loyalty: LoyaltyService,
    private readonly prisma: PrismaService,
  ) {}

  customerToolDefs(): AiToolDef[] {
    return [
      {
        name: "searchProducts",
        description: "Search published catalogue products with optional filters",
        parameters: {
          type: "object",
          properties: {
            q: { type: "string" },
            maxPrice: { type: "number" },
            category: { type: "string" },
            pageSize: { type: "number" },
          },
        },
      },
      {
        name: "getProduct",
        description: "Get a product by slug or id with variants",
        parameters: {
          type: "object",
          properties: { slugOrId: { type: "string" } },
          required: ["slugOrId"],
        },
      },
      {
        name: "checkStock",
        description: "Check available stock for variants matching a query",
        parameters: {
          type: "object",
          properties: { q: { type: "string" }, variantId: { type: "string" }, branchId: { type: "string" } },
        },
      },
      {
        name: "getBranchAvailability",
        description: "Per-branch availability for a product search",
        parameters: {
          type: "object",
          properties: { q: { type: "string" }, variantId: { type: "string" } },
        },
      },
      {
        name: "getOrderStatus",
        description: "Caller's order status only",
        parameters: {
          type: "object",
          properties: { orderId: { type: "string" } },
        },
      },
      {
        name: "getCustomerLoyalty",
        description: "Caller's loyalty balance and tier",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "getOffers",
        description: "Active public coupon offers",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "searchCategories",
        description: "List or filter categories",
        parameters: {
          type: "object",
          properties: { q: { type: "string" } },
        },
      },
    ];
  }

  adminToolDefs(): AiToolDef[] {
    return [
      {
        name: "salesSummary",
        description: "Sales revenue summary for recent period",
        parameters: { type: "object", properties: { days: { type: "number" } } },
      },
      {
        name: "bestSellers",
        description: "Top products by revenue",
        parameters: { type: "object", properties: { days: { type: "number" } } },
      },
      {
        name: "lowStockHighSellers",
        description: "Inventory rows at or below low-stock threshold",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "draftProductCaption",
        description: "Draft social caption from real product fields only",
        parameters: {
          type: "object",
          properties: { productId: { type: "string" }, q: { type: "string" } },
        },
      },
    ];
  }

  async execute(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const adminTools = new Set([
      "salesSummary",
      "bestSellers",
      "lowStockHighSellers",
      "draftProductCaption",
    ]);
    if (adminTools.has(name) && ctx.audience !== "admin") {
      throw new ForbiddenException({
        code: "AI_TOOL_FORBIDDEN",
        message: `Customer cannot call admin tool ${name}`,
      });
    }

    switch (name) {
      case "searchProducts":
        return this.searchProducts(args);
      case "getProduct":
        return this.getProduct(String(args.slugOrId ?? ""));
      case "checkStock":
        return this.checkStock(args);
      case "getBranchAvailability":
        return this.branchAvailability(args);
      case "getOrderStatus":
        return this.orderStatus(ctx.userId, args.orderId ? String(args.orderId) : undefined);
      case "getCustomerLoyalty":
        return this.loyalty.getMe(ctx.userId);
      case "getOffers":
        return this.getOffers();
      case "searchCategories":
        return this.searchCategories(args.q ? String(args.q) : undefined);
      case "salesSummary":
        return this.salesSummary(Number(args.days ?? 14));
      case "bestSellers":
        return this.bestSellers(Number(args.days ?? 14));
      case "lowStockHighSellers":
        return this.lowStock();
      case "draftProductCaption":
        return this.draftCaption(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private async searchProducts(args: Record<string, unknown>) {
    const result = await this.catalog.listProducts({
      q: args.q ? String(args.q) : undefined,
      maxPrice: args.maxPrice != null ? Number(args.maxPrice) : undefined,
      category: args.category ? String(args.category) : undefined,
      pageSize: args.pageSize != null ? Number(args.pageSize) : 5,
      page: 1,
      status: "published",
    });
    const list = result.items ?? [];
    return {
      items: list.slice(0, 8).map((p) => {
        const prices = (p.variants ?? []).map((v) => Number(v.salePrice ?? v.price));
        const priceFrom = prices.length ? Math.min(...prices) : null;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          priceFrom,
        };
      }),
    };
  }

  private async getProduct(slugOrId: string) {
    if (!slugOrId) return { unavailable: "Product id or slug is required." };
    try {
      const p = await this.catalog.getProduct(slugOrId);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        variants: (p.variants ?? []).map((v: { id: string; sku: string; price: unknown; availableQty?: number }) => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          availableQty: v.availableQty,
        })),
      };
    } catch {
      return { unavailable: "That product was not found in the catalogue." };
    }
  }

  private async checkStock(args: Record<string, unknown>) {
    if (args.variantId) {
      const map = await this.inventory.stockByVariantIds(
        [String(args.variantId)],
        args.branchId ? String(args.branchId) : undefined,
      );
      const qty = map.get(String(args.variantId)) ?? 0;
      return { variantId: args.variantId, availableQty: qty, inStock: qty > 0 };
    }
    const search = await this.searchProducts({ q: args.q, pageSize: 3 });
    const items = (search as { items: Array<{ id: string }> }).items;
    if (!items.length) return { unavailable: "No products found to check stock." };
    const product = await this.catalog.getProduct(items[0].id);
    const variantIds = (product.variants ?? []).map((v: { id: string }) => v.id);
    const map = await this.inventory.stockByVariantIds(
      variantIds,
      args.branchId ? String(args.branchId) : undefined,
    );
    return {
      productId: product.id,
      name: product.name,
      variants: variantIds.map((id: string) => ({
        variantId: id,
        availableQty: map.get(id) ?? 0,
      })),
    };
  }

  private async branchAvailability(args: Record<string, unknown>) {
    let variantId = args.variantId ? String(args.variantId) : "";
    if (!variantId && args.q) {
      const search = await this.searchProducts({ q: args.q, pageSize: 1 });
      const items = (search as { items: Array<{ id: string }> }).items;
      if (!items.length) return { unavailable: "No product found for branch availability." };
      const product = await this.catalog.getProduct(items[0].id);
      variantId = product.variants?.[0]?.id;
    }
    if (!variantId) return { unavailable: "variantId required." };
    const rows = await this.prisma.inventory.findMany({
      where: { variantId },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
    if (!rows.length) return { unavailable: "No inventory rows for that variant." };
    return {
      variantId,
      branches: rows.map((r) => ({
        branchId: r.branchId,
        name: r.branch.name,
        code: r.branch.code,
        availableQty: Math.max(0, r.physicalQty - r.reservedQty),
      })),
    };
  }

  private async orderStatus(userId: string, orderId?: string) {
    if (orderId) {
      try {
        const order = await this.orders.getByIdForCustomer(userId, orderId);
        return {
          id: order.id,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
        };
      } catch {
        return { unavailable: "Order not found for your account." };
      }
    }
    const list = await this.orders.listForCustomer(userId);
    if (!list.length) return { unavailable: "You have no orders yet." };
    return list.slice(0, 5).map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
    }));
  }

  private async getOffers() {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        deletedAt: null,
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      },
      take: 20,
    });
    const active = coupons.filter((c) => !c.endsAt || c.endsAt >= now);
    if (!active.length) return { unavailable: "No active public offers right now." };
    return active.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
    }));
  }

  private async searchCategories(q?: string) {
    const cats = await this.catalog.listCategories();
    const filtered = q
      ? cats.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.includes(q.toLowerCase()))
      : cats;
    return filtered.slice(0, 20).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  }

  private async salesSummary(days: number) {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - Math.min(Math.max(days, 1), 90) * 86400000);
    const paid = ["Confirmed", "Processing", "Packed", "ReadyForPickup", "OutForDelivery", "Delivered"];
    const agg = await this.prisma.order.aggregate({
      where: { createdAt: { gte: fromDate, lte: toDate }, status: { in: paid } },
      _sum: { total: true },
      _count: true,
    });
    return {
      from: fromDate,
      to: toDate,
      orderCount: agg._count,
      revenue: Number(agg._sum.total ?? 0),
    };
  }

  private async bestSellers(days: number) {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - Math.min(Math.max(days, 1), 90) * 86400000);
    const paid = ["Confirmed", "Processing", "Packed", "ReadyForPickup", "OutForDelivery", "Delivered"];
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate }, status: { in: paid } },
      include: { items: true },
    });
    const bySku = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const cur = bySku.get(item.sku) ?? { name: item.name, qty: 0, revenue: 0 };
        cur.qty += item.qty;
        cur.revenue += Number(item.lineTotal);
        bySku.set(item.sku, cur);
      }
    }
    return [...bySku.entries()]
      .map(([sku, v]) => ({ sku, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private async lowStock() {
    const rows = await this.inventory.findLowStock();
    return rows.slice(0, 25).map((r) => ({
      variantId: r.variantId,
      branchId: r.branchId,
      availableQty: r.availableQty,
      lowStockThreshold: r.lowStockThreshold,
      sku: r.variant?.sku,
      productName: r.variant?.product?.name,
    }));
  }

  private async draftCaption(args: Record<string, unknown>) {
    let productId = args.productId ? String(args.productId) : "";
    if (!productId && args.q) {
      const search = await this.searchProducts({ q: args.q, pageSize: 1 });
      productId = (search as { items: Array<{ id: string }> }).items[0]?.id ?? "";
    }
    if (!productId) return { unavailable: "Provide a productId to draft a caption." };
    const p = await this.getProduct(productId);
    if ("unavailable" in (p as object)) return p;
    const prod = p as { name: string; description?: string | null; variants?: Array<{ price: unknown }> };
    const price = prod.variants?.[0]?.price;
    return {
      productId,
      caption: `${prod.name} — ${prod.description?.slice(0, 120) ?? "Tharagai Readymades"}${
        price != null ? ` From ₹${price}.` : ""
      } Visit Tharagai Readymades, Pudukkottai.`,
      groundedFields: { name: prod.name, description: prod.description, price },
    };
  }
}
