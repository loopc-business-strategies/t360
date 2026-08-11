-- CreateTable
CREATE TABLE "SearchSynonym" (
    "id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "aliases" JSONB NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SearchSynonym_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchSynonym_term_key" ON "SearchSynonym"("term");

-- CreateIndex
CREATE INDEX "SearchSynonym_active_idx" ON "SearchSynonym"("active");

-- CreateIndex
CREATE INDEX "SearchSynonym_locale_idx" ON "SearchSynonym"("locale");
