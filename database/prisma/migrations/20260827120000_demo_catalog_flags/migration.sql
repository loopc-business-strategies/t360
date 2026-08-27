-- Demo catalog markers and product merchandising flags
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seedBatchId" TEXT;

ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "seedBatchId" TEXT;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seedBatchId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isBestseller" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isTrending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Category_isDemo_seedBatchId_idx" ON "Category"("isDemo", "seedBatchId");
CREATE INDEX IF NOT EXISTS "Collection_isDemo_seedBatchId_idx" ON "Collection"("isDemo", "seedBatchId");
CREATE INDEX IF NOT EXISTS "Product_isDemo_seedBatchId_idx" ON "Product"("isDemo", "seedBatchId");
CREATE INDEX IF NOT EXISTS "Product_isNew_idx" ON "Product"("isNew");
CREATE INDEX IF NOT EXISTS "Product_isBestseller_idx" ON "Product"("isBestseller");
CREATE INDEX IF NOT EXISTS "Product_isTrending_idx" ON "Product"("isTrending");
CREATE INDEX IF NOT EXISTS "Product_isFeatured_idx" ON "Product"("isFeatured");
