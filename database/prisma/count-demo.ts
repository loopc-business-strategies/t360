import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const [products, cats, bras] = await Promise.all([
    prisma.product.count({ where: { isDemo: true, deletedAt: null } }),
    prisma.category.count({ where: { slug: { in: ["women-bras", "men-boxers", "kids-innerwear"] }, deletedAt: null } }),
    prisma.product.count({
      where: { category: { slug: "women-bras" }, deletedAt: null },
    }),
  ]);
  console.log(JSON.stringify({ products, newCats: cats, brasProducts: bras }));
  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});
