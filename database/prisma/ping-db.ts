import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
prisma
  .$queryRaw`SELECT 1 as ok`
  .then((r) => {
    console.log("ok", r);
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("fail", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
