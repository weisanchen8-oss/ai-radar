-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('ANALYZED', 'RECOMMENDED', 'REJECTED', 'VALIDATED', 'INTEGRATED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DecisionTimeline" (
    "id" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "technologyName" TEXT NOT NULL,
    "decisionType" "DecisionType" NOT NULL,
    "summary" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceAnalysisId" TEXT,
    "sourcePocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionTimeline_radarId_idx" ON "DecisionTimeline"("radarId");

-- CreateIndex
CREATE INDEX "DecisionTimeline_technologyName_idx" ON "DecisionTimeline"("technologyName");

-- CreateIndex
CREATE INDEX "DecisionTimeline_decisionType_idx" ON "DecisionTimeline"("decisionType");

-- CreateIndex
CREATE INDEX "DecisionTimeline_sourceAnalysisId_idx" ON "DecisionTimeline"("sourceAnalysisId");

-- CreateIndex
CREATE INDEX "DecisionTimeline_sourcePocId_idx" ON "DecisionTimeline"("sourcePocId");

-- CreateIndex
CREATE INDEX "DecisionTimeline_createdAt_idx" ON "DecisionTimeline"("createdAt");

-- AddForeignKey
ALTER TABLE "DecisionTimeline" ADD CONSTRAINT "DecisionTimeline_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionTimeline" ADD CONSTRAINT "DecisionTimeline_sourceAnalysisId_fkey" FOREIGN KEY ("sourceAnalysisId") REFERENCES "TechnologyAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionTimeline" ADD CONSTRAINT "DecisionTimeline_sourcePocId_fkey" FOREIGN KEY ("sourcePocId") REFERENCES "PoC"("id") ON DELETE SET NULL ON UPDATE CASCADE;
