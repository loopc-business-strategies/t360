import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CustomersService } from "../customers/customers.service";

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string) {
    const customer = await this.customers.requireCustomer(userId);
    return this.prisma.wishlistItem.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: {
        variant: {
          include: {
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          },
        },
      },
    });
  }

  async add(userId: string, variantId: string) {
    const customer = await this.customers.requireCustomer(userId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
    });
    if (!variant) {
      throw new NotFoundException({ code: "VARIANT_NOT_FOUND", message: "Variant not found" });
    }
    try {
      const item = await this.prisma.wishlistItem.create({
        data: { customerId: customer.id, variantId },
        include: {
          variant: {
            include: {
              product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
            },
          },
        },
      });
      await this.audit.log({
        actorId: userId,
        action: "wishlist.add",
        entityType: "WishlistItem",
        entityId: item.id,
      });
      return item;
    } catch {
      throw new ConflictException({
        code: "WISHLIST_DUPLICATE",
        message: "Variant already on wishlist",
      });
    }
  }

  async remove(userId: string, variantId: string) {
    const customer = await this.customers.requireCustomer(userId);
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { customerId_variantId: { customerId: customer.id, variantId } },
    });
    if (!existing) {
      throw new NotFoundException({ code: "WISHLIST_NOT_FOUND", message: "Not on wishlist" });
    }
    await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
    await this.audit.log({
      actorId: userId,
      action: "wishlist.remove",
      entityType: "WishlistItem",
      entityId: existing.id,
    });
    return { deleted: true };
  }

  async variantIds(userId: string) {
    const customer = await this.customers.requireCustomer(userId);
    const rows = await this.prisma.wishlistItem.findMany({
      where: { customerId: customer.id },
      select: { variantId: true },
    });
    return rows.map((r) => r.variantId);
  }
}
