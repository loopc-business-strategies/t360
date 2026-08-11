import { Injectable } from "@nestjs/common";
import type { StorefrontUpdateInput } from "@t360/validation";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

const HERO_KEY = "storefront.hero";
const BUSINESS_NAME_KEY = "business.name";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getStorefront() {
    const hero = await this.prisma.systemSetting.findUnique({ where: { key: HERO_KEY } });
    const name = await this.prisma.systemSetting.findUnique({ where: { key: BUSINESS_NAME_KEY } });
    const commerceKeys = [
      "commerce.codEnabled",
      "commerce.shippingFee",
      "commerce.freeShippingAbove",
    ];
    const commerceRows = await this.prisma.systemSetting.findMany({
      where: { key: { in: commerceKeys } },
    });
    const commerce = Object.fromEntries(
      commerceRows.map((r) => [r.key.replace("commerce.", ""), r.value]),
    );
    return {
      businessName: (name?.value as string) ?? "Tharagai Readymades",
      hero: (hero?.value as Record<string, unknown> | null) ?? null,
      commerce: {
        codEnabled: Boolean(commerce.codEnabled ?? true),
        shippingFee: Number(commerce.shippingFee ?? 49),
        freeShippingAbove: Number(commerce.freeShippingAbove ?? 999),
        paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
      },
    };
  }

  async updateStorefront(input: StorefrontUpdateInput, actorId?: string) {
    const value = input.hero as unknown as Prisma.InputJsonValue;
    const row = await this.prisma.systemSetting.upsert({
      where: { key: HERO_KEY },
      create: { key: HERO_KEY, value },
      update: { value },
    });
    await this.audit.log({
      actorId,
      action: "settings.storefront.update",
      entityType: "SystemSetting",
      entityId: row.id,
      metadata: { key: HERO_KEY },
    });
    return this.getStorefront();
  }
}
