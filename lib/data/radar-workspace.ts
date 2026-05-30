import { PocStatus, PriorityLevel } from "@prisma/client";
import { prisma } from "../prisma";

const radarSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  businessDomain: true,
  focusQuestion: true,
  observationScope: true,
  targetAudience: true,
  summary: true,
  decisionContext: true,
  isActive: true,
  scanIntensity: true,
  lastScannedAt: true,
  nextScanAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const intelligenceSelect = {
  id: true,
  title: true,
  summary: true,
  sourceType: true,
  sourceUrl: true,
  sourceName: true,
  sourcePublishedAt: true,
  technologyName: true,
  lifecycleStatus: true,
  createdAt: true,
} as const;

const analysisSelect = {
  id: true,
  title: true,
  status: true,
  analysisType: true,
  executiveSummary: true,
  conclusion: true,
  sourceTrustScore: true,
  technicalValueScore: true,
  engineeringReadinessScore: true,
  businessRelevanceScore: true,
  adoptionRiskScore: true,
  strategicValueScore: true,
  communityHeatScore: true,
  createdAt: true,
  updatedAt: true,
} as const;

const recommendationSelect = {
  id: true,
  title: true,
  summary: true,
  actionType: true,
  status: true,
  rationale: true,
  priority: true,
  createdAt: true,
} as const;

const pocSelect = {
  id: true,
  title: true,
  objective: true,
  status: true,
  outcome: true,
  createdAt: true,
  updatedAt: true,
} as const;

const reportSelect = {
  id: true,
  title: true,
  summary: true,
  status: true,
  reportDate: true,
  createdAt: true,
} as const;

const activitySelect = {
  id: true,
  entityType: true,
  actionType: true,
  message: true,
  createdAt: true,
} as const;

export async function getRadarWorkspaceData(radarId: string) {
  const radar = await prisma.radar.findUnique({
    where: { id: radarId },
    select: radarSelect,
  });

  if (!radar) {
    return null;
  }

  const [
    recentIntelligence,
    recentAnalyses,
    recentRecommendations,
    recentPocs,
    recentDailyReports,
    recentActivityLogs,
    intelligenceItemCount,
    analysisCount,
    recommendationCount,
    pocCount,
    dailyReportCount,
    highPriorityRecommendationCount,
    runningPocCount,
  ] = await Promise.all([
    prisma.intelligenceItem.findMany({
      where: { radarId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: intelligenceSelect,
    }),
    prisma.technologyAnalysis.findMany({
      where: { radarId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: analysisSelect,
    }),
    prisma.recommendation.findMany({
      where: { radarId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: recommendationSelect,
    }),
    prisma.poC.findMany({
      where: { radarId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: pocSelect,
    }),
    prisma.dailyReport.findMany({
      where: { radarId },
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: reportSelect,
    }),
    prisma.activityLog.findMany({
      where: { radarId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: activitySelect,
    }),
    prisma.intelligenceItem.count({ where: { radarId } }),
    prisma.technologyAnalysis.count({ where: { radarId } }),
    prisma.recommendation.count({ where: { radarId } }),
    prisma.poC.count({ where: { radarId } }),
    prisma.dailyReport.count({ where: { radarId } }),
    prisma.recommendation.count({
      where: {
        radarId,
        priority: {
          in: [PriorityLevel.HIGH, PriorityLevel.CRITICAL],
        },
      },
    }),
    prisma.poC.count({
      where: {
        radarId,
        status: PocStatus.IN_PROGRESS,
      },
    }),
  ]);

  return {
    radar,
    recentIntelligence,
    recentAnalyses,
    recentRecommendations,
    recentPocs,
    recentDailyReports,
    recentActivityLogs,
    stats: {
      intelligenceItemCount,
      analysisCount,
      recommendationCount,
      pocCount,
      dailyReportCount,
      highPriorityRecommendationCount,
      runningPocCount,
    },
  };
}
