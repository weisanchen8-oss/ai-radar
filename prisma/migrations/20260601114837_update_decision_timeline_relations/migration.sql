-- CreateEnum
CREATE TYPE "DecisionTimelineEventType" AS ENUM ('RECOMMENDATION_OPENED', 'RECOMMENDATION_ACCEPTED', 'RECOMMENDATION_REJECTED', 'RECOMMENDATION_POC_CREATED', 'RECOMMENDATION_DONE', 'POC_STARTED', 'POC_DONE', 'NOTE');

-- DropIndex
DROP INDEX "DecisionTimeline_technologyName_idx";

-- AlterTable
ALTER TABLE "DecisionTimeline" ADD COLUMN     "description" TEXT,
ADD COLUMN     "eventType" "DecisionTimelineEventType",
ADD COLUMN     "fromStatus" "RecommendationStatus",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "recommendationId" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "toStatus" "RecommendationStatus",
ALTER COLUMN "technologyName" DROP NOT NULL,
ALTER COLUMN "decisionType" DROP NOT NULL,
ALTER COLUMN "summary" DROP NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "DecisionTimeline_ownerId_idx" ON "DecisionTimeline"("ownerId");

-- CreateIndex
CREATE INDEX "DecisionTimeline_recommendationId_idx" ON "DecisionTimeline"("recommendationId");

-- CreateIndex
CREATE INDEX "DecisionTimeline_eventType_idx" ON "DecisionTimeline"("eventType");

-- AddForeignKey
ALTER TABLE "DecisionTimeline" ADD CONSTRAINT "DecisionTimeline_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionTimeline" ADD CONSTRAINT "DecisionTimeline_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
