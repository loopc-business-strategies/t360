import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  SettingsBrandingPatchInput,
  SettingsCommercePatchInput,
  SettingsGeneralPatchInput,
  SettingsStoragePatchInput,
  StorefrontUpdateInput,
} from "@t360/validation";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { AuditService } from "../audit/audit.service";

const HERO_KEY = "storefront.hero";
const BUSINESS_NAME_KEY = "business.name";

type FieldDef = {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "json" | "status";
  editable: boolean;
  description?: string;
};

const GENERAL_FIELDS: FieldDef[] = [
  { key: "business.name", label: "Store name", type: "string", editable: true },
  { key: "business.phone", label: "Phone", type: "string", editable: true },
  { key: "business.email", label: "Email", type: "string", editable: true },
  { key: "business.address", label: "Address", type: "string", editable: true },
  { key: "business.timezone", label: "Timezone", type: "string", editable: true },
  { key: "business.currency", label: "Currency", type: "string", editable: true },
  { key: "business.language", label: "Language", type: "string", editable: true },
];

const COMMERCE_FIELDS: FieldDef[] = [
  { key: "commerce.codEnabled", label: "Cash on delivery", type: "boolean", editable: true },
  { key: "commerce.shippingFee", label: "Shipping fee (₹)", type: "number", editable: true },
  {
    key: "commerce.freeShippingAbove",
    label: "Free shipping above (₹)",
    type: "number",
    editable: true,
  },
];

const STORAGE_FIELDS: FieldDef[] = [
  {
    key: "media.maxUploadBytes",
    label: "Max upload bytes",
    type: "number",
    editable: true,
    description: "Applied to admin media uploads",
  },
];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
  ) {}

  private async getValue(key: string): Promise<unknown> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  private async setValue(key: string, value: Prisma.InputJsonValue) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

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

  async getMaxUploadBytes(): Promise<number> {
    const v = await this.getValue("media.maxUploadBytes");
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? n : 12 * 1024 * 1024;
  }

  private async fieldsWithValues(defs: FieldDef[]) {
    const keys = defs.map((d) => d.key);
    const rows = await this.prisma.systemSetting.findMany({ where: { key: { in: keys } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return defs.map((d) => ({
      ...d,
      value: map[d.key] ?? this.defaultForKey(d.key),
    }));
  }

  private defaultForKey(key: string): unknown {
    const defaults: Record<string, unknown> = {
      "business.name": "Tharagai Readymades",
      "business.phone": "",
      "business.email": "",
      "business.address": "",
      "business.timezone": "Asia/Kolkata",
      "business.currency": "INR",
      "business.language": "en",
      "commerce.codEnabled": true,
      "commerce.shippingFee": 49,
      "commerce.freeShippingAbove": 999,
      "media.maxUploadBytes": 12 * 1024 * 1024,
    };
    return defaults[key] ?? null;
  }

  async getSystemStatus() {
    let database: "up" | "down" = "down";
    let redis: "up" | "down" = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }
    try {
      const pong = await this.redis.ping();
      redis = pong === "PONG" ? "up" : "down";
    } catch {
      redis = "down";
    }
    const cloudinary =
      Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim()) &&
      Boolean(process.env.CLOUDINARY_API_KEY?.trim()) &&
      Boolean(process.env.CLOUDINARY_API_SECRET?.trim());
    const fashionProvider = process.env.FASHION_AI_PROVIDER?.trim() || "disabled";
    const fashionConfigured =
      fashionProvider === "fashn" && Boolean(process.env.FASHN_API_KEY?.trim());
    const overall =
      database === "up" && redis === "up"
        ? cloudinary && fashionConfigured
          ? "healthy"
          : "warning"
        : "error";
    return {
      overall,
      database,
      redis,
      storage: {
        provider: cloudinary ? "cloudinary" : "mock",
        configured: cloudinary,
      },
      fashionAi: {
        provider: fashionProvider,
        configured: fashionConfigured,
      },
      paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
      appVersion: process.env.APP_VERSION ?? "0.0.0",
      gitSha: process.env.GIT_SHA ?? null,
    };
  }

  async getCatalog() {
    const [general, commerce, storage, storefront, system] = await Promise.all([
      this.fieldsWithValues(GENERAL_FIELDS),
      this.fieldsWithValues(COMMERCE_FIELDS),
      this.fieldsWithValues(STORAGE_FIELDS),
      this.getStorefront(),
      this.getSystemStatus(),
    ]);
    return {
      categories: [
        {
          id: "general",
          title: "General",
          description: "Store identity and localization defaults",
          fields: general,
          links: [] as Array<{ href: string; label: string }>,
        },
        {
          id: "commerce",
          title: "Commerce & shipping",
          description: "COD and shipping fee rules",
          fields: commerce,
          links: [],
        },
        {
          id: "branding",
          title: "Branding",
          description: "Storefront hero content",
          fields: [],
          branding: { hero: storefront.hero, businessName: storefront.businessName },
          links: [{ href: "/storefront", label: "Open storefront editor" }],
        },
        {
          id: "ai",
          title: "AI Fashion",
          description: "Managed in AI Fashion settings",
          fields: [],
          links: [
            { href: "/ai-fashion/settings", label: "AI Fashion settings" },
            { href: "/ai-fashion", label: "AI Fashion dashboard" },
          ],
        },
        {
          id: "tryon",
          title: "TRY ME",
          description: "Virtual try-on configuration",
          fields: [],
          links: [{ href: "/ai-fashion/try-on", label: "TRY ME settings & sessions" }],
        },
        {
          id: "storage",
          title: "Storage",
          description: "Upload limits and provider status (secrets stay server-side)",
          fields: storage,
          status: system.storage,
          links: [{ href: "/settings/media", label: "Media status" }],
        },
        {
          id: "security",
          title: "Security",
          description: "Password and sessions",
          fields: [],
          links: [
            { href: "/profile", label: "Profile & password" },
            { href: "/settings/security", label: "Security" },
          ],
        },
        {
          id: "system",
          title: "System",
          description: "Health of API dependencies",
          fields: [],
          status: system,
          links: [],
        },
      ],
    };
  }

  async patchCategory(
    category: string,
    body: Record<string, unknown>,
    actorId?: string,
  ) {
    switch (category) {
      case "general":
        return this.patchGeneral(body as SettingsGeneralPatchInput, actorId);
      case "commerce":
        return this.patchCommerce(body as SettingsCommercePatchInput, actorId);
      case "branding":
        return this.patchBranding(body as SettingsBrandingPatchInput, actorId);
      case "storage":
        return this.patchStorage(body as SettingsStoragePatchInput, actorId);
      case "system":
        throw new BadRequestException({
          code: "READ_ONLY",
          message: "System status is read-only",
        });
      case "ai":
      case "tryon":
      case "security":
        throw new BadRequestException({
          code: "USE_DEDICATED_ENDPOINT",
          message: `Use the dedicated ${category} settings screen`,
        });
      default:
        throw new BadRequestException({
          code: "UNKNOWN_CATEGORY",
          message: `Unknown settings category: ${category}`,
        });
    }
  }

  private async patchGeneral(input: SettingsGeneralPatchInput, actorId?: string) {
    const map: Array<[keyof SettingsGeneralPatchInput, string]> = [
      ["businessName", "business.name"],
      ["phone", "business.phone"],
      ["email", "business.email"],
      ["address", "business.address"],
      ["timezone", "business.timezone"],
      ["currency", "business.currency"],
      ["language", "business.language"],
    ];
    for (const [field, key] of map) {
      if (input[field] === undefined) continue;
      const raw = input[field];
      const value = (raw ?? "") as Prisma.InputJsonValue;
      await this.setValue(key, value);
    }
    await this.audit.log({
      actorId,
      action: "settings.general.update",
      entityType: "SystemSetting",
      metadata: { keys: Object.keys(input) },
    });
    return this.getCatalog();
  }

  private async patchCommerce(input: SettingsCommercePatchInput, actorId?: string) {
    if (input.codEnabled !== undefined) {
      await this.setValue("commerce.codEnabled", input.codEnabled);
    }
    if (input.shippingFee !== undefined) {
      await this.setValue("commerce.shippingFee", input.shippingFee);
    }
    if (input.freeShippingAbove !== undefined) {
      await this.setValue("commerce.freeShippingAbove", input.freeShippingAbove);
    }
    await this.audit.log({
      actorId,
      action: "settings.commerce.update",
      entityType: "SystemSetting",
      metadata: { keys: Object.keys(input) },
    });
    return this.getCatalog();
  }

  private async patchBranding(input: SettingsBrandingPatchInput, actorId?: string) {
    if (input.hero) {
      await this.updateStorefront({ hero: input.hero }, actorId);
    }
    return this.getCatalog();
  }

  private async patchStorage(input: SettingsStoragePatchInput, actorId?: string) {
    if (input.maxUploadBytes !== undefined) {
      await this.setValue("media.maxUploadBytes", input.maxUploadBytes);
    }
    await this.audit.log({
      actorId,
      action: "settings.storage.update",
      entityType: "SystemSetting",
      metadata: { keys: Object.keys(input) },
    });
    return this.getCatalog();
  }
}
