import type { PrismaClient } from "@prisma/client";
import { BANNED_SAREE_IMAGE_IDS } from "./constants";

const SAREE_CATEGORY_SLUGS = [
  "sarees",
  "sarees-silk",
  "sarees-cotton",
  "sarees-party",
  "sarees-everyday",
  "sarees-festive",
] as const;

/**
 * Idempotent: hide saree categories/products/collections from the public catalog.
 * Safe for order history (archives products; does not hard-delete).
 */
export async function hideSareeCatalog(prisma: PrismaClient): Promise<{
  categories: number;
  products: number;
  collections: number;
}> {
  const cats = await prisma.category.updateMany({
    where: {
      OR: [
        { slug: { in: [...SAREE_CATEGORY_SLUGS] } },
        { slug: { startsWith: "sarees-" } },
      ],
    },
    data: { status: "inactive", deletedAt: new Date() },
  });

  const sareeCats = await prisma.category.findMany({
    where: {
      OR: [
        { slug: { in: [...SAREE_CATEGORY_SLUGS] } },
        { slug: { startsWith: "sarees-" } },
      ],
    },
    select: { id: true },
  });
  const categoryIds = sareeCats.map((c) => c.id);

  const bannedImageRows = await prisma.productImage.findMany({
    where: {
      OR: BANNED_SAREE_IMAGE_IDS.map((id) => ({ url: { contains: id } })),
    },
    select: { productId: true },
  });
  const bannedImageProductIds = [...new Set(bannedImageRows.map((r) => r.productId))];

  const productFilter: Array<Record<string, unknown>> = [
    { name: { contains: "Saree", mode: "insensitive" } },
    { slug: { contains: "saree" } },
  ];
  if (categoryIds.length) {
    productFilter.unshift({ categoryId: { in: categoryIds } });
  }
  if (bannedImageProductIds.length) {
    productFilter.push({ id: { in: bannedImageProductIds } });
  }

  const result = await prisma.product.updateMany({
    where: {
      deletedAt: null,
      OR: productFilter,
    },
    data: { status: "archived", deletedAt: new Date() },
  });
  const products = result.count;

  const collections = await prisma.collection.updateMany({
    where: { slug: { in: ["saree-edit"] } },
    data: { status: "inactive", featured: false, deletedAt: new Date() },
  });

  // Strip saree category slugs from persisted storefront section settings if present.
  const sections = await prisma.systemSetting.findUnique({ where: { key: "storefront.sections" } });
  if (sections?.value && Array.isArray(sections.value)) {
    const cleaned = (sections.value as Array<Record<string, unknown>>).map((section) => {
      if (!Array.isArray(section.categorySlugs)) return section;
      const categorySlugs = (section.categorySlugs as string[]).filter(
        (s) => s !== "sarees" && !s.startsWith("sarees-"),
      );
      return { ...section, categorySlugs };
    });
    await prisma.systemSetting.update({
      where: { key: "storefront.sections" },
      data: { value: cleaned },
    });
  }

  const hero = await prisma.systemSetting.findUnique({ where: { key: "storefront.hero" } });
  if (hero?.value && typeof hero.value === "object") {
    const value = JSON.parse(JSON.stringify(hero.value)) as Record<string, unknown>;
    const en = value.en as Record<string, string> | undefined;
    const ta = value.ta as Record<string, string> | undefined;
    let changed = false;
    if (en?.support?.toLowerCase().includes("saree")) {
      en.support =
        "Premium family fashion from Pudukkottai — wedding wear, ethnic sets, and everyday elegance.";
      changed = true;
    }
    if (ta?.support?.includes("புடவை")) {
      ta.support =
        "புதுக்கோட்டையிலிருந்து உயர்தர குடும்ப ஆடைகள் — திருமண உடைகள், எத்னிக் செட்கள், அன்றாட நேர்த்தி.";
      changed = true;
    }
    if (changed) {
      await prisma.systemSetting.update({ where: { key: "storefront.hero" }, data: { value } });
    }
  }

  return { categories: cats.count, products, collections: collections.count };
}
