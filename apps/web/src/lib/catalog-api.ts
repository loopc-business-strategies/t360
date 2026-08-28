function resolvePublicUrl(raw: string | undefined, fallback: string): string {
  const value = raw?.trim().replace(/\/$/, "");
  if (!value) return fallback;
  try {
    const withProtocol = value.includes("://") ? value : `https://${value}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return withProtocol;
  } catch {
    /* fall through */
  }
  return fallback;
}

const API_URL = resolvePublicUrl(
  process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:4000/api/v1",
);
const SITE_URL = resolvePublicUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NODE_ENV === "production" ? "https://t360-web.vercel.app" : "http://localhost:3000",
);

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number; available?: boolean };
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  inStock?: boolean;
  availableQty?: number;
  brand?: { name: string; slug?: string } | null;
  category?: { name: string; slug: string };
  tryOnEnabled?: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  images?: Array<{
    url: string;
    alt?: string;
    mediaType?: string;
    publicId?: string | null;
    sortOrder?: number;
  }>;
  variants?: Array<{
    id: string;
    sku: string;
    price: string | number;
    salePrice?: string | number | null;
    attributes?: Record<string, string>;
    inStock?: boolean;
    availableQty?: number;
  }>;
};

export type ProductDetail = ProductListItem & {
  description: string;
  tryOnEnabled?: boolean;
};

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string | null;
  hours?: unknown;
};

export type StorefrontSection =
  | { type: "announcement"; visible: boolean; order: number; message: string; href?: string }
  | { type: "hero"; visible: boolean; order: number }
  | { type: "story"; visible: boolean; order: number }
  | {
      type: "productCarousel";
      visible: boolean;
      order: number;
      title: string;
      query: {
        sort?: string;
        categorySlug?: string;
        collectionSlug?: string;
        productIds?: string[];
        tryOnOnly?: boolean;
        isNew?: boolean;
        isBestseller?: boolean;
        isTrending?: boolean;
        isFeatured?: boolean;
        onSale?: boolean;
      };
    }
  | { type: "categoryGrid"; visible: boolean; order: number; categorySlugs?: string[] }
  | {
      type: "editorial";
      visible: boolean;
      order: number;
      imageUrl: string;
      headline: string;
      body?: string;
      ctaHref?: string;
      ctaLabel?: string;
    }
  | { type: "tryMePromo"; visible: boolean; order: number }
  | { type: "newsletter"; visible: boolean; order: number }
  | {
      type: "collection";
      visible: boolean;
      order: number;
      title: string;
      collectionSlug?: string;
      collectionId?: string;
    }
  | {
      type: "promotion" | "sale";
      visible: boolean;
      order: number;
      headline: string;
      subtitle?: string;
      imageUrl?: string;
      ctaHref?: string;
      ctaLabel?: string;
    }
  | { type: "videoHero"; visible: boolean; order: number; videoUrl?: string; ctaHref?: string; ctaLabel?: string };

export type CollectionItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type ProductReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
};

export type ProductReviewsData = {
  items: ProductReview[];
  meta: { page: number; pageSize: number; total: number };
  summary: { averageRating: number | null; reviewCount: number };
};

export type StorefrontSettings = {
  businessName: string;
  hero: {
    imageUrl?: string;
    desktopImageUrl?: string;
    mobileImageUrl?: string;
    videoUrl?: string;
    ctaHref?: string;
    en?: { headline?: string; support?: string; ctaLabel?: string; subtitle?: string };
    ta?: { headline?: string; support?: string; ctaLabel?: string; subtitle?: string };
  } | null;
  sections?: StorefrontSection[];
  commerce?: {
    codEnabled: boolean;
    shippingFee: number;
    freeShippingAbove: number;
    paymentProvider?: string;
  };
};

export async function fetchProducts(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${API_URL}/products?${qs}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Failed to load products");
  return (await res.json()) as ApiSuccess<ProductListItem[]>;
}

export async function fetchProduct(slug: string, branch?: string) {
  const qs = branch ? `?branch=${encodeURIComponent(branch)}` : "";
  const res = await fetch(`${API_URL}/products/${slug}${qs}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Product not found");
  return (await res.json()) as ApiSuccess<ProductDetail>;
}

export async function fetchCategories() {
  const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load categories");
  return (await res.json()) as ApiSuccess<CategoryNode[]>;
}

export async function fetchBrands() {
  const res = await fetch(`${API_URL}/brands`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load brands");
  return (await res.json()) as ApiSuccess<Array<{ id: string; name: string; slug: string }>>;
}

export async function fetchBranches() {
  const res = await fetch(`${API_URL}/branches`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load branches");
  return (await res.json()) as ApiSuccess<Branch[]>;
}

export async function fetchStorefront() {
  const res = await fetch(`${API_URL}/settings/storefront`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load storefront settings");
  return (await res.json()) as ApiSuccess<StorefrontSettings>;
}

export async function fetchCollections() {
  const res = await fetch(`${API_URL}/collections`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load collections");
  return (await res.json()) as ApiSuccess<CollectionItem[]>;
}

export async function fetchProductReviews(slug: string, page = 1) {
  const res = await fetch(`${API_URL}/products/${slug}/reviews?page=${page}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error("Failed to load reviews");
  return (await res.json()) as ApiSuccess<ProductReviewsData>;
}

export function productPrice(p: ProductListItem) {
  const v = p.variants?.[0];
  if (!v) return { amount: 0 };
  const amount = Number(v.salePrice ?? v.price);
  const compareAt = v.salePrice != null ? Number(v.price) : undefined;
  return { amount, compareAt };
}

export { API_URL, SITE_URL };
