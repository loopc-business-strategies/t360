/**
 * One-shot: run demo catalog seed + hide sarees on DATABASE_URL.
 * Usage: DATABASE_URL=... pnpm --filter @t360/database seed:demo
 */
import { PrismaClient } from "@prisma/client";
import { hideSareeCatalog } from "./hide-saree-catalog";

async function main() {
  const prisma = new PrismaClient();
  try {
    const { seedDemoCatalog } = await import("../../apps/api/src/demo-data/engine/seed");
    const demoResult = await seedDemoCatalog(prisma);
    console.log("Demo catalog:", demoResult);
    const sareeHide = await hideSareeCatalog(prisma);
    console.log("Saree catalog hidden:", sareeHide);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
