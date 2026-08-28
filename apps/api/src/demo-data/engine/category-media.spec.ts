import {
  __test,
  buildDemoDescription,
  buildDemoProductName,
  expectedNameTokens,
  getDemoImagesForCategory,
  getDemoVideoForCategory,
} from "./category-media";
import { CATEGORY_META } from "./category-meta";

describe("getDemoImagesForCategory", () => {
  it("returns 4 deterministic stills for a leaf", () => {
    const a = getDemoImagesForCategory("men-t-shirts", "men", 0);
    const b = getDemoImagesForCategory("men-t-shirts", "men", 0);
    expect(a).toHaveLength(4);
    expect(a).toEqual(b);
  });

  it("does not share the same primary still across men tees and women dresses", () => {
    const men = getDemoImagesForCategory("men-t-shirts", "men", 0);
    const dresses = getDemoImagesForCategory("women-casual-dresses", "women", 0);
    expect(men[0]).not.toEqual(dresses[0]);
  });

  it("never falls back from women dresses to men shirts pool", () => {
    const dressPool = __test.resolvePool("women-casual-dresses", "women");
    const menShirtPool = __test.POOLS.menShirts;
    expect(dressPool.some((url) => menShirtPool.includes(url as never))).toBe(false);
  });

  it("maps all MEN/WOMEN/KIDS/OTHER leaves in LEAF_POOL", () => {
    const required = [
      "men-t-shirts",
      "women-casual-dresses",
      "kids-dresses",
      "sarees-silk",
      "wedding-lehengas",
      "festival-kurtas",
    ];
    for (const slug of required) {
      expect(__test.LEAF_POOL[slug]).toBeTruthy();
      expect(getDemoImagesForCategory(slug, slug.split("-")[0], 1).length).toBe(4);
    }
  });

  it("uses sibling fallback for women-mini-dresses", () => {
    expect(__test.FALLBACK_LEAF["women-mini-dresses"]).toBe("women-casual-dresses");
  });

  it("never repeats a URL inside one product gallery", () => {
    for (let i = 0; i < 12; i++) {
      const stills = getDemoImagesForCategory("men-t-shirts", "men", i);
      expect(new Set(stills).size).toBe(stills.length);
    }
  });

  it("rotates primaries across products in the same leaf", () => {
    const primaries = new Set(
      Array.from({ length: 8 }, (_, i) => getDemoImagesForCategory("men-t-shirts", "men", i)[0]),
    );
    expect(primaries.size).toBeGreaterThan(1);
  });

  it("pool size covers each leaf quota with distinct primaries", () => {
    for (const [slug, meta] of Object.entries(CATEGORY_META)) {
      const pool = __test.uniquePool(__test.resolvePool(slug, meta.segment));
      expect(pool.length).toBeGreaterThanOrEqual(meta.quota);
      const primaries = new Set(
        Array.from({ length: meta.quota }, (_, i) => getDemoImagesForCategory(slug, meta.segment, i)[0]),
      );
      expect(primaries.size).toBe(meta.quota);
    }
  });
});

describe("buildDemoProductName / description", () => {
  it("names men's t-shirts with Men's and T-Shirt", () => {
    const name = buildDemoProductName("men", "men-t-shirts", "T-Shirts", 0);
    expect(name.toLowerCase()).toContain("men");
    expect(name.toLowerCase()).toMatch(/t-shirt|t shirts/);
  });

  it("names silk sarees with Saree", () => {
    const name = buildDemoProductName("sarees", "sarees-silk", "Silk Sarees", 0);
    expect(name.toLowerCase()).toContain("saree");
  });

  it("describes dresses without everyday tee copy", () => {
    const name = buildDemoProductName("women", "women-casual-dresses", "Casual Dresses", 0);
    const desc = buildDemoDescription("women-casual-dresses", "women", name);
    expect(desc.toLowerCase()).toContain("dress");
    expect(desc).not.toMatch(/Soft premium fabric for everyday wear/);
  });

  it("expectedNameTokens align with name for key leaves", () => {
    for (const [slug, segment, leaf] of [
      ["men-t-shirts", "men", "T-Shirts"],
      ["women-casual-dresses", "women", "Casual Dresses"],
      ["kids-dresses", "kids", "Dresses"],
      ["sarees-silk", "sarees", "Silk Sarees"],
    ] as const) {
      const name = buildDemoProductName(segment, slug, leaf, 0);
      const tokens = expectedNameTokens(slug);
      const hay = name.toLowerCase();
      expect(tokens.some((t) => hay.includes(t.toLowerCase()))).toBe(true);
    }
  });

  it("demo product names are globally unique across seeded quotas", () => {
    const names: string[] = [];
    for (const [slug, meta] of Object.entries(CATEGORY_META)) {
      if (meta.quota <= 0) continue;
      for (let i = 0; i < meta.quota; i++) {
        names.push(buildDemoProductName(meta.segment, slug, slug, i));
      }
    }
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("getDemoVideoForCategory", () => {
  it("returns a stable video per segment index", () => {
    expect(getDemoVideoForCategory("men", 0)).toEqual(getDemoVideoForCategory("men", 0));
    expect(getDemoVideoForCategory("women", 1)).toBeTruthy();
  });
});
