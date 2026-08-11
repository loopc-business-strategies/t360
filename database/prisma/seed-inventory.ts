import { PrismaClient } from "@prisma/client";

export function availableQty(physicalQty: number, reservedQty: number) {
  return Math.max(0, physicalQty - reservedQty);
}

export async function seedInventory(prisma: PrismaClient) {
  if (process.env.NODE_ENV === "production" && process.env.SEED_INVENTORY !== "true") {
    console.log("Skipping inventory seed in production.");
    return;
  }

  const pudu = await prisma.branch.upsert({
    where: { code: "PDK01" },
    create: {
      code: "PDK01",
      name: "Tharagai Pudukkottai",
      address: "Pudukkottai, Tamil Nadu, India",
      phone: "+914322000000",
      hours: { monFri: "10:00-21:00", satSun: "10:00-22:00" },
      status: "active",
    },
    update: { status: "active", deletedAt: null },
  });

  const chennai = await prisma.branch.upsert({
    where: { code: "CHN01" },
    create: {
      code: "CHN01",
      name: "Tharagai Warehouse Chennai",
      address: "Chennai, Tamil Nadu, India",
      phone: "+914400000000",
      hours: { monFri: "09:00-18:00" },
      status: "active",
    },
    update: { status: "active", deletedAt: null },
  });

  await prisma.warehouse.upsert({
    where: { branchId_code: { branchId: pudu.id, code: "MAIN" } },
    create: { branchId: pudu.id, code: "MAIN", name: "Showroom floor", status: "active" },
    update: { status: "active" },
  });
  await prisma.warehouse.upsert({
    where: { branchId_code: { branchId: chennai.id, code: "MAIN" } },
    create: { branchId: chennai.id, code: "MAIN", name: "Central warehouse", status: "active" },
    update: { status: "active" },
  });

  const variants = await prisma.productVariant.findMany({
    where: { deletedAt: null },
    select: { id: true },
    take: 500,
  });

  let n = 0;
  for (const v of variants) {
    n += 1;
    const qtyPudu = 5 + (n % 20);
    const qtyChn = n % 7 === 0 ? 2 : 15 + (n % 10);

    await prisma.inventory.upsert({
      where: { branchId_variantId: { branchId: pudu.id, variantId: v.id } },
      create: {
        branchId: pudu.id,
        variantId: v.id,
        physicalQty: qtyPudu,
        reservedQty: 0,
        lowStockThreshold: 5,
      },
      update: { physicalQty: qtyPudu, reservedQty: 0 },
    });
    await prisma.inventory.upsert({
      where: { branchId_variantId: { branchId: chennai.id, variantId: v.id } },
      create: {
        branchId: chennai.id,
        variantId: v.id,
        physicalQty: qtyChn,
        reservedQty: 0,
        lowStockThreshold: 5,
      },
      update: { physicalQty: qtyChn, reservedQty: 0 },
    });
  }

  console.log(
    `Inventory seed: branches PDK01/CHN01, stock rows for ${variants.length} variants (demo).`,
  );
}
