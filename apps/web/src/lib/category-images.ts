import { API_URL } from "./catalog-api";

const u = (id: string, w = 900, h = 1125) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export type CategorySegment = "women" | "men" | "kids" | "wedding" | "festival";

/** Segment-neutral fallbacks — never cross gender/category semantics. */
export const SEGMENT_NEUTRAL_IMAGES: Record<CategorySegment, string> = {
  women: u("photo-1490481651871-ab68de25d43d", 900, 1125),
  men: u("photo-1596755094514-f87e34085b2c", 900, 1125),
  kids: u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  wedding: u("photo-1583391733956-3750e0ff4e8b", 900, 1125),
  festival: u("photo-1515886657613-9f3515b0c78f", 900, 1125),
};

/** Curated slug → image (aligned with demo media pools where possible). */
export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // Homepage tiles
  "women-chudidars": u("photo-1583391733956-3750e0ff4e8b", 900, 1125),
  "women-kurtis": u("photo-1490481651871-ab68de25d43d", 900, 1125),
  "women-casual-dresses": u("photo-1496747611176-843222e1e57c", 900, 1125),
  "men-casual-shirts": u("photo-1596755094514-f87e34085b2c", 900, 1125),
  "men-t-shirts": u("photo-1521572163474-6864f9cf17ab", 900, 1125),
  "men-jeans": u("photo-1473966968600-fa801b869a1a", 900, 1125),
  "kids-ethnic": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),

  // Women ethnic
  "women-salwar-sets": u("photo-1583391733956-3750e0ff4e8b", 900, 1125),
  "women-anarkali": u("photo-1583391733956-3750e0ff4e8b", 900, 1125),
  "women-palazzo-sets": u("photo-1583391733956-3750e0ff4e8b", 900, 1125),
  "women-ethnic-sets": u("photo-1583391733956-3750e0ff4e8b", 900, 1125),

  // Women western
  "women-tops": u("photo-1490481651871-ab68de25d43d", 900, 1125),
  "women-blouses": u("photo-1490481651871-ab68de25d43d", 900, 1125),
  "women-jeans": u("photo-1496747611176-843222e1e57c", 900, 1125),
  "women-leggings": u("photo-1496747611176-843222e1e57c", 900, 1125),
  "women-maxi-dresses": u("photo-1496747611176-843222e1e57c", 900, 1125),
  "women-party-dresses": u("photo-1496747611176-843222e1e57c", 900, 1125),

  // Men
  "men-formal-shirts": u("photo-1602810318383-e386cc2a3ccf", 900, 1125),
  "men-linen-shirts": u("photo-1596755094514-f87e34085b2c", 900, 1125),
  "men-polos": u("photo-1521572163474-6864f9cf17ab", 900, 1125),
  "men-oversized-tees": u("photo-1521572163474-6864f9cf17ab", 900, 1125),
  "men-graphic-tees": u("photo-1521572163474-6864f9cf17ab", 900, 1125),
  "men-chinos": u("photo-1473966968600-fa801b869a1a", 900, 1125),
  "men-cargos": u("photo-1473966968600-fa801b869a1a", 900, 1125),
  "men-joggers": u("photo-1473966968600-fa801b869a1a", 900, 1125),
  "men-kurtas": u("photo-1596755094514-f87e34085b2c", 900, 1125),
  "men-kurta-sets": u("photo-1596755094514-f87e34085b2c", 900, 1125),
  "men-nehru-jackets": u("photo-1596755094514-f87e34085b2c", 900, 1125),

  // Kids
  "kids-boys": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  "kids-girls": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  "kids-t-shirts": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  "kids-shirts": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  "kids-dresses": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  "kids-frocks": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  "kids-jeans": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
  "kids-joggers": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),

  // Wedding / festival
  "wedding-lehengas": SEGMENT_NEUTRAL_IMAGES.wedding,
  "wedding-sherwanis": SEGMENT_NEUTRAL_IMAGES.wedding,
  "wedding-reception": SEGMENT_NEUTRAL_IMAGES.wedding,
  "festival-kurtas": SEGMENT_NEUTRAL_IMAGES.festival,
  "festival-dresses": SEGMENT_NEUTRAL_IMAGES.festival,
  "festival-sets": SEGMENT_NEUTRAL_IMAGES.festival,
};

/** Sibling slug fallbacks before segment neutral (mirrors demo media resolver). */
const SIBLING_FALLBACK: Record<string, string> = {
  "women-mini-dresses": "women-casual-dresses",
  "women-maxi-dresses": "women-casual-dresses",
  "women-party-dresses": "women-casual-dresses",
  "women-salwar-sets": "women-chudidars",
  "women-anarkali": "women-kurtis",
  "women-palazzo-sets": "women-ethnic-sets",
  "men-oversized-tees": "men-t-shirts",
  "men-graphic-tees": "men-t-shirts",
  "men-polos": "men-casual-shirts",
  "men-formal-shirts": "men-casual-shirts",
  "men-linen-shirts": "men-casual-shirts",
  "men-chinos": "men-jeans",
  "men-cargos": "men-jeans",
  "men-joggers": "men-jeans",
  "men-kurta-sets": "men-kurtas",
  "men-nehru-jackets": "men-kurtas",
  "kids-graphic-tees": "kids-t-shirts",
  "kids-frocks": "kids-dresses",
  "kids-ethnic": "kids-dresses",
};

/** Full-length fashion hero — desktop (wide). Non-saree ethnic/fashion still. */
export const HERO_DESKTOP_IMAGE =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&h=1200&q=80";

/** Portrait hero for mobile (2:3). */
export const HERO_MOBILE_IMAGE =
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&h=1200&q=80";

export const DEFAULT_SHOP_CATEGORY_SLUGS = [
  "women-chudidars",
  "women-kurtis",
  "women-casual-dresses",
  "men-casual-shirts",
  "men-t-shirts",
  "men-jeans",
  "kids-ethnic",
  "wedding-lehengas",
] as const;

export function getCategorySegment(slug: string): CategorySegment {
  if (slug.startsWith("wedding")) return "wedding";
  if (slug.startsWith("festival")) return "festival";
  if (slug.startsWith("men")) return "men";
  if (slug.startsWith("kids")) return "kids";
  if (slug.startsWith("women")) return "women";
  return "women";
}

export function getCategoryImageUrl(slug: string): string {
  if (CATEGORY_IMAGE_MAP[slug]) return CATEGORY_IMAGE_MAP[slug];

  const sibling = SIBLING_FALLBACK[slug];
  if (sibling && CATEGORY_IMAGE_MAP[sibling]) return CATEGORY_IMAGE_MAP[sibling];

  return SEGMENT_NEUTRAL_IMAGES[getCategorySegment(slug)];
}

export async function fetchCategoryImageFromCatalog(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/products?category=${encodeURIComponent(slug)}&pageSize=1`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{ images?: Array<{ url: string }> }>;
    };
    const url = json.data?.[0]?.images?.[0]?.url;
    return url ?? null;
  } catch {
    return null;
  }
}

/** Resolve image: curated map → catalog product → segment neutral. */
export async function resolveCategoryImageUrl(slug: string): Promise<string> {
  const direct = getCategoryImageUrl(slug);
  if (CATEGORY_IMAGE_MAP[slug] || SIBLING_FALLBACK[slug]) return direct;

  const fromCatalog = await fetchCategoryImageFromCatalog(slug);
  if (fromCatalog) return fromCatalog;

  return direct;
}
