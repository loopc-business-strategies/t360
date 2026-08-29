import { PrismaClient } from "@prisma/client";

const IMG = [
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SIZES = ["S", "M", "L", "XL"];
const COLOURS = ["Blue", "White", "Black", "Maroon", "Green"];

export async function seedCatalogue(prisma: PrismaClient) {
  if (process.env.NODE_ENV === "production" && process.env.SEED_CATALOGUE !== "true") {
    console.log("Skipping catalogue seed in production (set SEED_CATALOGUE=true to force).");
    return;
  }

  const attrs = [
    { code: "gender", name: "Gender", type: "select", options: ["Men", "Women", "Kids", "Unisex"] },
    { code: "occasion", name: "Occasion", type: "select", options: ["Casual", "Wedding", "Festival", "Formal"] },
    { code: "material", name: "Material", type: "text", options: null },
  ];

  for (const a of attrs) {
    await prisma.attributeDefinition.upsert({
      where: { code: a.code },
      create: { code: a.code, name: a.name, type: a.type, options: a.options ?? undefined },
      update: { name: a.name, type: a.type, options: a.options ?? undefined },
    });
  }

  const genderAttr = await prisma.attributeDefinition.findUniqueOrThrow({ where: { code: "gender" } });
  const occasionAttr = await prisma.attributeDefinition.findUniqueOrThrow({ where: { code: "occasion" } });

  const roots = [
    { name: "Men", slug: "men" },
    { name: "Women", slug: "women" },
    { name: "Kids", slug: "kids" },
    { name: "Wedding", slug: "wedding" },
    { name: "Festival", slug: "festival" },
    { name: "New Arrivals", slug: "new-arrivals" },
    { name: "Offers", slug: "offers" },
  ];

  const categoryIds: Record<string, string> = {};
  for (let i = 0; i < roots.length; i++) {
    const c = roots[i];
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, sortOrder: i, status: "active" },
      update: { name: c.name, status: "active", deletedAt: null },
    });
    categoryIds[c.slug] = row.id;
  }

  await prisma.category.upsert({
    where: { slug: "mens-shirts" },
    create: {
      name: "Shirts",
      slug: "mens-shirts",
      parentId: categoryIds.men,
      sortOrder: 1,
      status: "active",
    },
    update: { parentId: categoryIds.men, deletedAt: null },
  });
  await prisma.category.upsert({
    where: { slug: "womens-kurtis" },
    create: {
      name: "Kurtis",
      slug: "womens-kurtis",
      parentId: categoryIds.women,
      sortOrder: 1,
      status: "active",
    },
    update: { parentId: categoryIds.women, deletedAt: null },
  });

  const brands = [
    { name: "Tharagai Essentials", slug: "tharagai-essentials" },
    { name: "Silk House", slug: "silk-house" },
    { name: "Pudukkottai Weave", slug: "pudukkottai-weave" },
    { name: "Festival Lane", slug: "festival-lane" },
    { name: "Urban Cotton", slug: "urban-cotton" },
  ];
  const brandIds: Record<string, string> = {};
  for (const b of brands) {
    const row = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: { ...b, status: "active" },
      update: { name: b.name, status: "active", deletedAt: null },
    });
    brandIds[b.slug] = row.id;
  }

  const products: Array<{
    name: string;
    category: string;
    brand: string;
    gender: string;
    occasion: string;
    basePrice: number;
  }> = [];

  const templates = [
    { prefix: "Men Premium Shirt", category: "mens-shirts", brand: "urban-cotton", gender: "Men", occasion: "Casual", base: 1299 },
    { prefix: "Men Formal Shirt", category: "mens-shirts", brand: "tharagai-essentials", gender: "Men", occasion: "Formal", base: 1599 },
    { prefix: "Women Cotton Kurti", category: "womens-kurtis", brand: "tharagai-essentials", gender: "Women", occasion: "Casual", base: 999 },
    { prefix: "Kids Party Dress", category: "kids", brand: "festival-lane", gender: "Kids", occasion: "Festival", base: 1499 },
    { prefix: "Wedding Sherwani Set", category: "wedding", brand: "pudukkottai-weave", gender: "Men", occasion: "Wedding", base: 12999 },
    { prefix: "Women Ethnic Set", category: "festival", brand: "pudukkottai-weave", gender: "Women", occasion: "Festival", base: 2499 },
  ];

  let n = 0;
  while (products.length < 30) {
    for (const t of templates) {
      if (products.length >= 30) break;
      n += 1;
      products.push({
        name: `${t.prefix} ${n}`,
        category: t.category,
        brand: t.brand,
        gender: t.gender,
        occasion: t.occasion,
        basePrice: t.base + (n % 5) * 100,
      });
    }
  }

  const shirtsCat = await prisma.category.findUnique({ where: { slug: "mens-shirts" } });
  const kurtisCat = await prisma.category.findUnique({ where: { slug: "womens-kurtis" } });
  if (shirtsCat) categoryIds["mens-shirts"] = shirtsCat.id;
  if (kurtisCat) categoryIds["womens-kurtis"] = kurtisCat.id;

  let i = 0;
  for (const p of products) {
    i += 1;
    const slug = slugify(p.name);
    const categoryId = categoryIds[p.category] ?? categoryIds.men;
    const brandId = brandIds[p.brand];

    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        name: p.name,
        slug,
        description: `Demo catalogue product — ${p.name}. Soft cotton / silk blend suitable for ${p.occasion.toLowerCase()} wear.`,
        status: "published",
        categoryId,
        brandId,
      },
      update: {
        name: p.name,
        description: `Demo catalogue product — ${p.name}. Soft cotton / silk blend suitable for ${p.occasion.toLowerCase()} wear.`,
        status: "published",
        categoryId,
        brandId,
        deletedAt: null,
      },
    });

    await prisma.productAttributeValue.upsert({
      where: {
        productId_attributeId: { productId: product.id, attributeId: genderAttr.id },
      },
      create: { productId: product.id, attributeId: genderAttr.id, value: p.gender },
      update: { value: p.gender },
    });
    await prisma.productAttributeValue.upsert({
      where: {
        productId_attributeId: { productId: product.id, attributeId: occasionAttr.id },
      },
      create: { productId: product.id, attributeId: occasionAttr.id, value: p.occasion },
      update: { value: p.occasion },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: IMG[i % IMG.length],
        alt: p.name,
        sortOrder: 0,
        publicId: `demo/${slug}`,
      },
    });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: IMG[(i + 1) % IMG.length],
        alt: `${p.name} alternate`,
        sortOrder: 1,
        publicId: `demo/${slug}-2`,
      },
    });

    const colour = COLOURS[i % COLOURS.length];
    for (const size of SIZES) {
      const sku = `THG-${String(i).padStart(3, "0")}-${size}-${colour.slice(0, 3).toUpperCase()}`;
      await prisma.productVariant.upsert({
        where: { sku },
        create: {
          productId: product.id,
          sku,
          barcode: `890${String(i).padStart(4, "0")}${size.charCodeAt(0)}`,
          price: p.basePrice,
          cost: Math.round(p.basePrice * 0.55),
          salePrice: i % 3 === 0 ? Math.round(p.basePrice * 0.85) : null,
          attributes: { size, colour },
          status: "active",
        },
        update: {
          price: p.basePrice,
          salePrice: i % 3 === 0 ? Math.round(p.basePrice * 0.85) : null,
          attributes: { size, colour },
          status: "active",
          deletedAt: null,
        },
      });
    }
  }

  await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET search_vector =
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(slug, '')), 'C')
  `);

  console.log(`Catalogue seed: ${products.length} demo products (labeled demo data).`);
}
