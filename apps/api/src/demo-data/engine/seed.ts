import type { PrismaClient } from "@prisma/client";
import {
  ADULT_SIZES,
  COLLECTION_DEFS,
  COLORS,
  DEMO_BATCH_ID,
  DEMO_IMAGES,
  KIDS_SIZES,
  KIDS_TREE,
  LEGACY_EMPTY_CATEGORY_SLUGS,
  MEN_TREE,
  OTHER_TREES,
  WAIST_SIZES,
  WOMEN_TREE,
  slugify,
  type CatDef,
} from "./constants";
import {
  buildDemoDescription,
  buildDemoProductName,
  expectedNameTokens,
  getDemoImagesForCategory,
  getDemoVideoForCategory,
  validateProductMedia,
  allowedImageUrlsForCategory,
} from "./category-media";
import {
  CATEGORY_META,
  DEMO_BRANDS,
  getCategoryMeta,
  priceForBand,
  type SizeProfile,
} from "./category-meta";

type SeedResult = {
  products: number;
  categories: number;
  collections: number;
  images: number;
  videos: number;
  tryMe: number;
  variants: number;
};

type Segment = "men" | "women" | "kids" | "sarees" | "wedding" | "festival";

function sizesForProfile(profile: SizeProfile): string[] {
  if (profile === "kids") return KIDS_SIZES.slice(0, 6);
  if (profile === "one") return ["ONE"];
  if (profile === "waist") return WAIST_SIZES.slice(1, 7);
  return ADULT_SIZES.slice(1, 8); // XS–3XL
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
      sortOrder: sortBase,
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

/** Build product plans from per-leaf quotas in CATEGORY_META. */
function quotaPlans(
  tree: CatDef,
): Array<{ leafSlug: string; leafName: string; index: number }> {
  const children = tree.children ?? [];
  const plans: Array<{ leafSlug: string; leafName: string; index: number }> = [];
  for (const leaf of children) {
    const meta = CATEGORY_META[leaf.slug];
    const quota = meta?.quota ?? 3;
    for (let i = 0; i < quota; i++) {
      plans.push({ leafSlug: leaf.slug, leafName: leaf.name, index: i });
    }
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

async function softDeleteEmptyLegacyCategories(prisma: PrismaClient) {
  const now = new Date();
  await prisma.category.updateMany({
    where: {
      slug: { in: [...LEGACY_EMPTY_CATEGORY_SLUGS] },
      deletedAt: null,
    },
    data: { deletedAt: now, status: "inactive" },
  });

  const allowed = new Set([
    ...(MEN_TREE.children ?? []).map((c) => c.slug),
    ...(WOMEN_TREE.children ?? []).map((c) => c.slug),
    ...(KIDS_TREE.children ?? []).map((c) => c.slug),
  ]);
  const stray = await prisma.category.findMany({
    where: {
      deletedAt: null,
      parent: { slug: { in: ["men", "women", "kids"] } },
      NOT: { slug: { in: [...allowed] } },
    },
    select: { id: true },
  });
  if (stray.length) {
    await prisma.category.updateMany({
      where: { id: { in: stray.map((s) => s.id) } },
      data: { deletedAt: now, status: "inactive" },
    });
  }
}

export async function seedDemoCatalog(prisma: PrismaClient): Promise<SeedResult> {
  await softDeleteLegacyDemo(prisma);
  await softDeleteEmptyLegacyCategories(prisma);

  const brandIds: Record<string, string> = {};
  for (const b of DEMO_BRANDS) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      create: { name: b.name, slug: b.slug, status: "active" },
      update: { name: b.name, status: "active", deletedAt: null },
    });
    const row = await prisma.brand.findUniqueOrThrow({ where: { slug: b.slug } });
    brandIds[b.slug] = row.id;
  }

  const menIds = await upsertTree(prisma, MEN_TREE, 0);
  const womenIds = await upsertTree(prisma, WOMEN_TREE, 1);
  const kidsIds = await upsertTree(prisma, KIDS_TREE, 2);
  const otherIdMaps: Array<{ tree: CatDef; ids: Record<string, string> }> = [];
  for (let i = 0; i < OTHER_TREES.length; i++) {
    const tree = OTHER_TREES[i];
    otherIdMaps.push({ tree, ids: await upsertTree(prisma, tree, 10 + i) });
  }

  const categoryCount =
    3 +
    OTHER_TREES.length +
    (MEN_TREE.children?.length ?? 0) +
    (WOMEN_TREE.children?.length ?? 0) +
    (KIDS_TREE.children?.length ?? 0) +
    OTHER_TREES.reduce((n, t) => n + (t.children?.length ?? 0), 0);

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

  const menPlans = quotaPlans(MEN_TREE);
  const womenPlans = quotaPlans(WOMEN_TREE);
  const kidsPlans = quotaPlans(KIDS_TREE);

  type Built = {
    id: string;
    slug: string;
    gender: Segment;
    leafSlug: string;
    tryOn: boolean;
    flags: {
      isNew: boolean;
      isBestseller: boolean;
      isTrending: boolean;
      isFeatured: boolean;
      onSale: boolean;
    };
  };
  const built: Built[] = [];
  let imageCount = 0;
  let videoCount = 0;
  let tryMeCount = 0;
  let variantCount = 0;
  let globalIndex = 0;
  const stockQueue: Array<{ variantId: string; qty: number }> = [];
  const skuSeq: Record<string, number> = {};

  async function createProduct(
    segment: Segment,
    plan: { leafSlug: string; leafName: string; index: number },
    catIds: Record<string, string>,
  ) {
    const meta = getCategoryMeta(plan.leafSlug);
    const name = buildDemoProductName(segment, plan.leafSlug, plan.leafName, plan.index);
    const description = buildDemoDescription(plan.leafSlug, segment, name);
    const slug = slugify(`t360-demo-${segment}-${plan.leafSlug}-${plan.index + 1}`);
    const { price, salePrice } = priceForBand(meta?.priceBand ?? "tee", plan.index);
    const tryOn = true;
    const brandSlug = meta?.brandSlug ?? "t360-originals";
    const brandId = brandIds[brandSlug] ?? brandIds["t360-originals"];
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
    const sizes = sizesForProfile(meta?.sizeProfile ?? "adult");
    const stills = getDemoImagesForCategory(plan.leafSlug, segment, plan.index).slice(0, 1);
    if (!catIds[plan.leafSlug]) {
      throw new Error(`CATEGORY_MISMATCH missing categoryId for leaf=${plan.leafSlug}`);
    }

    const mediaCheck = validateProductMedia({
      categorySlug: plan.leafSlug,
      segment,
      images: stills.map((url, i) => ({
        url,
        mediaType: "image" as const,
        isTryOnSource: i === 0,
      })),
      tryOnEnabled: tryOn,
    });
    if (!mediaCheck.ok) {
      throw new Error(
        `MEDIA_MISMATCH leaf=${plan.leafSlug} detail=${mediaCheck.detail ?? mediaCheck.status}`,
      );
    }

    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        name,
        slug,
        description,
        status: "published",
        categoryId: catIds[plan.leafSlug],
        brandId,
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
        description,
        status: "published",
        categoryId: catIds[plan.leafSlug],
        brandId,
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

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < stills.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: stills[i],
          publicId: `demo/${DEMO_BATCH_ID}/${slug}/${i}`,
          alt: `${name} view ${i + 1}`,
          mediaType: "image",
          isTryOnSource: i === 0,
          sortOrder: i,
        },
      });
      imageCount++;
    }
    if (flags.isFeatured || globalIndex % 5 === 0) {
      const videoUrl = getDemoVideoForCategory(plan.leafSlug, segment, plan.index);
      if (videoUrl) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: videoUrl,
            publicId: `demo/${DEMO_BATCH_ID}/${slug}/video`,
            alt: `${name} video`,
            mediaType: "video",
            isTryOnSource: false,
            sortOrder: 10,
          },
        });
        videoCount++;
      }
    }

    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: product.id },
      select: { id: true },
    });
    if (existingVariants.length) {
      const vids = existingVariants.map((v) => v.id);
      await prisma.inventory.deleteMany({ where: { variantId: { in: vids } } });
      await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    }

    const skuType = meta?.skuType ?? "GEN";
    skuSeq[skuType] = (skuSeq[skuType] ?? 0) + 1;
    const baseSku = `T360-${skuType}-${String(skuSeq[skuType]).padStart(4, "0")}`;
    let skuN = 0;
    for (const color of colors) {
      for (const size of sizes) {
        skuN++;
        const sku = `${baseSku}-${size}-${color.name.slice(0, 3).toUpperCase()}-${skuN}`;
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
        if (size === "XXS" || size === "3XL" || size === "2Y" || size === "ONE") qty = 2;
        if (globalIndex % 17 === 0 && size === "M") qty = 0;
        if (globalIndex % 11 === 0 && size === "S") qty = 3;
        stockQueue.push({ variantId: variant.id, qty });
      }
    }

    if (tryOn) tryMeCount++;
    built.push({
      id: product.id,
      slug,
      gender: segment,
      leafSlug: plan.leafSlug,
      tryOn,
      flags,
    });
    globalIndex++;
  }

  for (const p of menPlans) await createProduct("men", p, menIds);
  for (const p of womenPlans) await createProduct("women", p, womenIds);
  for (const p of kidsPlans) await createProduct("kids", p, kidsIds);
  for (const { tree, ids } of otherIdMaps) {
    const plans = quotaPlans(tree);
    for (const p of plans) await createProduct(tree.slug as Segment, p, ids);
  }

  // Soft-delete demo products from previous denser/thinner runs that are not in this batch slug set
  const keepSlugs = new Set(built.map((b) => b.slug));
  const stale = await prisma.product.findMany({
    where: {
      seedBatchId: DEMO_BATCH_ID,
      deletedAt: null,
      slug: { notIn: [...keepSlugs] },
    },
    select: { id: true },
  });
  if (stale.length) {
    const ids = stale.map((s) => s.id);
    const variants = await prisma.productVariant.findMany({
      where: { productId: { in: ids } },
      select: { id: true },
    });
    const vids = variants.map((v) => v.id);
    if (vids.length) {
      await prisma.inventory.deleteMany({ where: { variantId: { in: vids } } });
      await prisma.cartItem.deleteMany({ where: { variantId: { in: vids } } });
      await prisma.wishlistItem.deleteMany({ where: { variantId: { in: vids } } });
    }
    await prisma.productReview.deleteMany({ where: { productId: { in: ids } } });
    await prisma.collectionProduct.deleteMany({ where: { productId: { in: ids } } });
    await prisma.productImage.deleteMany({ where: { productId: { in: ids } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date(), status: "archived" },
    });
  }

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

  for (const b of built) {
    const links: string[] = [];
    if (b.flags.isNew) links.push("new-arrivals");
    if (b.flags.isBestseller) links.push("bestsellers");
    if (b.flags.isTrending) links.push("trending");
    if (b.flags.isFeatured) links.push("t360-originals");
    if (b.flags.onSale) links.push("sale");
    if (b.gender === "men") links.push("mens-edit");
    if (b.gender === "women" || b.gender === "sarees") links.push("womens-edit");
    if (b.gender === "kids") links.push("kids-essentials");
    if (b.gender === "sarees" || b.leafSlug.includes("saree")) links.push("saree-edit");
    if (b.gender === "wedding" || b.leafSlug.includes("wedding") || b.leafSlug.includes("lehenga") || b.leafSlug.includes("sherwani") || b.leafSlug.includes("reception")) {
      links.push("wedding-edit");
    }
    if (b.gender === "festival" || b.leafSlug.includes("festival") || b.leafSlug.includes("festive")) {
      links.push("festive-edit");
    }
    if (
      b.leafSlug.includes("kurta") ||
      b.leafSlug.includes("kurti") ||
      b.leafSlug.includes("chudidar") ||
      b.leafSlug.includes("salwar") ||
      b.leafSlug.includes("anarkali") ||
      b.leafSlug.includes("palazzo") ||
      b.leafSlug.includes("ethnic") ||
      b.leafSlug.includes("nehru") ||
      b.leafSlug.includes("saree")
    ) {
      links.push("ethnic-edit");
    }
    if (b.leafSlug.includes("active")) links.push("activewear");
    if (
      b.leafSlug.includes("hoodie") ||
      b.leafSlug.includes("graphic") ||
      b.leafSlug.includes("oversized")
    ) {
      links.push("streetwear");
    }
    links.push("everyday");
    if (
      b.leafSlug.includes("linen") ||
      b.leafSlug.includes("short") ||
      b.leafSlug.includes("maxi")
    ) {
      links.push("summer");
    }
    if (
      b.leafSlug.includes("jacket") ||
      b.leafSlug.includes("hoodie") ||
      b.leafSlug.includes("sweat")
    ) {
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
  for (let i = 0; i < Math.min(40, built.length); i++) {
    const p = built[i * 5] ?? built[i];
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

  const names = built.map((b) => b.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) {
    throw new Error(
      `DEMO_DUPLICATE_NAMES count=${new Set(dupes).size} sample=${[...new Set(dupes)].slice(0, 5).join("; ")}`,
    );
  }

  const audit = await auditDemoCatalog(prisma);
  const critical = audit.filter((r) => r.status !== "PASS");
  if (critical.length) {
    const sample = critical.slice(0, 5).map((r) => `${r.status}:${r.slug}`).join("; ");
    throw new Error(`DEMO_CATALOG_AUDIT_FAILED count=${critical.length} sample=${sample}`);
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

export type AuditRow = {
  productId: string;
  slug: string;
  name: string;
  category: string;
  media: string;
  video: string;
  tryOn: boolean;
  status:
    | "PASS"
    | "CATEGORY_MISMATCH"
    | "MEDIA_MISMATCH"
    | "VIDEO_MISMATCH"
    | "TRYON_MISMATCH"
    | "NAME_MISMATCH"
    | "DESCRIPTION_MISMATCH"
    | "ATTRIBUTE_MISMATCH";
};

/** Loud integrity scan — demo batch only. */
export async function auditDemoCatalog(prisma: PrismaClient): Promise<AuditRow[]> {
  const products = await prisma.product.findMany({
    where: { seedBatchId: DEMO_BATCH_ID, deletedAt: null },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  const rows: AuditRow[] = [];
  const primaryByLeaf = new Map<string, Map<string, number>>();
  const poolSizeByLeaf = new Map<string, number>();

  for (const p of products) {
    const leaf = p.category?.slug ?? "";
    const segment =
      leaf.startsWith("men-")
        ? "men"
        : leaf.startsWith("women-")
          ? "women"
          : leaf.startsWith("kids-")
            ? "kids"
            : leaf.startsWith("sarees-")
              ? "sarees"
              : leaf.startsWith("wedding-")
                ? "wedding"
                : leaf.startsWith("festival-")
                  ? "festival"
                  : "men";
    const stills = p.images.filter((i) => i.mediaType === "image");
    const primary = stills[0]?.url ?? "";
    const hasVideo = p.images.some((i) => i.mediaType === "video");
    let status: AuditRow["status"] = "PASS";

    if (!p.categoryId || !p.category || p.category.deletedAt || p.category.status !== "active") {
      status = "CATEGORY_MISMATCH";
    } else {
      const tokens = getCategoryMeta(leaf)?.nameTokens ?? expectedNameTokens(leaf);
      const hay = `${p.name} ${p.description}`.toLowerCase();
      if (tokens.length && !tokens.some((t) => hay.includes(t.toLowerCase()))) {
        status = "NAME_MISMATCH";
      } else {
        const stillUrls = stills.map((i) => i.url);
        if (stillUrls.length !== new Set(stillUrls).size) {
          status = "MEDIA_MISMATCH";
        } else {
          const media = validateProductMedia({
            categorySlug: leaf,
            segment,
            images: p.images.map((i) => ({
              url: i.url,
              mediaType: i.mediaType,
              isTryOnSource: i.isTryOnSource,
              productId: i.productId,
            })),
            tryOnEnabled: p.tryOnEnabled,
            productId: p.id,
          });
          if (!media.ok) status = media.status === "TRYON_MISMATCH" ? "TRYON_MISMATCH" : "MEDIA_MISMATCH";
        }
      }
    }

    if (status === "PASS" && p.tryOnEnabled) {
      const hasTryOnSource = stills.some((i) => i.isTryOnSource);
      if (!hasTryOnSource || stills.length === 0) {
        status = "TRYON_MISMATCH";
      }
    }

    if (primary && leaf) {
      if (!primaryByLeaf.has(leaf)) primaryByLeaf.set(leaf, new Map());
      const m = primaryByLeaf.get(leaf)!;
      m.set(primary, (m.get(primary) ?? 0) + 1);
      if (!poolSizeByLeaf.has(leaf)) {
        poolSizeByLeaf.set(leaf, allowedImageUrlsForCategory(leaf, segment).size);
      }
    }

    rows.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      category: leaf,
      media: primary,
      video: hasVideo ? "yes" : "no",
      tryOn: p.tryOnEnabled,
      status,
    });
  }

  // Within each leaf, distinct primaries must equal min(productCount, effectivePoolCap).
  // Catches stride collapse where every product shares one primary.
  for (const [leaf, counts] of primaryByLeaf) {
    const productCount = [...counts.values()].reduce((a, b) => a + b, 0);
    const distinct = counts.size;
    const expectedMin = Math.min(productCount, Math.min(4, poolSizeByLeaf.get(leaf) ?? 4));
    // With stride-1, we expect min(productCount, poolUnique) distinct primaries (capped by pool).
    // Fail hard if only 1 primary for 2+ products when pool has more than 1 image.
    const poolUnique = Math.min(12, poolSizeByLeaf.get(leaf) ?? 1);
    if (productCount > 1 && distinct < Math.min(productCount, Math.max(2, Math.min(poolUnique, 6)))) {
      for (const row of rows) {
        if (row.category === leaf && row.status === "PASS") {
          row.status = "MEDIA_MISMATCH";
        }
      }
      console.warn(
        `[demo-audit] leaf primary uniqueness fail leaf=${leaf} distinct=${distinct} products=${productCount} expectedMin=${expectedMin}`,
      );
    }
  }

  return rows;
}

/** @deprecated Prefer auditDemoCatalog — kept for callers. */
export async function validateDemoCatalog(prisma: PrismaClient): Promise<void> {
  const audit = await auditDemoCatalog(prisma);
  const bad = audit.find((r) => r.status !== "PASS");
  if (bad) {
    throw new Error(
      `${bad.status} PRODUCT_ID=${bad.productId} PRODUCT_NAME=${bad.name} CATEGORY=${bad.category} IMAGE_URL=${bad.media}`,
    );
  }
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

  await prisma.category.deleteMany({
    where: { seedBatchId: DEMO_BATCH_ID, isDemo: true, parentId: { not: null } },
  });
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
