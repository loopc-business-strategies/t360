-- Customer Virtual Try-On (TRY ME)

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tryOnEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "isTryOnSource" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Product_tryOnEnabled_idx" ON "Product"("tryOnEnabled");
CREATE INDEX IF NOT EXISTS "ProductImage_productId_isTryOnSource_idx" ON "ProductImage"("productId", "isTryOnSource");

CREATE TABLE IF NOT EXISTS "TryOnSession" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "inputImageUrl" TEXT NOT NULL,
    "inputPublicId" TEXT,
    "resultImageUrl" TEXT,
    "resultPublicId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL DEFAULT 'fashn',
    "providerJobId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "savePhotoConsent" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TryOnSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TryOnSession_idempotencyKey_key" ON "TryOnSession"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "TryOnSession_customerId_createdAt_idx" ON "TryOnSession"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "TryOnSession_productId_idx" ON "TryOnSession"("productId");
CREATE INDEX IF NOT EXISTS "TryOnSession_status_createdAt_idx" ON "TryOnSession"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "TryOnSession_providerJobId_idx" ON "TryOnSession"("providerJobId");
CREATE INDEX IF NOT EXISTS "TryOnSession_expiresAt_idx" ON "TryOnSession"("expiresAt");

ALTER TABLE "TryOnSession" DROP CONSTRAINT IF EXISTS "TryOnSession_customerId_fkey";
ALTER TABLE "TryOnSession" ADD CONSTRAINT "TryOnSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TryOnSession" DROP CONSTRAINT IF EXISTS "TryOnSession_productId_fkey";
ALTER TABLE "TryOnSession" ADD CONSTRAINT "TryOnSession_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "TryOnUsage" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "productId" UUID,
    "sessionId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "creditsUsed" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'customer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOnUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TryOnUsage_sessionId_key" ON "TryOnUsage"("sessionId");
CREATE INDEX IF NOT EXISTS "TryOnUsage_customerId_createdAt_idx" ON "TryOnUsage"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "TryOnUsage_productId_createdAt_idx" ON "TryOnUsage"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "TryOnUsage_status_createdAt_idx" ON "TryOnUsage"("status", "createdAt");

ALTER TABLE "TryOnUsage" DROP CONSTRAINT IF EXISTS "TryOnUsage_sessionId_fkey";
ALTER TABLE "TryOnUsage" ADD CONSTRAINT "TryOnUsage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TryOnSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TryOnUsage" DROP CONSTRAINT IF EXISTS "TryOnUsage_customerId_fkey";
ALTER TABLE "TryOnUsage" ADD CONSTRAINT "TryOnUsage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
