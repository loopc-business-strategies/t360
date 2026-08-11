import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { calcCouponDiscount } from "../crm/crm.utils";
import type { CouponCreateInput } from "@t360/validation";

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listAdmin() {
    return this.prisma.coupon.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CouponCreateInput, actorId?: string) {
    const row = await this.prisma.coupon.create({
      data: {
        code: input.code.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrder: input.minOrder ?? 0,
        maxUses: input.maxUses ?? null,
        perCustomerLimit: input.perCustomerLimit ?? 1,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        active: input.active ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: "coupon.create",
      entityType: "Coupon",
      entityId: row.id,
    });
    return row;
  }

  async update(id: string, input: Partial<CouponCreateInput>, actorId?: string) {
    const row = await this.prisma.coupon.update({
      where: { id },
      data: {
        code: input.code?.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrder: input.minOrder,
        maxUses: input.maxUses === undefined ? undefined : input.maxUses,
        perCustomerLimit: input.perCustomerLimit,
        startsAt:
          input.startsAt === undefined
            ? undefined
            : input.startsAt
              ? new Date(input.startsAt)
              : null,
        endsAt:
          input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null,
        active: input.active,
      },
    });
    await this.audit.log({
      actorId,
      action: "coupon.update",
      entityType: "Coupon",
      entityId: id,
    });
    return row;
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
    await this.audit.log({
      actorId,
      action: "coupon.delete",
      entityType: "Coupon",
      entityId: id,
    });
    return { deleted: true };
  }

  async validateForCustomer(code: string, subtotal: number, customerId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
    });
    if (!coupon || !coupon.active) {
      throw new NotFoundException({ code: "COUPON_INVALID", message: "Coupon not found" });
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException({ code: "COUPON_NOT_STARTED", message: "Coupon not active yet" });
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestException({ code: "COUPON_EXPIRED", message: "Coupon expired" });
    }
    if (coupon.maxUses != null) {
      const used = await this.prisma.couponUsage.count({ where: { couponId: coupon.id } });
      if (used >= coupon.maxUses) {
        throw new BadRequestException({ code: "COUPON_EXHAUSTED", message: "Coupon usage limit reached" });
      }
    }
    const customerUsed = await this.prisma.couponUsage.count({
      where: { couponId: coupon.id, customerId },
    });
    if (customerUsed >= coupon.perCustomerLimit) {
      throw new BadRequestException({
        code: "COUPON_CUSTOMER_LIMIT",
        message: "You already used this coupon",
      });
    }
    const result = calcCouponDiscount({
      type: coupon.type,
      value: Number(coupon.value),
      subtotal,
      minOrder: Number(coupon.minOrder),
    });
    if (!result.ok) {
      throw new BadRequestException({ code: "COUPON_MIN_ORDER", message: result.reason });
    }
    return { coupon, discount: result.discount };
  }
}
