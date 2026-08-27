import type { PrismaClient } from "@prisma/client";
import {
  ADULT_SIZES,
  COLLECTION_DEFS,
  COLORS,
  DEMO_BATCH_ID,
  DEMO_IMAGES,
  DEMO_VIDEOS,
  KIDS_SIZES,
  KIDS_TREE,
  MEN_TREE,
  WAIST_SIZES,
  WOMEN_TREE,
  slugify,
  type CatDef,
} from "./constants";

type SeedResult = {
  products: number;
  categories: number;
  collections: number;
  images: number;
  videos: number;
  tryMe: number;
  variants: number;
};

function priceFor(kind: string, i: number): { price: number; salePrice: number | null } {
  const base =
    kind.includes("jacket") || kind.includes("bomber")
      ? 2999 + (i % 5) * 800
      : kind.includes("hoodie") || kind.includes("sweat")
        ? 1999 + (i % 4) * 500
        : kind.includes("dress") || kind.includes("maxi") || kind.includes("mini")
          ? 1499 + (i % 5) * 700
          : kind.includes("jean") || kind.includes("chino") || kind.includes("cargo") || kind.includes("pant")
            ? 1499 + (i % 4) * 600
            : kind.includes("kids")
              ? 699 + (i % 5) * 300
              : 999 + (i % 6) * 350;
  const onSale = i % 4 === 0;
  return {
    price: base,
    salePrice: onSale ? Math.round(base * 0.85) : null,
  };
}

function sizesFor(slug: string, gender: "men" | "women" | "kids"): string[] {
  if (gender === "kids") return KIDS_SIZES.slice(0, 5);
  if (slug.includes("jean") || slug.includes("chino") || slug.includes("cargo") || slug.includes("pant")) {
    return WAIST_SIZES.slice(1, 6);
  }
  if (slug.includes("accessor")) return ["ONE"];
  return ADULT_SIZES.slice(1, 6); // XS–XXL subset
}

function tryMeEligible(slug: string): boolean {
  if (slug.includes("accessor") || slug.includes("sleepwear")) return false;
  return (
    slug.includes("t-shirt") ||
    slug.includes("tee") ||
    slug.includes("shirt") ||
    slug.includes("hoodie") ||
    slug.includes("dress") ||
    slug.includes("top") ||
    slug.includes("blouse") ||
    slug.includes("polo") ||
    slug.includes("sweat")
  );
}

function productName(gender: string, leafName: string, n: number): string {
  const adjectives = ["Essential", "Studio", "City", "Weekend", "Luxe", "Air", "Core", "Motion", "Heritage", "Nova"];
  const adj = adjectives[n % adjectives.length];
  return `T360 ${adj} ${leafName} ${n + 1}`;
}

async function upsertTree(
  prisma: PrismaClient,
  tree: CatDef,
  sortBase: number,
): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  const root = await prisma.category.upsert({
    where: { slug: tree.slug },
    create: {
      name: tree.name,
      slug: tree.slug,
      sortOrder: sortBase,
      status: "active",
      isDemo: true,
      seedBatchId: DEMO_BATCH_ID,
    },
    update: {
      name: tree.name,
      status: "active",
      deletedAt: null,
      isDemo: true,
      seedBatchId: DEMO_BATCH_ID,
    },
  });
  ids[tree.slug] = root.id;
  const children = tree.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        parentId: root.id,
        sortOrder: i + 1,
        status: "active",
        isDemo: true,
        seedBatchId: DEMO_BATCH_ID,
      },
      update: {
        name: c.name,
        parentId: root.id,
        status: "active",
        deletedAt: null,
        isDemo: true,
        seedBatchId: DEMO_BATCH_ID,
      },
    });
    ids[c.slug] = row.id;
  }
  return ids;
}

function leafPlans(
  gender: "men" | "women" | "kids",
  tree: CatDef,
  total: number,
): Array<{ leafSlug: string; leafName: string; index: number }> {
  const children = tree.children ?? [];
  const plans: Array<{ leafSlug: string; leafName: string; index: number }> = [];
  let n = 0;
  while (plans.length < total) {
    const leaf = children[n % children.length];
    const localIndex = Math.floor(n / children.length);
    plans.push({ leafSlug: leaf.slug, leafName: leaf.name, index: localIndex });
    n++;
  }
  return plans;
}

async function softDeleteLegacyDemo(prisma: PrismaClient) {
  const legacy = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { description: { startsWith: "Demo catalogue product" } },
        { AND: [{ isDemo: false }, { slug: { startsWith: "kids-party-dress" } }] },
      ],
      seedBatchId: null,
    },
    select: { id: true },
  });
  if (!legacy.length) return;
  const ids = legacy.map((p) => p.id);
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date(), status: "archived" },
  });
}

export async function seedDemoCatalog(prisma: PrismaClient): Promise<SeedResult> {
  await softDeleteLegacyDemo(prisma);

  await prisma.brand.upsert({
    where: { slug: "t360-originals" },
    create: { name: "T360 Originals", slug: "t360-originals", status: "active" },
    update: { name: "T360 Originals", status: "active", deletedAt: null },
  });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "t360-originals" } });

  const menIds = await upsertTree(prisma, MEN_TREE, 0);
  const womenIds = await upsertTree(prisma, WOMEN_TREE, 1);
  const kidsIds = await upsertTree(prisma, KIDS_TREE, 2);
  const categoryCount =
    3 +
    (MEN_TREE.children?.length ?? 0) +
    (WOMEN_TREE.children?.length ?? 0) +
    (KIDS_TREE.children?.length ?? 0);

  const collectionIds: Record<string, string> = {};
  for (let i = 0; i < COLLECTION_DEFS.length; i++) {
    const c = COLLECTION_DEFS[i];
    const row = await prisma.collection.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        description: `${c.name} — T360 demo collection`,
        status: "active",
        sortOrder: i,
        featured: c.featured,
        isDemo: true,
        seedBatchId: DEMO_BATCH_ID,
        imageUrl: DEMO_IMAGES[i % DEMO_IMAGES.length],
      },
      update: {
        name: c.name,
        status: "active",
        deletedAt: null,
        featured: c.featured,
        isDemo: true,
        seedBatchId: DEMO_BATCH_ID,
      },
    });
    collectionIds[c.slug] = row.id;
  }

  const menPlans = leafPlans("men", MEN_TREE, 40);
  const womenPlans = leafPlans("women", WOMEN_TREE, 40);
  const kidsPlans = leafPlans("kids", KIDS_TREE, 40);

  type Built = {
    id: string;
    slug: string;
    gender: "men" | "women" | "kids";
    leafSlug: string;
    tryOn: boolean;
    flags: { isNew: boolean; isBestseller: boolean; isTrending: boolean; isFeatured: boolean; onSale: boolean };
  };
  const built: Built[] = [];
  let imageCount = 0;
  let videoCount = 0;
  let tryMeCount = 0;
  let variantCount = 0;
  let globalIndex = 0;
  const stockQueue: Array<{ variantId: string; qty: number }> = [];

  async function createProduct(
    gender: "men" | "women" | "kids",
    plan: { leafSlug: string; leafName: string; index: number },
    catIds: Record<string, string>,
  ) {
    const name = productName(gender, plan.leafName, plan.index);
    const slug = slugify(`t360-demo-${gender}-${plan.leafSlug}-${plan.index + 1}`);
    const { price, salePrice } = priceFor(plan.leafSlug, plan.index);
    const tryOn = tryMeEligible(plan.leafSlug) && plan.index % 2 === 0;
    const flags = {
      isNew: globalIndex % 5 === 0,
      isBestseller: globalIndex % 7 === 0,
      isTrending: globalIndex % 6 === 0,
      isFeatured: globalIndex % 8 === 0,
      onSale: salePrice != null,
    };
    const colors = [
      COLORS[globalIndex % COLORS.length],
      COLORS[(globalIndex + 3) % COLORS.length],
      ...(plan.index % 3 === 0 ? [COLORS[(globalIndex + 7) % COLORS.length]] : []),
    ];
    const sizes = sizesFor(plan.leafSlug, gender);
    const imgBase = globalIndex % DEMO_IMAGES.length;

    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        name,
        slug,
        description: `${name}. Soft premium fabric for everyday wear. Part of the T360 demo catalog (${DEMO_BATCH_ID}).`,
        status: "published",
        categoryId: catIds[plan.leafSlug],
        brandId: brand.id,
        tryOnEnabled: tryOn,
        isDemo: true,
        seedBatchId: DEMO_BATCH_ID,
        isNew: flags.isNew,
        isBestseller: flags.isBestseller,
        isTrending: flags.isTrending,
        isFeatured: flags.isFeatured,
      },
      update: {
        name,
        description: `${name}. Soft premium fabric for everyday wear. Part of the T360 demo catalog (${DEMO_BATCH_ID}).`,
        status: "published",
        categoryId: catIds[plan.leafSlug],
        brandId: brand.id,
        tryOnEnabled: tryOn,
        deletedAt: null,
        isDemo: true,
        seedBatchId: DEMO_BATCH_ID,
        isNew: flags.isNew,
        isBestseller: flags.isBestseller,
        isTrending: flags.isTrending,
        isFeatured: flags.isFeatured,
      },
    });

    // Replace images for idempotency
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const stills = [0, 1, 2, 3].map((o) => DEMO_IMAGES[(imgBase + o) % DEMO_IMAGES.length]);
    for (let i = 0; i < stills.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: stills[i],
          publicId: `demo/${DEMO_BATCH_ID}/${slug}/${i}`,
          alt: `${name} view ${i + 1}`,
          mediaType: "image",
          isTryOnSource: tryOn && i === 0,
          sortOrder: i,
        },
      });
      imageCount++;
    }
    if (flags.isFeatured || globalIndex % 5 === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: DEMO_VIDEOS[globalIndex % DEMO_VIDEOS.length],
          publicId: `demo/${DEMO_BATCH_ID}/${slug}/video`,
          alt: `${name} video`,
          mediaType: "video",
          isTryOnSource: false,
          sortOrder: 10,
        },
      });
      videoCount++;
    }

    // Variants: wipe demo SKUs for this product then recreate
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: product.id },
      select: { id: true },
    });
    if (existingVariants.length) {
      const vids = existingVariants.map((v) => v.id);
      await prisma.inventory.deleteMany({ where: { variantId: { in: vids } } });
      await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    }

    let skuN = 0;
    for (const color of colors) {
      for (const size of sizes) {
        skuN++;
        const sku = `T360-D-${gender[0].toUpperCase()}${String(globalIndex + 1).padStart(3, "0")}-${size}-${color.name.slice(0, 3).toUpperCase()}-${skuN}`;
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            price,
            salePrice: salePrice ?? undefined,
            attributes: { size, colour: color.name, colorCode: color.code },
            status: "active",
          },
        });
        variantCount++;
        let qty = 12 + ((skuN * 3 + globalIndex) % 30);
        if (size === "XXS" || size === "3XL" || size === "2Y") qty = 2;
        if (globalIndex % 17 === 0 && size === "M") qty = 0;
        if (globalIndex % 11 === 0 && size === "S") qty = 3;
        stockQueue.push({ variantId: variant.id, qty });
      }
    }

    if (tryOn) tryMeCount++;
    built.push({
      id: product.id,
      slug,
      gender,
      leafSlug: plan.leafSlug,
      tryOn,
      flags,
    });
    globalIndex++;
  }

  for (const p of menPlans) await createProduct("men", p, menIds);
  for (const p of womenPlans) await createProduct("women", p, womenIds);
  for (const p of kidsPlans) await createProduct("kids", p, kidsIds);

  // Ensure demo branch
  const branch = await prisma.branch.upsert({
    where: { code: "PDK01" },
    create: {
      code: "PDK01",
      name: "Pudukkottai Flagship",
      address: "Demo Branch, Pudukkottai",
      status: "active",
    },
    update: { status: "active", deletedAt: null },
  });

  for (const s of stockQueue) {
    await prisma.inventory.upsert({
      where: { branchId_variantId: { branchId: branch.id, variantId: s.variantId } },
      create: {
        branchId: branch.id,
        variantId: s.variantId,
        physicalQty: s.qty,
        reservedQty: 0,
      },
      update: { physicalQty: s.qty, reservedQty: 0 },
    });
  }

  // Collection memberships
  for (const b of built) {
    const links: string[] = [];
    if (b.flags.isNew) links.push("new-arrivals");
    if (b.flags.isBestseller) links.push("bestsellers");
    if (b.flags.isTrending) links.push("trending");
    if (b.flags.isFeatured) links.push("t360-originals");
    if (b.flags.onSale) links.push("sale");
    if (b.gender === "men") links.push("mens-edit");
    if (b.gender === "women") links.push("womens-edit");
    if (b.gender === "kids") links.push("kids-essentials");
    if (b.leafSlug.includes("active")) links.push("activewear");
    if (b.leafSlug.includes("hoodie") || b.leafSlug.includes("graphic") || b.leafSlug.includes("oversized")) {
      links.push("streetwear");
    }
    links.push("everyday");
    if (b.leafSlug.includes("linen") || b.leafSlug.includes("short") || b.leafSlug.includes("maxi")) {
      links.push("summer");
    }
    if (b.leafSlug.includes("jacket") || b.leafSlug.includes("hoodie") || b.leafSlug.includes("sweat")) {
      links.push("winter");
    }
    if (b.flags.isFeatured) links.push("premium");
    links.push("weekend");
    links.push("essentials");

    for (const colSlug of [...new Set(links)]) {
      const collectionId = collectionIds[colSlug];
      if (!collectionId) continue;
      await prisma.collectionProduct.upsert({
        where: { collectionId_productId: { collectionId, productId: b.id } },
        create: { collectionId, productId: b.id, sortOrder: 0 },
        update: {},
      });
    }
  }

  // Sparse demo reviews (no real customers — skip if no customer; create placeholder customer)
  let demoCustomer = await prisma.customer.findFirst({
    where: { name: "T360 Demo Reviewer" },
  });
  if (!demoCustomer) {
    const user = await prisma.user.upsert({
      where: { mobile: "+919999000001" },
      create: {
        mobile: "+919999000001",
        status: "active",
      },
      update: { status: "active", deletedAt: null },
    });
    demoCustomer = await prisma.customer.upsert({
      where: { userId: user.id },
      create: { userId: user.id, name: "T360 Demo Reviewer" },
      update: { name: "T360 Demo Reviewer" },
    });
  }
  for (let i = 0; i < Math.min(20, built.length); i++) {
    const p = built[i * 3] ?? built[i];
    if (!p) continue;
    await prisma.productReview.upsert({
      where: { productId_customerId: { productId: p.id, customerId: demoCustomer.id } },
      create: {
        productId: p.id,
        customerId: demoCustomer.id,
        rating: 4 + (i % 2),
        title: "Great fit",
        body: "Demo review — soft fabric and true to size.",
        status: "approved",
      },
      update: { status: "approved", rating: 4 + (i % 2) },
    });
  }

  return {
    products: built.length,
    categories: categoryCount,
    collections: COLLECTION_DEFS.length,
    images: imageCount,
    videos: videoCount,
    tryMe: tryMeCount,
    variants: variantCount,
  };
}

export async function removeDemoCatalog(prisma: PrismaClient): Promise<{ removedProducts: number }> {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { seedBatchId: DEMO_BATCH_ID },
        { AND: [{ isDemo: true }, { seedBatchId: DEMO_BATCH_ID }] },
        { description: { startsWith: "Demo catalogue product" } },
      ],
    },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  if (productIds.length) {
    const variants = await prisma.productVariant.findMany({
      where: { productId: { in: productIds } },
      select: { id: true },
    });
    const variantIds = variants.map((v) => v.id);
    if (variantIds.length) {
      await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
      await prisma.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
      await prisma.wishlistItem.deleteMany({ where: { variantId: { in: variantIds } } });
    }
    await prisma.productReview.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.collectionProduct.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productAttributeValue.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } });
    // Soft-delete try-on sessions referencing demo products
    await prisma.tryOnSession.updateMany({
      where: { productId: { in: productIds } },
      data: { deletedAt: new Date() },
    });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  }

  await prisma.collectionProduct.deleteMany({
    where: { collection: { seedBatchId: DEMO_BATCH_ID } },
  });
  await prisma.collection.deleteMany({ where: { seedBatchId: DEMO_BATCH_ID, isDemo: true } });

  // Only delete demo leaf categories (keep men/women/kids roots if they may be shared — but plan marks them demo; delete children first)
  await prisma.category.deleteMany({
    where: { seedBatchId: DEMO_BATCH_ID, isDemo: true, parentId: { not: null } },
  });
  // Soft-retain roots if non-demo products reference them; otherwise delete
  const roots = await prisma.category.findMany({
    where: { seedBatchId: DEMO_BATCH_ID, isDemo: true, parentId: null },
  });
  for (const r of roots) {
    const remaining = await prisma.product.count({
      where: { categoryId: r.id, deletedAt: null },
    });
    if (remaining === 0) {
      await prisma.category.delete({ where: { id: r.id } }).catch(async () => {
        await prisma.category.update({
          where: { id: r.id },
          data: { deletedAt: new Date(), status: "inactive", isDemo: false, seedBatchId: null },
        });
      });
    } else {
      await prisma.category.update({
        where: { id: r.id },
        data: { isDemo: false, seedBatchId: null },
      });
    }
  }

  return { removedProducts: productIds.length };
}

export async function demoCatalogStatus(prisma: PrismaClient) {
  const [products, categories, collections, tryMe, images, videos] = await Promise.all([
    prisma.product.count({ where: { seedBatchId: DEMO_BATCH_ID, deletedAt: null } }),
    prisma.category.count({ where: { seedBatchId: DEMO_BATCH_ID, deletedAt: null } }),
    prisma.collection.count({ where: { seedBatchId: DEMO_BATCH_ID, deletedAt: null } }),
    prisma.product.count({
      where: { seedBatchId: DEMO_BATCH_ID, deletedAt: null, tryOnEnabled: true },
    }),
    prisma.productImage.count({
      where: { product: { seedBatchId: DEMO_BATCH_ID }, mediaType: "image" },
    }),
    prisma.productImage.count({
      where: { product: { seedBatchId: DEMO_BATCH_ID }, mediaType: "video" },
    }),
  ]);
  return {
    batchId: DEMO_BATCH_ID,
    products,
    categories,
    collections,
    tryMe,
    images,
    videos,
  };
}

export async function resetDemoCatalog(prisma: PrismaClient): Promise<SeedResult> {
  await removeDemoCatalog(prisma);
  return seedDemoCatalog(prisma);
}
