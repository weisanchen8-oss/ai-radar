-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'UNLISTED', 'ORG', 'PUBLIC');

-- CreateEnum
CREATE TYPE "RadarStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScanIntensity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IntelligenceSourceType" AS ENUM ('ARTICLE', 'GITHUB', 'SOCIAL', 'PAPER', 'VIDEO', 'NEWSLETTER', 'DOCUMENTATION', 'MANUAL');

-- CreateEnum
CREATE TYPE "IntelligenceLifecycleStatus" AS ENUM ('DISCOVERED', 'ANALYZED', 'TRACKING', 'ADOPTED', 'ARCHIVED', 'DORMANT', 'REACTIVATED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('DRAFT', 'GENERATED', 'REVIEWED', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('AI_GENERATED', 'HUMAN_AUTHORED', 'HYBRID');

-- CreateEnum
CREATE TYPE "AnalysisSourceRelationType" AS ENUM ('PRIMARY', 'SUPPORTING', 'CONTRADICTING', 'BACKGROUND');

-- CreateEnum
CREATE TYPE "RecommendationActionType" AS ENUM ('WATCH', 'VALIDATE_BY_POC', 'ADOPT_INCREMENTALLY', 'REJECT_FOR_NOW', 'NEED_MORE_INFO');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED', 'DONE');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PocStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PocOutcome" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "DailyReportStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('RADAR', 'INTELLIGENCE_ITEM', 'TECHNOLOGY_ANALYSIS', 'RECOMMENDATION', 'POC', 'DAILY_REPORT');

-- CreateEnum
CREATE TYPE "ActivityActionType" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'GENERATED', 'LINKED', 'UNLINKED', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "organizationId" TEXT,
    "timezone" TEXT,
    "locale" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Radar" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RadarStatus" NOT NULL DEFAULT 'DRAFT',
    "scanIntensity" "ScanIntensity" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessDomain" TEXT,
    "focusQuestion" TEXT,
    "observationScope" TEXT,
    "targetAudience" TEXT,
    "summary" TEXT,
    "decisionContext" TEXT,
    "lastScannedAt" TIMESTAMP(3),
    "nextScanAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Radar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceItem" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "rawContent" TEXT,
    "sourceType" "IntelligenceSourceType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceAuthor" TEXT,
    "sourcePublishedAt" TIMESTAMP(3),
    "technologyName" TEXT,
    "vendor" TEXT,
    "topic" TEXT,
    "keywords" JSONB,
    "lifecycleStatus" "IntelligenceLifecycleStatus" NOT NULL DEFAULT 'DISCOVERED',
    "capturedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnologyAnalysis" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'DRAFT',
    "analysisType" "AnalysisType" NOT NULL DEFAULT 'HYBRID',
    "analysisInputSummary" TEXT,
    "analysisPromptVersion" TEXT,
    "executiveSummary" TEXT NOT NULL,
    "opportunity" TEXT,
    "risk" TEXT,
    "adoptionSignals" TEXT,
    "uncertainties" TEXT,
    "conclusion" TEXT,
    "sourceTrustScore" INTEGER NOT NULL,
    "technicalValueScore" INTEGER NOT NULL,
    "engineeringReadinessScore" INTEGER NOT NULL,
    "businessRelevanceScore" INTEGER NOT NULL,
    "adoptionRiskScore" INTEGER NOT NULL,
    "strategicValueScore" INTEGER NOT NULL,
    "communityHeatScore" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnologyAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisSourceRef" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "intelligenceItemId" TEXT NOT NULL,
    "relationType" "AnalysisSourceRelationType" NOT NULL DEFAULT 'SUPPORTING',
    "weight" INTEGER,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisSourceRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "actionType" "RecommendationActionType" NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "expectedOutcome" TEXT,
    "riskNote" TEXT,
    "priority" "PriorityLevel" DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "decisionMemo" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoC" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "status" "PocStatus" NOT NULL DEFAULT 'PLANNED',
    "objective" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "outcome" "PocOutcome",
    "plan" TEXT,
    "findings" TEXT,
    "risks" TEXT,
    "recommendationBack" TEXT,
    "repoUrl" TEXT,
    "demoUrl" TEXT,
    "artifactUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeSpentHours" DECIMAL(6,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "reportDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DailyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT NOT NULL,
    "highlights" TEXT,
    "decisions" TEXT,
    "risks" TEXT,
    "nextActions" TEXT,
    "newIntelligenceCount" INTEGER NOT NULL DEFAULT 0,
    "newAnalysisCount" INTEGER NOT NULL DEFAULT 0,
    "newRecommendationCount" INTEGER NOT NULL DEFAULT 0,
    "activePocCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "radarId" TEXT,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "actionType" "ActivityActionType" NOT NULL,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Radar_ownerId_idx" ON "Radar"("ownerId");

-- CreateIndex
CREATE INDEX "Radar_organizationId_idx" ON "Radar"("organizationId");

-- CreateIndex
CREATE INDEX "Radar_ownerId_isActive_idx" ON "Radar"("ownerId", "isActive");

-- CreateIndex
CREATE INDEX "Radar_ownerId_status_idx" ON "Radar"("ownerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Radar_ownerId_slug_key" ON "Radar"("ownerId", "slug");

-- CreateIndex
CREATE INDEX "IntelligenceItem_ownerId_idx" ON "IntelligenceItem"("ownerId");

-- CreateIndex
CREATE INDEX "IntelligenceItem_radarId_idx" ON "IntelligenceItem"("radarId");

-- CreateIndex
CREATE INDEX "IntelligenceItem_lifecycleStatus_idx" ON "IntelligenceItem"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "IntelligenceItem_sourcePublishedAt_idx" ON "IntelligenceItem"("sourcePublishedAt");

-- CreateIndex
CREATE INDEX "IntelligenceItem_technologyName_idx" ON "IntelligenceItem"("technologyName");

-- CreateIndex
CREATE INDEX "IntelligenceItem_vendor_idx" ON "IntelligenceItem"("vendor");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceItem_radarId_sourceUrl_key" ON "IntelligenceItem"("radarId", "sourceUrl");

-- CreateIndex
CREATE INDEX "TechnologyAnalysis_ownerId_idx" ON "TechnologyAnalysis"("ownerId");

-- CreateIndex
CREATE INDEX "TechnologyAnalysis_radarId_idx" ON "TechnologyAnalysis"("radarId");

-- CreateIndex
CREATE INDEX "TechnologyAnalysis_status_idx" ON "TechnologyAnalysis"("status");

-- CreateIndex
CREATE INDEX "TechnologyAnalysis_analysisType_idx" ON "TechnologyAnalysis"("analysisType");

-- CreateIndex
CREATE INDEX "TechnologyAnalysis_radarId_updatedAt_idx" ON "TechnologyAnalysis"("radarId", "updatedAt");

-- CreateIndex
CREATE INDEX "AnalysisSourceRef_analysisId_idx" ON "AnalysisSourceRef"("analysisId");

-- CreateIndex
CREATE INDEX "AnalysisSourceRef_intelligenceItemId_idx" ON "AnalysisSourceRef"("intelligenceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisSourceRef_analysisId_intelligenceItemId_key" ON "AnalysisSourceRef"("analysisId", "intelligenceItemId");

-- CreateIndex
CREATE INDEX "Recommendation_ownerId_idx" ON "Recommendation"("ownerId");

-- CreateIndex
CREATE INDEX "Recommendation_radarId_idx" ON "Recommendation"("radarId");

-- CreateIndex
CREATE INDEX "Recommendation_analysisId_idx" ON "Recommendation"("analysisId");

-- CreateIndex
CREATE INDEX "Recommendation_actionType_idx" ON "Recommendation"("actionType");

-- CreateIndex
CREATE INDEX "Recommendation_status_idx" ON "Recommendation"("status");

-- CreateIndex
CREATE INDEX "Recommendation_radarId_status_idx" ON "Recommendation"("radarId", "status");

-- CreateIndex
CREATE INDEX "PoC_ownerId_idx" ON "PoC"("ownerId");

-- CreateIndex
CREATE INDEX "PoC_radarId_idx" ON "PoC"("radarId");

-- CreateIndex
CREATE INDEX "PoC_recommendationId_idx" ON "PoC"("recommendationId");

-- CreateIndex
CREATE INDEX "PoC_status_idx" ON "PoC"("status");

-- CreateIndex
CREATE INDEX "PoC_startDate_idx" ON "PoC"("startDate");

-- CreateIndex
CREATE INDEX "PoC_radarId_status_idx" ON "PoC"("radarId", "status");

-- CreateIndex
CREATE INDEX "DailyReport_ownerId_idx" ON "DailyReport"("ownerId");

-- CreateIndex
CREATE INDEX "DailyReport_radarId_idx" ON "DailyReport"("radarId");

-- CreateIndex
CREATE INDEX "DailyReport_reportDate_idx" ON "DailyReport"("reportDate");

-- CreateIndex
CREATE INDEX "DailyReport_status_idx" ON "DailyReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_radarId_reportDate_key" ON "DailyReport"("radarId", "reportDate");

-- CreateIndex
CREATE INDEX "ActivityLog_ownerId_idx" ON "ActivityLog"("ownerId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE INDEX "ActivityLog_radarId_idx" ON "ActivityLog"("radarId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Radar" ADD CONSTRAINT "Radar_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceItem" ADD CONSTRAINT "IntelligenceItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceItem" ADD CONSTRAINT "IntelligenceItem_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyAnalysis" ADD CONSTRAINT "TechnologyAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyAnalysis" ADD CONSTRAINT "TechnologyAnalysis_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisSourceRef" ADD CONSTRAINT "AnalysisSourceRef_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "TechnologyAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisSourceRef" ADD CONSTRAINT "AnalysisSourceRef_intelligenceItemId_fkey" FOREIGN KEY ("intelligenceItemId") REFERENCES "IntelligenceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "TechnologyAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoC" ADD CONSTRAINT "PoC_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoC" ADD CONSTRAINT "PoC_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoC" ADD CONSTRAINT "PoC_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
