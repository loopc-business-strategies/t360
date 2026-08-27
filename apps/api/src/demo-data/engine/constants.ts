export const DEMO_BATCH_ID = "T360_DEMO_001";

/** License-safe Unsplash fashion stills (stable photo IDs). */
export const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec77ed5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1467043232772-3e1e5bfae434?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80",
];

/** License-safe sample MP4s (Pexels CDN). */
export const DEMO_VIDEOS = [
  "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_30fps.mp4",
  "https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_30fps.mp4",
  "https://videos.pexels.com/video-files/5532855/5532855-sd_640_360_30fps.mp4",
];

export const COLORS: Array<{ name: string; code: string }> = [
  { name: "Black", code: "#111111" },
  { name: "White", code: "#F5F5F5" },
  { name: "Grey", code: "#8A8A8A" },
  { name: "Charcoal", code: "#36454F" },
  { name: "Navy", code: "#1B2A4A" },
  { name: "Blue", code: "#2E5AAC" },
  { name: "Sky Blue", code: "#87CEEB" },
  { name: "Green", code: "#2E7D4F" },
  { name: "Olive", code: "#6B7C3E" },
  { name: "Red", code: "#C41E3A" },
  { name: "Burgundy", code: "#6D1A2A" },
  { name: "Cream", code: "#F5F0E6" },
  { name: "Beige", code: "#D8CBB5" },
  { name: "Brown", code: "#6B4423" },
  { name: "Pink", code: "#E8A0BF" },
  { name: "Lavender", code: "#B57EDC" },
];

export const ADULT_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
export const WAIST_SIZES = ["28", "30", "32", "34", "36", "38", "40", "42"];
export const KIDS_SIZES = ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"];

export type CatDef = { name: string; slug: string; children?: Array<{ name: string; slug: string }> };

export const MEN_TREE: CatDef = {
  name: "Men",
  slug: "men",
  children: [
    { name: "T-Shirts", slug: "men-t-shirts" },
    { name: "Oversized T-Shirts", slug: "men-oversized-tees" },
    { name: "Graphic T-Shirts", slug: "men-graphic-tees" },
    { name: "Polo Shirts", slug: "men-polos" },
    { name: "Casual Shirts", slug: "men-casual-shirts" },
    { name: "Formal Shirts", slug: "men-formal-shirts" },
    { name: "Linen Shirts", slug: "men-linen-shirts" },
    { name: "Hoodies", slug: "men-hoodies" },
    { name: "Sweatshirts", slug: "men-sweatshirts" },
    { name: "Jackets", slug: "men-jackets" },
    { name: "Bomber Jackets", slug: "men-bombers" },
    { name: "Denim Jackets", slug: "men-denim-jackets" },
    { name: "Jeans", slug: "men-jeans" },
    { name: "Chinos", slug: "men-chinos" },
    { name: "Cargo Pants", slug: "men-cargos" },
    { name: "Joggers", slug: "men-joggers" },
    { name: "Shorts", slug: "men-shorts" },
    { name: "Activewear", slug: "men-activewear" },
    { name: "Kurtas", slug: "men-kurtas" },
    { name: "Kurta Sets", slug: "men-kurta-sets" },
    { name: "Nehru Jackets", slug: "men-nehru-jackets" },
    { name: "Accessories", slug: "men-accessories" },
  ],
};

export const WOMEN_TREE: CatDef = {
  name: "Women",
  slug: "women",
  children: [
    { name: "T-Shirts", slug: "women-t-shirts" },
    { name: "Tops", slug: "women-tops" },
    { name: "Blouses", slug: "women-blouses" },
    { name: "Casual Dresses", slug: "women-casual-dresses" },
    { name: "Maxi Dresses", slug: "women-maxi-dresses" },
    { name: "Mini Dresses", slug: "women-mini-dresses" },
    { name: "Party Dresses", slug: "women-party-dresses" },
    { name: "Kurtis", slug: "women-kurtis" },
    { name: "Chudidars", slug: "women-chudidars" },
    { name: "Salwar Sets", slug: "women-salwar-sets" },
    { name: "Anarkali", slug: "women-anarkali" },
    { name: "Palazzo Sets", slug: "women-palazzo-sets" },
    { name: "Ethnic Sets", slug: "women-ethnic-sets" },
    { name: "Hoodies", slug: "women-hoodies" },
    { name: "Sweatshirts", slug: "women-sweatshirts" },
    { name: "Jackets", slug: "women-jackets" },
    { name: "Denim Jackets", slug: "women-denim-jackets" },
    { name: "Jeans", slug: "women-jeans" },
    { name: "Wide-Leg Pants", slug: "women-wide-leg" },
    { name: "Cargo Pants", slug: "women-cargos" },
    { name: "Leggings", slug: "women-leggings" },
    { name: "Joggers", slug: "women-joggers" },
    { name: "Shorts", slug: "women-shorts" },
    { name: "Skirts", slug: "women-skirts" },
    { name: "Activewear", slug: "women-activewear" },
    { name: "Accessories", slug: "women-accessories" },
  ],
};

export const KIDS_TREE: CatDef = {
  name: "Kids",
  slug: "kids",
  children: [
    { name: "Boys", slug: "kids-boys" },
    { name: "Girls", slug: "kids-girls" },
    { name: "T-Shirts", slug: "kids-t-shirts" },
    { name: "Graphic T-Shirts", slug: "kids-graphic-tees" },
    { name: "Polo Shirts", slug: "kids-polos" },
    { name: "Shirts", slug: "kids-shirts" },
    { name: "Hoodies", slug: "kids-hoodies" },
    { name: "Sweatshirts", slug: "kids-sweatshirts" },
    { name: "Jackets", slug: "kids-jackets" },
    { name: "Jeans", slug: "kids-jeans" },
    { name: "Joggers", slug: "kids-joggers" },
    { name: "Shorts", slug: "kids-shorts" },
    { name: "Dresses", slug: "kids-dresses" },
    { name: "Frocks", slug: "kids-frocks" },
    { name: "Ethnic Wear", slug: "kids-ethnic" },
    { name: "Activewear", slug: "kids-activewear" },
    { name: "Sleepwear", slug: "kids-sleepwear" },
    { name: "Accessories", slug: "kids-accessories" },
  ],
};

/** Ethnic / occasion roots seeded as demo “Other” categories. */
export const OTHER_TREES: CatDef[] = [
  {
    name: "Sarees",
    slug: "sarees",
    children: [
      { name: "Silk Sarees", slug: "sarees-silk" },
      { name: "Cotton Sarees", slug: "sarees-cotton" },
      { name: "Party Sarees", slug: "sarees-party" },
      { name: "Everyday Sarees", slug: "sarees-everyday" },
      { name: "Festive Sarees", slug: "sarees-festive" },
    ],
  },
  {
    name: "Wedding",
    slug: "wedding",
    children: [
      { name: "Lehengas", slug: "wedding-lehengas" },
      { name: "Sherwanis", slug: "wedding-sherwanis" },
      { name: "Kurta Sets", slug: "wedding-kurta-sets" },
      { name: "Reception Wear", slug: "wedding-reception" },
    ],
  },
  {
    name: "Festival",
    slug: "festival",
    children: [
      { name: "Festive Kurtas", slug: "festival-kurtas" },
      { name: "Festive Dresses", slug: "festival-dresses" },
      { name: "Ethnic Sets", slug: "festival-sets" },
      { name: "Festive Accessories", slug: "festival-accessories" },
    ],
  },
];

/** Empty legacy category slugs to hide from the public tree when seeding demo. */
export const LEGACY_EMPTY_CATEGORY_SLUGS = [
  "mens-shirts",
  "womens-kurtis",
  "new-arrivals",
  "offers",
] as const;

/** @deprecated Prefer per-leaf quotas in category-meta.ts */
export const PER_GENDER_COUNT = 60;

/** @deprecated Prefer per-leaf quotas in category-meta.ts */
export const PER_OTHER_COUNT = 10;

export const COLLECTION_DEFS = [
  { name: "New Arrivals", slug: "new-arrivals", featured: true },
  { name: "Bestsellers", slug: "bestsellers", featured: true },
  { name: "Trending", slug: "trending", featured: true },
  { name: "Essentials", slug: "essentials", featured: false },
  { name: "Summer", slug: "summer", featured: false },
  { name: "Winter", slug: "winter", featured: false },
  { name: "Activewear", slug: "activewear", featured: false },
  { name: "Streetwear", slug: "streetwear", featured: false },
  { name: "Premium", slug: "premium", featured: true },
  { name: "Weekend", slug: "weekend", featured: false },
  { name: "Everyday", slug: "everyday", featured: false },
  { name: "Kids Essentials", slug: "kids-essentials", featured: false },
  { name: "Women's Edit", slug: "womens-edit", featured: true },
  { name: "Men's Edit", slug: "mens-edit", featured: true },
  { name: "Saree Edit", slug: "saree-edit", featured: true },
  { name: "Wedding Edit", slug: "wedding-edit", featured: true },
  { name: "Festive Edit", slug: "festive-edit", featured: true },
  { name: "Ethnic Edit", slug: "ethnic-edit", featured: true },
  { name: "T360 Originals", slug: "t360-originals", featured: true },
  { name: "Sale", slug: "sale", featured: true },
] as const;

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
