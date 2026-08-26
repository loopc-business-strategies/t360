-- Enable TRY ME for all existing products; default true for new rows
ALTER TABLE "Product" ALTER COLUMN "tryOnEnabled" SET DEFAULT true;
UPDATE "Product" SET "tryOnEnabled" = true WHERE "deletedAt" IS NULL;
