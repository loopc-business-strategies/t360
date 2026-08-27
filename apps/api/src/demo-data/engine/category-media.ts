/**
 * Category-aware demo media pools.
 * Never rotate a single global pool across unrelated categories.
 */

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

/** Shared type pools (license-safe Unsplash). */
const POOLS = {
  menTees: [
    u("photo-1521572163474-6864f9cf17ab"),
    u("photo-1583743814966-8936f5b7be1a"),
    u("photo-1576566588028-4147f3842f27"),
    u("photo-1618354691373-d851c5c3c990"),
    u("photo-1562157873-818bc0726f68"),
  ],
  menShirts: [
    u("photo-1596755094514-f87e34085b2c"),
    u("photo-1602810318383-e386cc2a3ccf"),
    u("photo-1598033129183-c4f50c736f10"),
    u("photo-1620012253295-c5d1852f465e"),
  ],
  menHoodies: [
    u("photo-1556821840-3a63f95609a7"),
    u("photo-1620799140408-edc6dcb6d633"),
    u("photo-1578768079052-aa76e5058fe8"),
    u("photo-1509942772901-7630589a4f12"),
  ],
  menJackets: [
    u("photo-1551028719-00167b16eac5"),
    u("photo-1591047139829-d91aecb6caea"),
    u("photo-1548126032-079a0fb0099d"),
    u("photo-1521223890158-f9f7c3d5d504"),
  ],
  menBottoms: [
    u("photo-1542272454315-4c01d7ab9144"),
    u("photo-1473966968600-fa801b869a1a"),
    u("photo-1624378439575-d8705ad7efc4"),
    u("photo-1506629082955-511b1aa78283"),
  ],
  menShorts: [
    u("photo-1591195853828-11db59a44f6b"),
    u("photo-1565084888279-aca607ecce0c"),
    u("photo-1519238263530-99bdd11df2ea"),
  ],
  menActive: [
    u("photo-1571019614242-c5c5dee9f50b"),
    u("photo-1517836357463-d25dfeac3438"),
    u("photo-1534438327276-14e5300c3a48"),
  ],
  menAccessories: [
    u("photo-1523275335684-37898b6baf30"),
    u("photo-1627123424574-724758594e93"),
    u("photo-1553062407-98eeb64c6a62"),
  ],
  womenTees: [
    u("photo-1503342217505-b0a15ec77ed5"),
    u("photo-1489987707025-afc232f7ea0f"),
    u("photo-1554568218-0f1715e72254"),
    u("photo-1434389677669-e08b4cac3105"),
  ],
  womenTops: [
    u("photo-1487222477894-8943e31ef7b2"),
    u("photo-1594633312681-425c7b97ccd1"),
    u("photo-1564257631407-4deb1f99d992"),
    u("photo-1515886657613-9f3515b0c78f"),
  ],
  womenDresses: [
    u("photo-1496747611176-843222e1e57c"),
    u("photo-1515372039744-b8f02a3ae446"),
    u("photo-1572804013309-59a88b7e92f1"),
    u("photo-1595777457583-95e059d581b8"),
    u("photo-1566174053879-31528523f8ae"),
  ],
  womenHoodies: [
    u("photo-1578587018452-892bacefd3f2"),
    u("photo-1556821840-3a63f95609a7"),
    u("photo-1620799140188-3b2a02fd9a77"),
  ],
  womenJackets: [
    u("photo-1548126032-079a0fb0099d"),
    u("photo-1483985988355-763728e1935b"),
    u("photo-1591047139829-d91aecb6caea"),
  ],
  womenBottoms: [
    u("photo-1541099649105-f69ad21f3246"),
    u("photo-1584370848010-d7cdb331668c"),
    u("photo-1506629082955-511b1aa78283"),
    u("photo-1594633313593-bab3825d0cfc"),
  ],
  womenSkirts: [
    u("photo-1583496661160-fb5886a0aaaa"),
    u("photo-1577900232427-18219b9166a0"),
    u("photo-1558171813-4c0880cf959e"),
  ],
  womenActive: [
    u("photo-1518310383802-640c2de311b2"),
    u("photo-1571019614242-c5c5dee9f50b"),
    u("photo-1518611012118-696072aa579a"),
  ],
  womenAccessories: [
    u("photo-1591561954557-26941169b49e"),
    u("photo-1584917865442-de89df76afd3"),
    u("photo-1611923134239-b9be5816e23c"),
  ],
  kidsTees: [
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1519238263530-99bdd11df2ea"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1471286174890-9c112ffca5b4"),
  ],
  kidsHoodies: [
    u("photo-1519238263530-99bdd11df2ea"),
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1489710437720-ebb67ec84dd2"),
  ],
  kidsBottoms: [
    u("photo-1519457431-44ccd64a579b"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1471286174890-9c112ffca5b4"),
  ],
  kidsDresses: [
    u("photo-1518831959646-742c3a14ebf7"),
    u("photo-1622290291468-a28f7a7dc6a8"),
    u("photo-1515488042361-ee00e0ddd4e4"),
  ],
  kidsSleep: [
    u("photo-1515488042361-ee00e0ddd4e4"),
    u("photo-1503454537195-1dcabb73ffb9"),
  ],
  kidsAccessories: [
    u("photo-1515488042361-ee00e0ddd4e4"),
    u("photo-1503919547998-4c22e5bb7e32"),
  ],
  sarees: [
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1483985988355-763728e1935b"),
  ],
  lehengas: [
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1496747611176-843222e1e57c"),
    u("photo-1610030469983-98e550d6193c"),
  ],
  sherwanis: [
    u("photo-1594938298603-c8148c4dae35"),
    u("photo-1552374196-1ab2a1c593e8"),
    u("photo-1602810318383-e386cc2a3ccf"),
  ],
  kurtas: [
    u("photo-1594938298603-c8148c4dae35"),
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1552374196-1ab2a1c593e8"),
  ],
  festivalSets: [
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1594938298603-c8148c4dae35"),
  ],
  festivalAccessories: [
    u("photo-1591561954557-26941169b49e"),
    u("photo-1584917865442-de89df76afd3"),
  ],
  genericMen: [
    u("photo-1487222477894-8943e31ef7b2"),
    u("photo-1552374196-1ab2a1c593e8"),
    u("photo-1509631179647-0177331693ae"),
  ],
  genericWomen: [
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1483985988355-763728e1935b"),
  ],
  genericKids: [
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1503454537195-1dcabb73ffb9"),
  ],
  generic: [
    u("photo-1445205170230-053b83016050"),
    u("photo-1467043232772-3e1e5bfae434"),
    u("photo-1554568218-0f1715e72254"),
  ],
} as const;

type PoolKey = keyof typeof POOLS;

/** Leaf slug → primary pool. */
const LEAF_POOL: Record<string, PoolKey> = {
  "men-t-shirts": "menTees",
  "men-oversized-tees": "menTees",
  "men-graphic-tees": "menTees",
  "men-polos": "menShirts",
  "men-casual-shirts": "menShirts",
  "men-formal-shirts": "menShirts",
  "men-linen-shirts": "menShirts",
  "men-hoodies": "menHoodies",
  "men-sweatshirts": "menHoodies",
  "men-jackets": "menJackets",
  "men-bombers": "menJackets",
  "men-denim-jackets": "menJackets",
  "men-jeans": "menBottoms",
  "men-chinos": "menBottoms",
  "men-cargos": "menBottoms",
  "men-joggers": "menBottoms",
  "men-shorts": "menShorts",
  "men-activewear": "menActive",
  "men-accessories": "menAccessories",
  "women-t-shirts": "womenTees",
  "women-tops": "womenTops",
  "women-blouses": "womenTops",
  "women-casual-dresses": "womenDresses",
  "women-maxi-dresses": "womenDresses",
  "women-mini-dresses": "womenDresses",
  "women-hoodies": "womenHoodies",
  "women-sweatshirts": "womenHoodies",
  "women-jackets": "womenJackets",
  "women-denim-jackets": "womenJackets",
  "women-jeans": "womenBottoms",
  "women-wide-leg": "womenBottoms",
  "women-cargos": "womenBottoms",
  "women-leggings": "womenBottoms",
  "women-joggers": "womenBottoms",
  "women-shorts": "womenBottoms",
  "women-skirts": "womenSkirts",
  "women-activewear": "womenActive",
  "women-accessories": "womenAccessories",
  "kids-boys": "kidsTees",
  "kids-girls": "kidsDresses",
  "kids-t-shirts": "kidsTees",
  "kids-graphic-tees": "kidsTees",
  "kids-polos": "kidsTees",
  "kids-shirts": "kidsTees",
  "kids-hoodies": "kidsHoodies",
  "kids-sweatshirts": "kidsHoodies",
  "kids-jackets": "kidsHoodies",
  "kids-jeans": "kidsBottoms",
  "kids-joggers": "kidsBottoms",
  "kids-shorts": "kidsBottoms",
  "kids-dresses": "kidsDresses",
  "kids-activewear": "kidsTees",
  "kids-sleepwear": "kidsSleep",
  "kids-accessories": "kidsAccessories",
  "sarees-silk": "sarees",
  "sarees-cotton": "sarees",
  "sarees-party": "sarees",
  "sarees-everyday": "sarees",
  "wedding-lehengas": "lehengas",
  "wedding-sherwanis": "sherwanis",
  "wedding-kurta-sets": "kurtas",
  "wedding-reception": "lehengas",
  "festival-kurtas": "kurtas",
  "festival-dresses": "womenDresses",
  "festival-sets": "festivalSets",
  "festival-accessories": "festivalAccessories",
};

/** Explicit sibling fallbacks before segment/generic. */
const FALLBACK_LEAF: Record<string, string> = {
  "women-mini-dresses": "women-casual-dresses",
  "women-maxi-dresses": "women-casual-dresses",
  "men-oversized-tees": "men-t-shirts",
  "men-graphic-tees": "men-t-shirts",
  "men-bombers": "men-jackets",
  "men-denim-jackets": "men-jackets",
  "men-sweatshirts": "men-hoodies",
  "women-denim-jackets": "women-jackets",
  "women-sweatshirts": "women-hoodies",
  "kids-graphic-tees": "kids-t-shirts",
  "sarees-cotton": "sarees-silk",
  "sarees-party": "sarees-silk",
  "sarees-everyday": "sarees-silk",
};

const SEGMENT_POOL: Record<string, PoolKey> = {
  men: "genericMen",
  women: "genericWomen",
  kids: "genericKids",
  sarees: "sarees",
  wedding: "lehengas",
  festival: "festivalSets",
};

const SEGMENT_VIDEOS: Record<string, string[]> = {
  men: [
    "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_30fps.mp4",
    "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_30fps.mp4",
  ],
  women: [
    "https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4",
    "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_30fps.mp4",
  ],
  kids: ["https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_30fps.mp4"],
  sarees: ["https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4"],
  wedding: ["https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4"],
  festival: ["https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_30fps.mp4"],
};

function resolvePool(categorySlug: string, segment: string): readonly string[] {
  const direct = LEAF_POOL[categorySlug];
  if (direct) return POOLS[direct];

  const via = FALLBACK_LEAF[categorySlug];
  if (via && LEAF_POOL[via]) return POOLS[LEAF_POOL[via]];

  const segKey = SEGMENT_POOL[segment];
  if (segKey) return POOLS[segKey];

  return POOLS.generic;
}

/** Deterministic 4 stills for a category leaf. */
export function getDemoImagesForCategory(
  categorySlug: string,
  segment: string,
  productIndex: number,
): string[] {
  const pool = resolvePool(categorySlug, segment);
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    out.push(pool[(productIndex * 4 + i) % pool.length]);
  }
  return out;
}

export function getDemoVideoForCategory(segment: string, productIndex: number): string | null {
  const pool = SEGMENT_VIDEOS[segment] ?? SEGMENT_VIDEOS.men;
  if (!pool?.length) return null;
  return pool[productIndex % pool.length];
}

/** Expected keyword tokens for integrity checks (any match OK). */
export function expectedNameTokens(categorySlug: string): string[] {
  if (categorySlug.includes("saree")) return ["saree"];
  if (categorySlug.includes("lehenga")) return ["lehenga"];
  if (categorySlug.includes("sherwani")) return ["sherwani"];
  if (categorySlug.includes("kurta")) return ["kurta"];
  if (categorySlug.includes("dress")) return ["dress"];
  if (categorySlug.includes("t-shirt") || categorySlug.includes("tee")) return ["t-shirt", "tee"];
  if (categorySlug.includes("polo")) return ["polo"];
  if (categorySlug.includes("hoodie")) return ["hoodie"];
  if (categorySlug.includes("sweat")) return ["sweat"];
  if (categorySlug.includes("jacket") || categorySlug.includes("bomber")) return ["jacket", "bomber"];
  if (categorySlug.includes("jean")) return ["jean"];
  if (categorySlug.includes("chino")) return ["chino"];
  if (categorySlug.includes("cargo")) return ["cargo"];
  if (categorySlug.includes("jogger")) return ["jogger"];
  if (categorySlug.includes("short")) return ["short"];
  if (categorySlug.includes("skirt")) return ["skirt"];
  if (categorySlug.includes("legging")) return ["legging"];
  if (categorySlug.includes("blouse")) return ["blouse"];
  if (categorySlug.includes("top")) return ["top"];
  if (categorySlug.includes("shirt")) return ["shirt"];
  if (categorySlug.includes("accessor")) return ["accessor", "bag", "belt", "watch"];
  if (categorySlug.includes("active")) return ["active", "sport"];
  if (categorySlug.includes("sleep")) return ["sleep", "pyjama", "pajama"];
  if (categorySlug.includes("wide-leg")) return ["wide", "pant"];
  if (categorySlug.includes("boys") || categorySlug.includes("girls")) return ["kids", "boy", "girl"];
  return [];
}

export function buildDemoProductName(
  segment: string,
  leafSlug: string,
  leafName: string,
  n: number,
): string {
  const adjectives = [
    "Essential",
    "Studio",
    "City",
    "Weekend",
    "Luxe",
    "Air",
    "Core",
    "Motion",
    "Heritage",
    "Nova",
  ];
  const adj = adjectives[n % adjectives.length];
  const segLabel =
    segment === "men"
      ? "Men's"
      : segment === "women"
        ? "Women's"
        : segment === "kids"
          ? "Kids"
          : segment === "sarees"
            ? ""
            : segment === "wedding"
              ? "Wedding"
              : segment === "festival"
                ? "Festive"
                : "";

  if (leafSlug.includes("saree")) {
    const kind = leafSlug.includes("silk")
      ? "Silk Saree"
      : leafSlug.includes("cotton")
        ? "Cotton Saree"
        : leafSlug.includes("party")
          ? "Party Saree"
          : "Everyday Saree";
    return `T360 ${adj} ${kind} ${n + 1}`;
  }
  if (leafSlug.includes("lehenga")) return `T360 ${adj} Bridal Lehenga ${n + 1}`;
  if (leafSlug.includes("sherwani")) return `T360 ${adj} Sherwani ${n + 1}`;
  if (leafSlug.includes("kurta")) return `T360 ${adj} Kurta Set ${n + 1}`;

  const gendered =
    segment === "men" || segment === "women"
      ? `${segLabel} ${leafName}`.replace(/\s+/g, " ").trim()
      : segment === "kids"
        ? `Kids ${leafName}`
        : leafName;

  return `T360 ${adj} ${gendered} ${n + 1}`;
}

export function buildDemoDescription(leafSlug: string, segment: string, name: string): string {
  let body: string;
  if (leafSlug.includes("saree")) {
    body = "Premium saree with an elegant traditional finish.";
  } else if (leafSlug.includes("lehenga")) {
    body = "Festive bridal-style lehenga designed for wedding occasions.";
  } else if (leafSlug.includes("sherwani")) {
    body = "Classic sherwani crafted for wedding and celebration wear.";
  } else if (leafSlug.includes("kurta")) {
    body = "Comfortable ethnic kurta set suited for festive gatherings.";
  } else if (leafSlug.includes("dress")) {
    body =
      segment === "kids"
        ? "Comfortable kids dress designed for everyday play and occasions."
        : "Elegant women's dress designed for casual and occasion styling.";
  } else if (leafSlug.includes("t-shirt") || leafSlug.includes("tee") || leafSlug.includes("polo")) {
    body =
      segment === "kids"
        ? "Comfortable kidswear designed for everyday movement and play."
        : "Premium cotton T-shirt designed for everyday casual wear.";
  } else if (leafSlug.includes("shirt") || leafSlug.includes("blouse") || leafSlug.includes("top")) {
    body = "Refined top designed for versatile day-to-evening styling.";
  } else if (leafSlug.includes("hoodie") || leafSlug.includes("sweat")) {
    body = "Soft fleece layering piece for everyday comfort.";
  } else if (leafSlug.includes("jacket") || leafSlug.includes("bomber")) {
    body = "Structured outerwear designed for seasonal layering.";
  } else if (
    leafSlug.includes("jean") ||
    leafSlug.includes("chino") ||
    leafSlug.includes("cargo") ||
    leafSlug.includes("jogger") ||
    leafSlug.includes("wide-leg") ||
    leafSlug.includes("legging")
  ) {
    body = "Well-cut bottoms designed for all-day comfort and fit.";
  } else if (leafSlug.includes("skirt")) {
    body = "Flattering skirt designed for casual and dressed-up looks.";
  } else if (leafSlug.includes("short")) {
    body = "Easy shorts designed for warm-weather wear.";
  } else if (leafSlug.includes("active")) {
    body = "Performance-ready activewear for training and movement.";
  } else if (leafSlug.includes("sleep")) {
    body = "Soft sleepwear designed for restful comfort.";
  } else if (leafSlug.includes("accessor")) {
    body = "Finishing accessory to complete the look.";
  } else if (segment === "kids") {
    body = "Comfortable kidswear designed for everyday movement and play.";
  } else {
    body = "Premium apparel designed for everyday wear.";
  }
  return `${name}. ${body} Part of the T360 demo catalog.`;
}

/** Exported for tests. */
export const __test = { LEAF_POOL, FALLBACK_LEAF, resolvePool, POOLS };
