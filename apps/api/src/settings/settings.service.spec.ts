import { storefrontHeroSchema, storefrontUpdateSchema } from "@t360/validation";
import { SettingsService } from "./settings.service";

describe("storefrontHeroSchema", () => {
  const valid = {
    imageUrl: "https://example.com/hero.jpg",
    en: { headline: "Celebrate", support: "Family fashion", ctaLabel: "Shop" },
    ta: { headline: "கொண்டாட்டம்", support: "குடும்ப ஆடைகள்" },
  };

  it("accepts valid hero", () => {
    expect(storefrontHeroSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing headline", () => {
    const bad = {
      ...valid,
      en: { headline: "", support: "x" },
    };
    expect(storefrontHeroSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects non-url image", () => {
    expect(storefrontHeroSchema.safeParse({ ...valid, imageUrl: "not-a-url" }).success).toBe(false);
  });

  it("wraps hero in update schema", () => {
    expect(storefrontUpdateSchema.safeParse({ hero: valid }).success).toBe(true);
  });
});

describe("SettingsService.updateStorefront", () => {
  it("upserts hero and audits", async () => {
    const prisma = {
      systemSetting: {
        upsert: jest.fn().mockResolvedValue({ id: "setting-1", key: "storefront.hero" }),
        findUnique: jest.fn().mockImplementation(({ where }: { where: { key: string } }) => {
          if (where.key === "storefront.hero") {
            return Promise.resolve({
              value: {
                imageUrl: "https://example.com/h.jpg",
                en: { headline: "H", support: "S" },
                ta: { headline: "T", support: "TS" },
              },
            });
          }
          if (where.key === "storefront.sections") {
            return Promise.resolve(null);
          }
          if (where.key === "business.name") {
            return Promise.resolve({ value: "Tharagai Readymades" });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const audit = { log: jest.fn().mockResolvedValue({}) };
    const redis = { ping: jest.fn().mockResolvedValue("PONG") };
    const service = new SettingsService(prisma as never, audit as never, redis as never);

    const result = await service.updateStorefront(
      {
        hero: {
          imageUrl: "https://example.com/h.jpg",
          en: { headline: "H", support: "S" },
          ta: { headline: "T", support: "TS" },
        },
      },
      "actor-1",
    );

    expect(prisma.systemSetting.upsert).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "actor-1",
        action: "settings.storefront.update",
        entityType: "SystemSetting",
      }),
    );
    expect(result.businessName).toBe("Tharagai Readymades");
    expect(result.hero).toMatchObject({ imageUrl: "https://example.com/h.jpg" });
    expect(Array.isArray(result.sections)).toBe(true);
  });
});
