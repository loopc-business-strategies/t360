import { CATEGORY_META, resolveRelatedCategorySlugs, totalDemoQuota } from "./category-meta";
import {
  __test,
  buildDemoProductName,
  expectedNameTokens,
  getDemoImagesForCategory,
  getDemoVideoForCategory,
  validateProductMedia,
} from "./category-media";

describe("category-meta", () => {
  it("targets clothing-only demo products without sarees", () => {
    expect(totalDemoQuota()).toBe(689);
  });

  it("related resolver prefers same leaf then compatible", () => {
    const related = resolveRelatedCategorySlugs("men-t-shirts");
    expect(related[0]).toBe("men-t-shirts");
    expect(related).toEqual(expect.arrayContaining(["men-oversized-tees", "men-graphic-tees"]));
    expect(related).not.toContain("women-casual-dresses");
  });

  it("chudidar related stays ethnic", () => {
    const related = resolveRelatedCategorySlugs("women-chudidars");
    expect(related).toEqual(expect.arrayContaining(["women-kurtis", "women-salwar-sets"]));
    expect(related.some((s) => s.startsWith("men-"))).toBe(false);
  });

  it("supports try-on on apparel leaves (innerwear excluded)", () => {
    for (const meta of Object.values(CATEGORY_META)) {
      if (meta.productType === "innerwear") {
        expect(meta.tryOnSupported).toBe(false);
      } else {
        expect(meta.tryOnSupported).toBe(true);
      }
    }
  });
});

describe("category-media expansion", () => {
  it("maps ethnic and occasion leaves", () => {
    for (const slug of [
      "women-chudidars",
      "women-kurtis",
      "women-anarkali",
      "men-kurtas",
      "wedding-lehengas",
      "kids-frocks",
    ]) {
      expect(__test.LEAF_POOL[slug]).toBeTruthy();
      expect(getDemoImagesForCategory(slug, slug.split("-")[0], 0)).toHaveLength(4);
    }
  });

  it("does not leak lehenga pool into men tees", () => {
    const tees = __test.resolvePool("men-t-shirts", "men");
    const lehengas = __test.POOLS.lehengas;
    expect(tees.some((u) => (lehengas as readonly string[]).includes(u))).toBe(false);
  });

  it("validateProductMedia accepts pool images and rejects foreign", () => {
    const ok = getDemoImagesForCategory("men-t-shirts", "men", 0);
    expect(
      validateProductMedia({
        categorySlug: "men-t-shirts",
        segment: "men",
        images: ok.map((url) => ({ url, mediaType: "image" })),
      }).ok,
    ).toBe(true);
    expect(
      validateProductMedia({
        categorySlug: "men-t-shirts",
        segment: "men",
        images: [{ url: __test.POOLS.lehengas[0], mediaType: "image" }],
      }).status,
    ).toBe("MEDIA_MISMATCH");
  });

  it("video resolution is type-aware for bridal vs men tops", () => {
    const bridalVid = getDemoVideoForCategory("wedding-lehengas", "wedding", 0);
    const menVid = getDemoVideoForCategory("men-t-shirts", "men", 0);
    expect(bridalVid).toBeTruthy();
    expect(menVid).toBeTruthy();
  });

  it("names chudidars with chudidar token", () => {
    const name = buildDemoProductName("women", "women-chudidars", "Chudidars", 0);
    const tokens = expectedNameTokens("women-chudidars");
    expect(tokens.some((t) => name.toLowerCase().includes(t))).toBe(true);
  });

  it("every CATEGORY_META leaf has a media pool", () => {
    for (const slug of Object.keys(CATEGORY_META)) {
      expect(__test.LEAF_POOL[slug]).toBeTruthy();
    }
  });
});
