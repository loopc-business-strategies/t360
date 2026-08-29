#!/usr/bin/env node
/**
 * Run inside API container (internal DATABASE_URL):
 *   node apps/api/scripts/seed-demo-once.mjs
 */
const { PrismaClient } = require("@prisma/client");
const { seedDemoCatalog } = require("../dist/src/demo-data/engine/seed.js");

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Starting seedDemoCatalog...");
    const result = await seedDemoCatalog(prisma);
    console.log("Demo catalog:", JSON.stringify(result));

    const checks = {};
    for (const slug of ["women-bras", "men-boxers", "kids-innerwear", "men-kurtas"]) {
      const cat = await prisma.category.findFirst({ where: { slug, deletedAt: null } });
      const products = cat
        ? await prisma.product.count({ where: { categoryId: cat.id, deletedAt: null } })
        : 0;
      checks[slug] = { active: Boolean(cat), products, status: cat?.status ?? null };
    }
    const sarees = await prisma.category.count({
      where: { slug: { startsWith: "sarees" }, deletedAt: null, status: "active" },
    });
    const demoProducts = await prisma.product.count({
      where: { seedBatchId: "T360_DEMO_001", deletedAt: null },
    });
    console.log("Checks:", JSON.stringify({ demoProducts, sareeActive: sarees, checks }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
