import type { CategoryNode } from "../../lib/catalog-api";

export type MenuGroup = {
  title: string;
  slugs: string[];
  shopAllHref?: string;
};

export const WOMEN_MENU_GROUPS: MenuGroup[] = [
  {
    title: "Ethnic",
    shopAllHref: "/women?category=women-chudidars",
    slugs: [
      "women-chudidars",
      "women-salwar-sets",
      "women-anarkali",
      "women-kurtis",
      "women-palazzo-sets",
      "women-ethnic-sets",
    ],
  },
  {
    title: "Western",
    shopAllHref: "/women",
    slugs: [
      "women-t-shirts",
      "women-tops",
      "women-casual-dresses",
      "women-jeans",
      "women-leggings",
      "women-jackets",
    ],
  },
  {
    title: "Innerwear",
    shopAllHref: "/women?category=women-bras",
    slugs: ["women-bras", "women-panties", "women-camisoles", "women-shapewear"],
  },
];

export const MEN_MENU_GROUPS: MenuGroup[] = [
  {
    title: "T-Shirts",
    shopAllHref: "/men?category=men-t-shirts",
    slugs: ["men-t-shirts", "men-oversized-tees", "men-graphic-tees", "men-polos"],
  },
  {
    title: "Shirts",
    shopAllHref: "/men?category=men-casual-shirts",
    slugs: ["men-casual-shirts", "men-formal-shirts", "men-linen-shirts"],
  },
  {
    title: "Outerwear",
    shopAllHref: "/men?category=men-jackets",
    slugs: ["men-jackets", "men-bombers", "men-denim-jackets", "men-hoodies"],
  },
  {
    title: "Bottoms",
    shopAllHref: "/men?category=men-jeans",
    slugs: ["men-jeans", "men-chinos", "men-cargos", "men-joggers"],
  },
  {
    title: "Ethnic",
    shopAllHref: "/men?category=men-kurtas",
    slugs: ["men-kurtas", "men-kurta-sets", "men-nehru-jackets"],
  },
  {
    title: "Innerwear",
    shopAllHref: "/men?category=men-boxers",
    slugs: ["men-boxers", "men-briefs", "men-vests"],
  },
];

export const KIDS_MENU_GROUPS: MenuGroup[] = [
  {
    title: "Boys",
    shopAllHref: "/kids?category=kids-boys",
    slugs: [
      "kids-boys",
      "kids-t-shirts",
      "kids-shirts",
      "kids-jeans",
      "kids-joggers",
      "kids-ethnic",
    ],
  },
  {
    title: "Girls",
    shopAllHref: "/kids?category=kids-girls",
    slugs: [
      "kids-girls",
      "kids-frocks",
      "kids-dresses",
      "kids-ethnic",
      "kids-jackets",
    ],
  },
  {
    title: "Essentials",
    shopAllHref: "/kids?category=kids-innerwear",
    slugs: ["kids-innerwear", "kids-sleepwear", "kids-activewear"],
  },
];

export function categoryHref(slug: string): string {
  if (slug.startsWith("wedding") || slug.startsWith("festival")) {
    return `/categories/${slug}`;
  }
  if (slug.startsWith("men-")) return `/men/${slug.slice(4)}`;
  if (slug.startsWith("women-")) return `/women/${slug.slice(6)}`;
  if (slug.startsWith("kids-")) return `/kids/${slug.slice(5)}`;
  return `/categories/${slug}`;
}

export function findCategory(categories: CategoryNode[], slug: string): CategoryNode | null {
  for (const c of categories) {
    if (c.slug === slug) return c;
    if (c.children?.length) {
      const hit = findCategory(c.children, slug);
      if (hit) return hit;
    }
  }
  return null;
}

export function resolveGroupLinks(
  categories: CategoryNode[],
  group: MenuGroup,
): Array<{ href: string; label: string }> {
  const links: Array<{ href: string; label: string }> = [];
  const seen = new Set<string>();

  for (const slug of group.slugs) {
    const node = findCategory(categories, slug);
    if (!node || seen.has(node.slug)) continue;
    seen.add(node.slug);
    links.push({ href: categoryHref(node.slug), label: node.name });
  }

  return links;
}
