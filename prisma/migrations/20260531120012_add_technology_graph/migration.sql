-- CreateEnum
CREATE TYPE "TechnologyRelationType" AS ENUM ('RELATED', 'ALTERNATIVE', 'DEPENDENCY', 'PART_OF', 'ENABLES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityEntityType" ADD VALUE 'TECHNOLOGY_NODE';
ALTER TYPE "ActivityEntityType" ADD VALUE 'TECHNOLOGY_RELATION';

-- CreateTable
CREATE TABLE "TechnologyNode" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnologyNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnologyRelation" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "radarId" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "relationType" "TechnologyRelationType" NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnologyRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechnologyNode_ownerId_idx" ON "TechnologyNode"("ownerId");

-- CreateIndex
CREATE INDEX "TechnologyNode_radarId_idx" ON "TechnologyNode"("radarId");

-- CreateIndex
CREATE INDEX "TechnologyNode_category_idx" ON "TechnologyNode"("category");

-- CreateIndex
CREATE INDEX "TechnologyNode_organizationId_idx" ON "TechnologyNode"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnologyNode_radarId_name_key" ON "TechnologyNode"("radarId", "name");

-- CreateIndex
CREATE INDEX "TechnologyRelation_ownerId_idx" ON "TechnologyRelation"("ownerId");

-- CreateIndex
CREATE INDEX "TechnologyRelation_radarId_idx" ON "TechnologyRelation"("radarId");

-- CreateIndex
CREATE INDEX "TechnologyRelation_sourceNodeId_idx" ON "TechnologyRelation"("sourceNodeId");

-- CreateIndex
CREATE INDEX "TechnologyRelation_targetNodeId_idx" ON "TechnologyRelation"("targetNodeId");

-- CreateIndex
CREATE INDEX "TechnologyRelation_relationType_idx" ON "TechnologyRelation"("relationType");

-- CreateIndex
CREATE INDEX "TechnologyRelation_radarId_relationType_idx" ON "TechnologyRelation"("radarId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "TechnologyRelation_sourceNodeId_targetNodeId_relationType_key" ON "TechnologyRelation"("sourceNodeId", "targetNodeId", "relationType");

-- AddForeignKey
ALTER TABLE "TechnologyNode" ADD CONSTRAINT "TechnologyNode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyNode" ADD CONSTRAINT "TechnologyNode_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyRelation" ADD CONSTRAINT "TechnologyRelation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyRelation" ADD CONSTRAINT "TechnologyRelation_radarId_fkey" FOREIGN KEY ("radarId") REFERENCES "Radar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyRelation" ADD CONSTRAINT "TechnologyRelation_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "TechnologyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyRelation" ADD CONSTRAINT "TechnologyRelation_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "TechnologyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
