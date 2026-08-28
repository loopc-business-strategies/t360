/**
 * One-off: enable mobile admin feature flag in SystemSetting.
 * Usage (production):
 *   railway run --project <id> --environment production --service api -- npx tsx scripts/ops/enable-mobile-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const KEY = "feature.mobile_admin.enabled";

async function main() {
  const prisma = new PrismaClient();
  try {
    const row = await prisma.systemSetting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: true },
      update: { value: true },
    });
    console.log(`OK: ${KEY} = ${JSON.stringify(row.value)}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
