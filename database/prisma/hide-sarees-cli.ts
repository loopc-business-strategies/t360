/**
 * One-shot: hide saree catalog on the DB pointed at by DATABASE_URL.
 * Usage: DATABASE_URL=... pnpm --filter @t360/database hide:sarees
 */
import { PrismaClient } from "@prisma/client";
import { hideSareeCatalog } from "./hide-saree-catalog";

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await hideSareeCatalog(prisma);
    console.log("Saree catalog hidden:", result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
