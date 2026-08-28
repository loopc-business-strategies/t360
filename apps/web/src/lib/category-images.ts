import { API_URL } from "./catalog-api";

const u = (id: string, w = 900, h = 1125) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Primary hero image for shop-by-category tiles (curated Unsplash stills). */
export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "sarees-silk": u("photo-1694406175780-38470288c925", 900, 1125),
  "women-chudidars": u("photo-1583391733956-3750e0ff4e8b", 900, 1125),
  "women-kurtis": u("photo-1490481651871-ab68de25d43d", 900, 1125),
  "women-casual-dresses": u("photo-1496747611176-843222e1e57c", 900, 1125),
  "men-casual-shirts": u("photo-1596755094514-f87e34085b2c", 900, 1125),
  "men-t-shirts": u("photo-1521572163474-6864f9cf17ab", 900, 1125),
  "men-jeans": u("photo-1473966968600-fa801b869a1a", 900, 1125),
  "kids-ethnic": u("photo-1515488042361-ee00e0ddd4e4", 900, 1125),
};

/** Full-length fashion hero — desktop (wide, shows full dress/saree). */
export const HERO_DESKTOP_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&h=1200&q=80";

/** Portrait hero for mobile (2:3, full saree). */
export const HERO_MOBILE_IMAGE =
  "https://images.unsplash.com/photo-1694406175780-38470288c925?auto=format&fit=crop&w=800&h=1200&q=80";

export const DEFAULT_SHOP_CATEGORY_SLUGS = [
  "sarees-silk",
  "women-chudidars",
  "women-kurtis",
  "women-casual-dresses",
  "men-casual-shirts",
  "men-t-shirts",
  "men-jeans",
  "kids-ethnic",
] as const;

export function getCategoryImageUrl(slug: string): string {
  if (CATEGORY_IMAGE_MAP[slug]) return CATEGORY_IMAGE_MAP[slug];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const fallbacks = Object.values(CATEGORY_IMAGE_MAP);
  return fallbacks[h % fallbacks.length] ?? fallbacks[0];
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
