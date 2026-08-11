import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomersService } from "../customers/customers.service";
import { InventoryService } from "../inventory/inventory.service";
import type { CartItemAddInput } from "@t360/validation";

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
    private readonly inventory: InventoryService,
  ) {}

  async getOrCreateCart(userId: string) {
    const customer = await this.customers.requireCustomer(userId);
    let cart = await this.prisma.cart.findUnique({
      where: { customerId: customer.id },
      include: this.cartInclude(),
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customerId: customer.id },
        include: this.cartInclude(),
      });
    }
    return this.withAvailability(cart);
  }

  async addItem(userId: string, input: CartItemAddInput) {
    const cart = await this.getOrCreateCart(userId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: input.variantId, deletedAt: null, status: "active" },
      include: { product: true },
    });
    if (!variant) {
      throw new NotFoundException({ code: "VARIANT_NOT_FOUND", message: "Variant not found" });
    }
    await this.assertStock(input.variantId, input.branchId ?? undefined, input.qty);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
    });
    if (existing) {
      const qty = existing.qty + input.qty;
      await this.assertStock(input.variantId, input.branchId ?? existing.branchId ?? undefined, qty);
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty, branchId: input.branchId ?? existing.branchId },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: input.variantId,
          qty: input.qty,
          branchId: input.branchId ?? null,
        },
      });
    }
    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: string, itemId: string, qty: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException({ code: "CART_ITEM_NOT_FOUND", message: "Item not found" });
    }
    await this.assertStock(item.variantId, item.branchId ?? undefined, qty);
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException({ code: "CART_ITEM_NOT_FOUND", message: "Item not found" });
    }
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreateCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  private cartInclude() {
    return {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } } },
            },
          },
        },
      },
    };
  }

  private async withAvailability<
    T extends {
      items: Array<{
        variantId: string;
        branchId: string | null;
        qty: number;
        variant: { price: unknown; salePrice: unknown | null };
      }>;
    },
  >(cart: T) {
    const items = [];
    for (const item of cart.items) {
      const avail = await this.availableFor(item.variantId, item.branchId ?? undefined);
      const unit = Number(item.variant.salePrice ?? item.variant.price);
      items.push({
        ...item,
        unitPrice: unit,
        lineTotal: Math.round(unit * item.qty * 100) / 100,
        availableQty: avail,
        inStock: avail >= item.qty,
      });
    }
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    return { ...cart, items, subtotal };
  }

  private async availableFor(variantId: string, branchId?: string) {
    const map = await this.inventory.stockByVariantIds([variantId], branchId);
    return map.get(variantId) ?? 0;
  }

  private async assertStock(variantId: string, branchId: string | undefined, qty: number) {
    const avail = await this.availableFor(variantId, branchId);
    if (avail < qty) {
      throw new ConflictException({
        code: "INSUFFICIENT_STOCK",
        message: `Only ${avail} available`,
      });
    }
  }
}
