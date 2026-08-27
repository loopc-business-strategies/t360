/**
 * Category-aware demo media pools.
 * Never rotate a single global pool across unrelated categories.
 */

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

/** Shared type pools (license-safe Unsplash). Each pool ≥6 unique URLs. */
const POOLS = {
  menTees: [
    u("photo-1521572163474-6864f9cf17ab"),
    u("photo-1583743814966-8936f5b7be1a"),
    u("photo-1576566588028-4147f3842f27"),
    u("photo-1618354691373-d851c5c3c990"),
    u("photo-1562157873-818bc0726f68"),
    u("photo-1529374255404-311a2a4f1fd9"),
    u("photo-1581655353564-df123a1eb820"),
    u("photo-1618354691438-25bc045586c5"),
    u("photo-1627225924765-552d49cf47ad"),
    u("photo-1571945155157-e3bbc7f27c0f"),
  ],
  menHoodies: [
    u("photo-1556821840-3a63f95609a7"),
    u("photo-1620799140408-edc6dcb6d633"),
    u("photo-1578768079052-aa76e5058fe8"),
    u("photo-1509942772901-7630589a4f12"),
    u("photo-1578587018452-892bacefd3f2"),
    u("photo-1620799140188-3b2a02fd9a77"),
    u("photo-1618354691373-d851c5c3c990"),
    u("photo-1529374255404-311a2a4f1fd9"),
  ],
  menJackets: [
    u("photo-1551028719-00167b16eac5"),
    u("photo-1591047139829-d91aecb6caea"),
    u("photo-1548126032-079a0fb0099d"),
    u("photo-1521223890158-f9f7c3d5d504"),
    u("photo-1544022613-e87ca75a784a"),
    u("photo-1487222477894-8943e31ef7b2"),
    u("photo-1509631179647-0177331693ae"),
    u("photo-1552374196-1ab2a1c593e8"),
  ],
  menBottoms: [
    u("photo-1542272454315-4c01d7ab9144"),
    u("photo-1473966968600-fa801b869a1a"),
    u("photo-1624378439575-d8705ad7efc4"),
    u("photo-1506629082955-511b1aa78283"),
    u("photo-1541099649105-f69ad21f3246"),
    u("photo-1584370848010-d7cdb331668c"),
    u("photo-1604176354204-9268737828e4"),
    u("photo-1591195853828-11db59a44f6b"),
  ],
  menShirts: [
    u("photo-1596755094514-f87e34085b2c"),
    u("photo-1602810318383-e386cc2a3ccf"),
    u("photo-1598033129183-c4f50c736f10"),
    u("photo-1620012253295-c5d1852f465e"),
    u("photo-1603252109303-2751441dd157"),
    u("photo-1594938298603-c8148c4dae35"),
    u("photo-1563630423918-b58f07336ac9"),
    u("photo-1521572163474-6864f9cf17ab"),
  ],
  menShorts: [
    u("photo-1591195853828-11db59a44f6b"),
    u("photo-1565084888279-aca607ecce0c"),
    u("photo-1519238263530-99bdd11df2ea"),
    u("photo-1506629082955-511b1aa78283"),
    u("photo-1542272454315-4c01d7ab9144"),
    u("photo-1624378439575-d8705ad7efc4"),
  ],
  menActive: [
    u("photo-1571019614242-c5c5dee9f50b"),
    u("photo-1517836357463-d25dfeac3438"),
    u("photo-1534438327276-14e5300c3a48"),
    u("photo-1518611012118-696072aa579a"),
    u("photo-1518310383802-640c2de311b2"),
    u("photo-1571019613454-1cb2f99b2d8b"),
  ],
  menAccessories: [
    u("photo-1523275335684-37898b6baf30"),
    u("photo-1627123424574-724758594e93"),
    u("photo-1553062407-98eeb64c6a62"),
    u("photo-1584917865442-de89df76afd3"),
    u("photo-1611923134239-b9be5816e23c"),
    u("photo-1591561954557-26941169b49e"),
  ],
  womenTees: [
    u("photo-1503342217505-b0a15ec77ed5"),
    u("photo-1489987707025-afc232f7ea0f"),
    u("photo-1554568218-0f1715e72254"),
    u("photo-1434389677669-e08b4cac3105"),
    u("photo-1515886657613-9f3515b0c78f"),
    u("photo-1564257631407-4deb1f99d992"),
    u("photo-1594633312681-425c7b97ccd1"),
    u("photo-1487222477894-8943e31ef7b2"),
  ],
  womenTops: [
    u("photo-1487222477894-8943e31ef7b2"),
    u("photo-1594633312681-425c7b97ccd1"),
    u("photo-1564257631407-4deb1f99d992"),
    u("photo-1515886657613-9f3515b0c78f"),
    u("photo-1503342217505-b0a15ec77ed5"),
    u("photo-1554568218-0f1715e72254"),
    u("photo-1434389677669-e08b4cac3105"),
    u("photo-1489987707025-afc232f7ea0f"),
  ],
  womenDresses: [
    u("photo-1496747611176-843222e1e57c"),
    u("photo-1515372039744-b8f02a3ae446"),
    u("photo-1572804013309-59a88b7e92f1"),
    u("photo-1595777457583-95e059d581b8"),
    u("photo-1566174053879-31528523f8ae"),
    u("photo-1539008835657-9e441115744e"),
    u("photo-1612336307429-8a898d10e223"),
    u("photo-1596783074918-c41064844748"),
  ],
  womenEthnic: [
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1581044777550-4cfa60707c03"),
    u("photo-1509631179647-0177331693ae"),
    u("photo-1483985988355-763728e1935b"),
    u("photo-1496747611176-843222e1e57c"),
  ],
  womenChudidar: [
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1509631179647-0177331693ae"),
    u("photo-1581044777550-4cfa60707c03"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1483985988355-763728e1935b"),
    u("photo-1572804013309-59a88b7e92f1"),
  ],
  womenKurtis: [
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1515886657613-9f3515b0c78f"),
    u("photo-1581044777550-4cfa60707c03"),
    u("photo-1509631179647-0177331693ae"),
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1566174053879-31528523f8ae"),
  ],
  womenHoodies: [
    u("photo-1578587018452-892bacefd3f2"),
    u("photo-1556821840-3a63f95609a7"),
    u("photo-1620799140188-3b2a02fd9a77"),
    u("photo-1620799140408-edc6dcb6d633"),
    u("photo-1509942772901-7630589a4f12"),
    u("photo-1578768079052-aa76e5058fe8"),
  ],
  womenJackets: [
    u("photo-1548126032-079a0fb0099d"),
    u("photo-1591047139829-d91aecb6caea"),
    u("photo-1551028719-00167b16eac5"),
    u("photo-1521223890158-f9f7c3d5d504"),
    u("photo-1544022613-e87ca75a784a"),
    u("photo-1487222477894-8943e31ef7b2"),
  ],
  womenBottoms: [
    u("photo-1541099649105-f69ad21f3246"),
    u("photo-1584370848010-d7cdb331668c"),
    u("photo-1506629082955-511b1aa78283"),
    u("photo-1594633313593-bab3825d0cfc"),
    u("photo-1542272454315-4c01d7ab9144"),
    u("photo-1604176354204-9268737828e4"),
  ],
  womenShorts: [
    u("photo-1594633313593-bab3825d0cfc"),
    u("photo-1583496661160-fb5886a0aaaa"),
    u("photo-1518310383802-640c2de311b2"),
    u("photo-1577900232427-18219b9166a0"),
    u("photo-1558171813-4c0880cf959e"),
    u("photo-1506629082955-511b1aa78283"),
  ],
  womenSkirts: [
    u("photo-1583496661160-fb5886a0aaaa"),
    u("photo-1577900232427-18219b9166a0"),
    u("photo-1558171813-4c0880cf959e"),
    u("photo-1594633313593-bab3825d0cfc"),
    u("photo-1515372039744-b8f02a3ae446"),
    u("photo-1595777457583-95e059d581b8"),
  ],
  womenActive: [
    u("photo-1518310383802-640c2de311b2"),
    u("photo-1571019614242-c5c5dee9f50b"),
    u("photo-1518611012118-696072aa579a"),
    u("photo-1517836357463-d25dfeac3438"),
    u("photo-1534438327276-14e5300c3a48"),
    u("photo-1571019613454-1cb2f99b2d8b"),
  ],
  womenAccessories: [
    u("photo-1591561954557-26941169b49e"),
    u("photo-1584917865442-de89df76afd3"),
    u("photo-1611923134239-b9be5816e23c"),
    u("photo-1523275335684-37898b6baf30"),
    u("photo-1627123424574-724758594e93"),
    u("photo-1553062407-98eeb64c6a62"),
  ],
  kidsTees: [
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1519238263530-99bdd11df2ea"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1471286174890-9c112ffca5b4"),
    u("photo-1489710437720-ebb67ec84dd2"),
    u("photo-1519457431-44ccd64a579b"),
  ],
  kidsHoodies: [
    u("photo-1519238263530-99bdd11df2ea"),
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1489710437720-ebb67ec84dd2"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1471286174890-9c112ffca5b4"),
    u("photo-1519457431-44ccd64a579b"),
  ],
  kidsBottoms: [
    u("photo-1519457431-44ccd64a579b"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1471286174890-9c112ffca5b4"),
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1519238263530-99bdd11df2ea"),
    u("photo-1489710437720-ebb67ec84dd2"),
  ],
  kidsDresses: [
    u("photo-1518831959646-742c3a14ebf7"),
    u("photo-1622290291468-a28f7a7dc6a8"),
    u("photo-1515488042361-ee00e0ddd4e4"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1471286174890-9c112ffca5b4"),
    u("photo-1503919547998-4c22e5bb7e32"),
  ],
  kidsEthnic: [
    u("photo-1515488042361-ee00e0ddd4e4"),
    u("photo-1518831959646-742c3a14ebf7"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1622290291468-a28f7a7dc6a8"),
    u("photo-1471286174890-9c112ffca5b4"),
    u("photo-1519238263530-99bdd11df2ea"),
  ],
  kidsSleep: [
    u("photo-1515488042361-ee00e0ddd4e4"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1471286174890-9c112ffca5b4"),
    u("photo-1518831959646-742c3a14ebf7"),
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1489710437720-ebb67ec84dd2"),
  ],
  kidsAccessories: [
    u("photo-1515488042361-ee00e0ddd4e4"),
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1523275335684-37898b6baf30"),
    u("photo-1591561954557-26941169b49e"),
    u("photo-1584917865442-de89df76afd3"),
    u("photo-1611923134239-b9be5816e23c"),
  ],
  sarees: [
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1509631179647-0177331693ae"),
    u("photo-1581044777550-4cfa60707c03"),
    u("photo-1483985988355-763728e1935b"),
    u("photo-1496747611176-843222e1e57c"),
    u("photo-1572804013309-59a88b7e92f1"),
    u("photo-1595777457583-95e059d581b8"),
  ],
  lehengas: [
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1496747611176-843222e1e57c"),
    u("photo-1572804013309-59a88b7e92f1"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1566174053879-31528523f8ae"),
    u("photo-1539008835657-9e441115744e"),
  ],
  sherwanis: [
    u("photo-1594938298603-c8148c4dae35"),
    u("photo-1552374196-1ab2a1c593e8"),
    u("photo-1602810318383-e386cc2a3ccf"),
    u("photo-1620012253295-c5d1852f465e"),
    u("photo-1596755094514-f87e34085b2c"),
    u("photo-1598033129183-c4f50c736f10"),
  ],
  kurtas: [
    u("photo-1594938298603-c8148c4dae35"),
    u("photo-1552374196-1ab2a1c593e8"),
    u("photo-1602810318383-e386cc2a3ccf"),
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1620012253295-c5d1852f465e"),
    u("photo-1596755094514-f87e34085b2c"),
  ],
  festivalSets: [
    u("photo-1583391733956-3750e0ff4e8b"),
    u("photo-1610030469983-98e550d6193c"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1594938298603-c8148c4dae35"),
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1509631179647-0177331693ae"),
  ],
  festivalAccessories: [
    u("photo-1591561954557-26941169b49e"),
    u("photo-1584917865442-de89df76afd3"),
    u("photo-1611923134239-b9be5816e23c"),
    u("photo-1523275335684-37898b6baf30"),
    u("photo-1627123424574-724758594e93"),
    u("photo-1553062407-98eeb64c6a62"),
  ],
  genericMen: [
    u("photo-1487222477894-8943e31ef7b2"),
    u("photo-1552374196-1ab2a1c593e8"),
    u("photo-1509631179647-0177331693ae"),
    u("photo-1521572163474-6864f9cf17ab"),
    u("photo-1596755094514-f87e34085b2c"),
    u("photo-1556821840-3a63f95609a7"),
  ],
  genericWomen: [
    u("photo-1469334031218-e382a71b716b"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1483985988355-763728e1935b"),
    u("photo-1496747611176-843222e1e57c"),
    u("photo-1515886657613-9f3515b0c78f"),
    u("photo-1503342217505-b0a15ec77ed5"),
  ],
  genericKids: [
    u("photo-1503919547998-4c22e5bb7e32"),
    u("photo-1503454537195-1dcabb73ffb9"),
    u("photo-1519238263530-99bdd11df2ea"),
    u("photo-1471286174890-9c112ffca5b4"),
    u("photo-1518831959646-742c3a14ebf7"),
    u("photo-1515488042361-ee00e0ddd4e4"),
  ],
  generic: [
    u("photo-1445205170230-053b83016050"),
    u("photo-1467043232772-3e1e5bfae434"),
    u("photo-1554568218-0f1715e72254"),
    u("photo-1483985988355-763728e1935b"),
    u("photo-1490481651871-ab68de25d43d"),
    u("photo-1469334031218-e382a71b716b"),
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
  "women-party-dresses": "womenDresses",
  "women-kurtis": "womenKurtis",
  "women-chudidars": "womenChudidar",
  "women-salwar-sets": "womenEthnic",
  "women-anarkali": "womenEthnic",
  "women-palazzo-sets": "womenEthnic",
  "women-ethnic-sets": "womenEthnic",
  "women-hoodies": "womenHoodies",
  "women-sweatshirts": "womenHoodies",
  "women-jackets": "womenJackets",
  "women-denim-jackets": "womenJackets",
  "women-jeans": "womenBottoms",
  "women-wide-leg": "womenBottoms",
  "women-cargos": "womenBottoms",
  "women-leggings": "womenBottoms",
  "women-joggers": "womenBottoms",
  "women-shorts": "womenShorts",
  "women-skirts": "womenSkirts",
  "women-activewear": "womenActive",
  "women-accessories": "womenAccessories",
  "men-kurtas": "kurtas",
  "men-kurta-sets": "kurtas",
  "men-nehru-jackets": "sherwanis",
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
  "kids-frocks": "kidsDresses",
  "kids-ethnic": "kidsEthnic",
  "kids-activewear": "kidsTees",
  "kids-sleepwear": "kidsSleep",
  "kids-accessories": "kidsAccessories",
  "sarees-silk": "sarees",
  "sarees-cotton": "sarees",
  "sarees-party": "sarees",
  "sarees-everyday": "sarees",
  "sarees-festive": "sarees",
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
  "women-party-dresses": "women-casual-dresses",
  "women-salwar-sets": "women-chudidars",
  "women-anarkali": "women-kurtis",
  "women-palazzo-sets": "women-ethnic-sets",
  "men-oversized-tees": "men-t-shirts",
  "men-graphic-tees": "men-t-shirts",
  "men-bombers": "men-jackets",
  "men-denim-jackets": "men-jackets",
  "men-sweatshirts": "men-hoodies",
  "men-kurta-sets": "men-kurtas",
  "men-nehru-jackets": "men-kurtas",
  "women-denim-jackets": "women-jackets",
  "women-sweatshirts": "women-hoodies",
  "kids-graphic-tees": "kids-t-shirts",
  "kids-frocks": "kids-dresses",
  "kids-ethnic": "kids-dresses",
  "sarees-cotton": "sarees-silk",
  "sarees-party": "sarees-silk",
  "sarees-everyday": "sarees-silk",
  "sarees-festive": "sarees-silk",
};

const SEGMENT_POOL: Record<string, PoolKey> = {
  men: "genericMen",
  women: "genericWomen",
  kids: "genericKids",
  sarees: "sarees",
  wedding: "lehengas",
  festival: "festivalSets",
};

const TYPE_VIDEOS: Record<string, string[]> = {
  tops: [
    "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_30fps.mp4",
    "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_30fps.mp4",
  ],
  dresses: ["https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4"],
  ethnic: ["https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4"],
  saree: ["https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4"],
  bridal: ["https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4"],
  bottoms: ["https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_30fps.mp4"],
  outerwear: ["https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_30fps.mp4"],
  active: ["https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_30fps.mp4"],
};

const SEGMENT_VIDEOS: Record<string, string[]> = {
  men: TYPE_VIDEOS.tops,
  women: TYPE_VIDEOS.dresses,
  kids: ["https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_30fps.mp4"],
  sarees: TYPE_VIDEOS.saree,
  wedding: TYPE_VIDEOS.bridal,
  festival: TYPE_VIDEOS.ethnic,
};

const GENERIC_VIDEO =
  "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_30fps.mp4";

function resolvePool(categorySlug: string, segment: string): readonly string[] {
  const direct = LEAF_POOL[categorySlug];
  if (direct) return POOLS[direct];

  const via = FALLBACK_LEAF[categorySlug];
  if (via && LEAF_POOL[via]) return POOLS[LEAF_POOL[via]];

  const segKey = SEGMENT_POOL[segment];
  if (segKey) return POOLS[segKey];

  return POOLS.generic;
}

/** Allowed still URLs for a leaf (pool + explicit fallbacks) — for validation. */
export function allowedImageUrlsForCategory(categorySlug: string, segment: string): Set<string> {
  const urls = new Set<string>();
  const add = (pool: readonly string[]) => pool.forEach((u) => urls.add(u));
  add(resolvePool(categorySlug, segment));
  const via = FALLBACK_LEAF[categorySlug];
  if (via) add(resolvePool(via, segment));
  const segKey = SEGMENT_POOL[segment];
  if (segKey) add(POOLS[segKey]);
  add(POOLS.generic);
  return urls;
}

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function uniquePool(pool: readonly string[]): string[] {
  return [...new Set(pool)];
}

/**
 * Deterministic unique stills for a category leaf.
 * Stride-1 from (hash(leaf)+index) so shared type pools don't all start at 0.
 * Never pads by repeating URLs — returns up to 4 unique images.
 */
export function getDemoImagesForCategory(
  categorySlug: string,
  segment: string,
  productIndex: number,
): string[] {
  const pool = uniquePool(resolvePool(categorySlug, segment));
  if (!pool.length) return [];
  const start = (hashSlug(categorySlug) + productIndex) % pool.length;
  const out: string[] = [];
  const want = Math.min(4, pool.length);
  for (let i = 0; i < pool.length && out.length < want; i++) {
    const url = pool[(start + i) % pool.length];
    if (!out.includes(url)) out.push(url);
  }
  return out;
}

export function getDemoVideoForCategory(
  categorySlugOrSegment: string,
  productIndexOrSegment?: number | string,
  maybeIndex?: number,
): string | null {
  // New signature: (leafSlug, segment, index)
  // Legacy: (segment, index)
  let leafSlug = "";
  let segment = categorySlugOrSegment;
  let productIndex = 0;
  if (typeof productIndexOrSegment === "string") {
    leafSlug = categorySlugOrSegment;
    segment = productIndexOrSegment;
    productIndex = maybeIndex ?? 0;
  } else {
    productIndex = productIndexOrSegment ?? 0;
  }

  const typeKey = leafSlug.includes("saree")
    ? "saree"
    : leafSlug.includes("lehenga") || leafSlug.includes("sherwani") || leafSlug.includes("reception")
      ? "bridal"
      : leafSlug.includes("kurta") ||
          leafSlug.includes("chudidar") ||
          leafSlug.includes("kurti") ||
          leafSlug.includes("anarkali") ||
          leafSlug.includes("ethnic") ||
          leafSlug.includes("salwar") ||
          leafSlug.includes("palazzo")
        ? "ethnic"
        : leafSlug.includes("dress") || leafSlug.includes("frock")
          ? "dresses"
          : leafSlug.includes("jean") ||
              leafSlug.includes("chino") ||
              leafSlug.includes("cargo") ||
              leafSlug.includes("jogger") ||
              leafSlug.includes("short") ||
              leafSlug.includes("skirt") ||
              leafSlug.includes("legging")
            ? "bottoms"
            : leafSlug.includes("jacket") ||
                leafSlug.includes("hoodie") ||
                leafSlug.includes("sweat") ||
                leafSlug.includes("bomber")
              ? "outerwear"
              : leafSlug.includes("active")
                ? "active"
                : leafSlug.includes("t-shirt") ||
                    leafSlug.includes("tee") ||
                    leafSlug.includes("shirt") ||
                    leafSlug.includes("top") ||
                    leafSlug.includes("blouse") ||
                    leafSlug.includes("polo")
                  ? "tops"
                  : "";

  const typePool = typeKey ? TYPE_VIDEOS[typeKey] : undefined;
  if (typePool?.length) return typePool[productIndex % typePool.length];
  const segPool = SEGMENT_VIDEOS[segment];
  if (segPool?.length) return segPool[productIndex % segPool.length];
  return GENERIC_VIDEO;
}

export type MediaValidationResult = {
  ok: boolean;
  status: "PASS" | "MEDIA_MISMATCH" | "TRYON_MISMATCH";
  detail?: string;
};

export function validateProductMedia(product: {
  categorySlug: string;
  segment: string;
  images: Array<{ url: string; mediaType: string; isTryOnSource?: boolean; productId?: string }>;
  tryOnEnabled?: boolean;
  productId?: string;
}): MediaValidationResult {
  const stills = product.images.filter((i) => i.mediaType === "image");
  if (!stills.length) {
    return { ok: false, status: "MEDIA_MISMATCH", detail: "no_image" };
  }
  const allowed = allowedImageUrlsForCategory(product.categorySlug, product.segment);
  for (const img of stills) {
    if (!allowed.has(img.url)) {
      return { ok: false, status: "MEDIA_MISMATCH", detail: img.url };
    }
  }
  if (product.tryOnEnabled) {
    const src = stills.find((i) => i.isTryOnSource);
    if (!src) return { ok: false, status: "TRYON_MISMATCH", detail: "missing_source" };
    if (product.productId && src.productId && src.productId !== product.productId) {
      return { ok: false, status: "TRYON_MISMATCH", detail: "wrong_product" };
    }
  }
  return { ok: true, status: "PASS" };
}

/** Expected keyword tokens for integrity checks (any match OK). */
export function expectedNameTokens(categorySlug: string): string[] {
  if (categorySlug.includes("chudidar") || categorySlug.includes("churidar")) {
    return ["chudidar", "churidar"];
  }
  if (categorySlug.includes("kurti")) return ["kurti"];
  if (categorySlug.includes("salwar")) return ["salwar"];
  if (categorySlug.includes("anarkali")) return ["anarkali"];
  if (categorySlug.includes("palazzo")) return ["palazzo"];
  if (categorySlug.includes("nehru")) return ["nehru", "jacket"];
  if (categorySlug.includes("frock")) return ["frock", "dress"];
  if (categorySlug.includes("reception")) return ["reception", "wedding", "lehenga", "dress"];
  if (categorySlug.includes("ethnic") && categorySlug.includes("festival")) {
    return ["ethnic", "set", "festive"];
  }
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
  if (categorySlug.includes("ethnic")) return ["ethnic", "kids", "set"];
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
    "Embroidered",
    "Classic",
    "Premium",
    "Signature",
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
          : leafSlug.includes("festive")
            ? "Festive Saree"
            : "Everyday Saree";
    return `T360 ${adj} ${kind} ${n + 1}`;
  }
  if (leafSlug.includes("chudidar")) return `T360 ${adj} Embroidered Chudidar Set ${n + 1}`;
  if (leafSlug.includes("kurti")) return `T360 ${adj} Women's Kurti ${n + 1}`;
  if (leafSlug.includes("salwar")) return `T360 ${adj} Salwar Set ${n + 1}`;
  if (leafSlug.includes("anarkali")) return `T360 ${adj} Anarkali Suit ${n + 1}`;
  if (leafSlug.includes("palazzo")) return `T360 ${adj} Palazzo Set ${n + 1}`;
  if (leafSlug.includes("nehru")) return `T360 ${adj} Nehru Jacket ${n + 1}`;
  if (leafSlug.includes("frock")) return `T360 ${adj} Kids Frock ${n + 1}`;
  if (leafSlug.includes("lehenga")) return `T360 ${adj} Bridal Lehenga ${n + 1}`;
  if (leafSlug.includes("sherwani")) return `T360 ${adj} Sherwani ${n + 1}`;
  if (leafSlug.includes("kurta")) return `T360 ${adj} Kurta Set ${n + 1}`;
  if (leafSlug.includes("reception")) return `T360 ${adj} Wedding Reception Wear ${n + 1}`;

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
    body =
      "Premium saree with blouse-ready finish, crafted for traditional and festive occasions.";
  } else if (leafSlug.includes("chudidar")) {
    body =
      "Women's embroidered chudidar set designed for festive and traditional occasions.";
  } else if (leafSlug.includes("kurti")) {
    body = "Elegant women's kurti designed for everyday ethnic and festive wear.";
  } else if (leafSlug.includes("salwar")) {
    body = "Complete salwar set with comfortable fit for festive gatherings.";
  } else if (leafSlug.includes("anarkali")) {
    body = "Flowy anarkali suit crafted for celebrations and wedding guests.";
  } else if (leafSlug.includes("palazzo")) {
    body = "Ethnic palazzo set designed for comfort and festive styling.";
  } else if (leafSlug.includes("nehru")) {
    body = "Classic Nehru jacket for festive and wedding occasions.";
  } else if (leafSlug.includes("lehenga")) {
    body = "Festive bridal-style lehenga designed for wedding occasions.";
  } else if (leafSlug.includes("sherwani")) {
    body = "Classic sherwani crafted for wedding and celebration wear.";
  } else if (leafSlug.includes("kurta")) {
    body = "Comfortable ethnic kurta set suited for festive gatherings.";
  } else if (leafSlug.includes("reception")) {
    body = "Reception-ready wedding wear designed for evening celebrations.";
  } else if (leafSlug.includes("frock")) {
    body = "Charming kids frock designed for playdates and occasions.";
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
  } else if (leafSlug.includes("ethnic")) {
    body = "Ethnic wear designed for festivals and family celebrations.";
  } else if (segment === "kids") {
    body = "Comfortable kidswear designed for everyday movement and play.";
  } else {
    body = "Premium apparel designed for everyday wear.";
  }
  return `${name}. ${body} Part of the T360 demo catalog.`;
}

/** Exported for tests. */
export const __test = { LEAF_POOL, FALLBACK_LEAF, resolvePool, POOLS, TYPE_VIDEOS };
