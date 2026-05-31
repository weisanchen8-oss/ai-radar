import { PocStatus, PriorityLevel } from "@prisma/client";
import { prisma } from "../prisma";
import { getRadarTechnologyNetworkData } from "./technology-graph";
import {
  getDecisionHistoryForRadar,
  syncRadarDecisionTimeline,
} from "@/lib/data/radar-memory";

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
  vendor: true,
  topic: true,
  lifecycleStatus: true,
  capturedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const analysisSelect = {
  id: true,
  title: true,
  status: true,
  analysisType: true,
  executiveSummary: true,
  opportunity: true,
  risk: true,
  adoptionSignals: true,
  uncertainties: true,
  conclusion: true,
  sourceTrustScore: true,
  technicalValueScore: true,
  engineeringReadinessScore: true,
  businessRelevanceScore: true,
  adoptionRiskScore: true,
  strategicValueScore: true,
  communityHeatScore: true,
  metadata: true,
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
  expectedOutcome: true,
  riskNote: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

const pocSelect = {
  id: true,
  title: true,
  objective: true,
  hypothesis: true,
  successCriteria: true,
  status: true,
  outcome: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

const reportSelect = {
  id: true,
  title: true,
  summary: true,
  highlights: true,
  decisions: true,
  risks: true,
  nextActions: true,
  status: true,
  reportDate: true,
  newIntelligenceCount: true,
  newAnalysisCount: true,
  newRecommendationCount: true,
  activePocCount: true,
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

  await syncRadarDecisionTimeline(radarId);

  const [
    recentIntelligence,
    recentAnalyses,
    recentRecommendations,
    recentPocs,
    recentDailyReports,
    recentDecisions,
    intelligenceItemCount,
    analysisCount,
    recommendationCount,
    pocCount,
    dailyReportCount,
    highPriorityRecommendationCount,
    runningPocCount,
    technologyNetwork,
  ] = await Promise.all([
    prisma.intelligenceItem.findMany({
      where: { radarId },
      orderBy: [{ sourcePublishedAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: intelligenceSelect,
    }),
    prisma.technologyAnalysis.findMany({
      where: { radarId },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: analysisSelect,
    }),
    prisma.recommendation.findMany({
      where: { radarId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
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
    getDecisionHistoryForRadar(radarId, 8),
    prisma.intelligenceItem.count({ where: { radarId } }),
    prisma.technologyAnalysis.count({ where: { radarId } }),
    prisma.recommendation.count({ where: { radarId } }),
    prisma.poC.count({ where: { radarId } }),
    prisma.dailyReport.count({ where: { radarId } }),
    prisma.recommendation.count({
      where: {
        radarId,
        priority: { in: [PriorityLevel.HIGH, PriorityLevel.CRITICAL] },
      },
    }),
    prisma.poC.count({
      where: {
        radarId,
        status: PocStatus.IN_PROGRESS,
      },
    }),
    getRadarTechnologyNetworkData(radarId),
  ]);

  return {
    radar,
    recentIntelligence,
    recentAnalyses,
    recentRecommendations,
    recentPocs,
    recentDailyReports,
    recentDecisions,
    technologyNetwork,
    stats: {
      intelligenceItemCount,
      analysisCount,
      recommendationCount,
      pocCount,
      dailyReportCount,
      highPriorityRecommendationCount,
      runningPocCount,
      technologyNodeCount: technologyNetwork?.stats.nodeCount ?? 0,
      technologyRelationCount: technologyNetwork?.stats.relationCount ?? 0,
    },
  };
}