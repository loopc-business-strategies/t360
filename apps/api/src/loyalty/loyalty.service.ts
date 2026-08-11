import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { calcLoyaltyEarn, calcLoyaltyRedeem } from "../crm/crm.utils";

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async ensureAccount(customerId: string) {
    return this.prisma.loyaltyAccount.upsert({
      where: { customerId },
      create: { customerId },
      update: {},
    });
  }

  async getMe(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw new NotFoundException({ code: "CUSTOMER_NOT_FOUND", message: "Customer not found" });
    }
    const account = await this.ensureAccount(customer.id);
    const recent = await this.prisma.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return { ...account, recent };
  }

  async getAdmin(customerId: string) {
    const account = await this.ensureAccount(customerId);
    const recent = await this.prisma.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { ...account, recent };
  }

  async adjust(customerId: string, delta: number, reason: string, actorId?: string) {
    if (delta === 0) {
      throw new BadRequestException({ code: "INVALID_DELTA", message: "delta cannot be 0" });
    }
    const account = await this.ensureAccount(customerId);
    const next = account.pointsBalance + delta;
    if (next < 0) {
      throw new BadRequestException({ code: "INSUFFICIENT_POINTS", message: "Balance would go negative" });
    }
    const updated = await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: next },
    });
    await this.prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        delta,
        reason,
        balanceAfter: next,
      },
    });
    await this.audit.log({
      actorId,
      action: "loyalty.adjust",
      entityType: "LoyaltyAccount",
      entityId: account.id,
      metadata: { delta, reason },
    });
    return updated;
  }

  async loadSettings() {
    const rows = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "loyalty.earnPerRupee",
            "loyalty.redeemValuePerPoint",
            "loyalty.maxRedeemPercent",
          ],
        },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      earnPerRupee: Number(map["loyalty.earnPerRupee"] ?? 1),
      redeemValuePerPoint: Number(map["loyalty.redeemValuePerPoint"] ?? 0.25),
      maxRedeemPercent: Number(map["loyalty.maxRedeemPercent"] ?? 20),
    };
  }

  async quoteRedeem(customerId: string, points: number, subtotalAfterCoupon: number) {
    const account = await this.ensureAccount(customerId);
    const settings = await this.loadSettings();
    const result = calcLoyaltyRedeem({
      points,
      balance: account.pointsBalance,
      subtotalAfterCoupon,
      valuePerPoint: settings.redeemValuePerPoint,
      maxRedeemPercent: settings.maxRedeemPercent,
    });
    if (!result.ok) {
      throw new BadRequestException({ code: "LOYALTY_REDEEM_INVALID", message: result.reason });
    }
    return result;
  }

  async redeem(customerId: string, points: number, orderId: string, discount: number) {
    if (points <= 0) return;
    const account = await this.ensureAccount(customerId);
    const next = account.pointsBalance - points;
    if (next < 0) {
      throw new BadRequestException({ code: "INSUFFICIENT_POINTS", message: "Not enough points" });
    }
    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: next },
    });
    await this.prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        delta: -points,
        reason: `Redeem on order (${discount})`,
        orderId,
        balanceAfter: next,
      },
    });
  }

  async earnForOrder(customerId: string, orderId: string, orderTotal: number) {
    const settings = await this.loadSettings();
    const points = calcLoyaltyEarn(orderTotal, settings.earnPerRupee);
    if (points <= 0) return;
    const existing = await this.prisma.loyaltyTransaction.findFirst({
      where: { orderId, delta: { gt: 0 } },
    });
    if (existing) return;
    const account = await this.ensureAccount(customerId);
    const next = account.pointsBalance + points;
    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: next },
    });
    await this.prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        delta: points,
        reason: "Order earn",
        orderId,
        balanceAfter: next,
      },
    });
  }
}
