-- CreateEnum
CREATE TYPE "KnowledgeArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceAnalysisId" TEXT,
    "sourcePocId" TEXT,
    "status" "KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_sourceAnalysisId_key" ON "KnowledgeArticle"("sourceAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_sourcePocId_key" ON "KnowledgeArticle"("sourcePocId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_ownerId_idx" ON "KnowledgeArticle"("ownerId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_radarId_idx" ON "KnowledgeArticle"("radarId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_status_idx" ON "KnowledgeArticle"("status");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_createdAt_idx" ON "KnowledgeArticle"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_ownerId_slug_key" ON "KnowledgeArticle"("ownerId", "slug");

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_sourceAnalysisId_fkey" FOREIGN KEY ("sourceAnalysisId") REFERENCES "TechnologyAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_sourcePocId_fkey" FOREIGN KEY ("sourcePocId") REFERENCES "PoC"("id") ON DELETE SET NULL ON UPDATE CASCADE;
