-- AI Fashion Studio models

CREATE TABLE "AiFashionModel" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "ageRange" TEXT,
    "style" TEXT,
    "bodyType" TEXT,
    "skinTone" TEXT,
    "hairStyle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'fashn',
    "providerModelId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiFashionModel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiGeneratedImage" (
    "id" UUID NOT NULL,
    "productId" UUID,
    "modelId" UUID,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "inputImageUrl" TEXT NOT NULL,
    "personImageUrl" TEXT,
    "outputImageUrl" TEXT,
    "outputPublicId" TEXT,
    "provider" TEXT NOT NULL,
    "providerJobId" TEXT,
    "prompt" TEXT,
    "params" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "errorDetail" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedAs" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiGeneratedImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiFashionUsage" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "generationType" TEXT NOT NULL,
    "productId" UUID,
    "userId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "creditsUsed" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFashionUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiFashionModel_isActive_idx" ON "AiFashionModel"("isActive");
CREATE INDEX "AiFashionModel_gender_idx" ON "AiFashionModel"("gender");
CREATE INDEX "AiFashionModel_createdAt_idx" ON "AiFashionModel"("createdAt");

CREATE INDEX "AiGeneratedImage_status_createdAt_idx" ON "AiGeneratedImage"("status", "createdAt");
CREATE INDEX "AiGeneratedImage_productId_idx" ON "AiGeneratedImage"("productId");
CREATE INDEX "AiGeneratedImage_createdBy_idx" ON "AiGeneratedImage"("createdBy");
CREATE INDEX "AiGeneratedImage_providerJobId_idx" ON "AiGeneratedImage"("providerJobId");
CREATE INDEX "AiGeneratedImage_type_status_idx" ON "AiGeneratedImage"("type", "status");
CREATE INDEX "AiGeneratedImage_modelId_idx" ON "AiGeneratedImage"("modelId");

CREATE UNIQUE INDEX "AiFashionUsage_jobId_key" ON "AiFashionUsage"("jobId");
CREATE INDEX "AiFashionUsage_userId_createdAt_idx" ON "AiFashionUsage"("userId", "createdAt");
CREATE INDEX "AiFashionUsage_provider_createdAt_idx" ON "AiFashionUsage"("provider", "createdAt");
CREATE INDEX "AiFashionUsage_generationType_createdAt_idx" ON "AiFashionUsage"("generationType", "createdAt");
CREATE INDEX "AiFashionUsage_status_createdAt_idx" ON "AiFashionUsage"("status", "createdAt");

ALTER TABLE "AiGeneratedImage" ADD CONSTRAINT "AiGeneratedImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiGeneratedImage" ADD CONSTRAINT "AiGeneratedImage_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiFashionModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiGeneratedImage" ADD CONSTRAINT "AiGeneratedImage_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiFashionUsage" ADD CONSTRAINT "AiFashionUsage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AiGeneratedImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiFashionUsage" ADD CONSTRAINT "AiFashionUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
