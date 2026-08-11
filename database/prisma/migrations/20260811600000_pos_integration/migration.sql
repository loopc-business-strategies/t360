-- CreateTable
CREATE TABLE "Integration" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disabled',
    "credentialsRef" TEXT,
    "syncCursor" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Integration_kind_status_idx" ON "Integration"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_provider_kind_key" ON "Integration"("provider", "kind");
