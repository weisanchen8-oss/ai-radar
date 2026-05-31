/**
 * 文件作用：
 * 读取 Dashboard 决策驾驶舱所需的真实数据库数据。
 * 本文件只负责数据查询与聚合，不负责页面 UI 展示。
 */

import { prisma } from "@/lib/prisma";
import { getTopConnectedTechnologies } from "@/lib/data/technology-graph";

export async function getDashboardDecisionData() {
  const [dashboardResult, topConnectedTechnologies] = await Promise.all([
    prisma.$transaction([
      prisma.radar.count(),
      prisma.radar.count({
        where: {
          isActive: true,
        },
      }),
      prisma.radar.count({
        where: {
          scanIntensity: "HIGH",
        },
      }),

      prisma.technologyAnalysis.count(),
      prisma.technologyAnalysis.count({
        where: {
          strategicValueScore: {
            gte: 4,
          },
        },
      }),
      prisma.technologyAnalysis.count({
        where: {
          status: {
            in: ["GENERATED", "REVIEWED"],
          },
        },
      }),

      prisma.recommendation.count({
        where: {
          actionType: "VALIDATE_BY_POC",
        },
      }),
      prisma.recommendation.count({
        where: {
          actionType: "WATCH",
        },
      }),
      prisma.recommendation.count({
        where: {
          actionType: "REJECT_FOR_NOW",
        },
      }),
      prisma.recommendation.count({
        where: {
          actionType: "NEED_MORE_INFO",
        },
      }),

      prisma.poC.count({
        where: {
          status: "PLANNED",
        },
      }),
      prisma.poC.count({
        where: {
          status: "IN_PROGRESS",
        },
      }),
      prisma.poC.count({
        where: {
          status: "DONE",
        },
      }),
      prisma.poC.count({
        where: {
          status: "CANCELLED",
        },
      }),

      prisma.technologyAnalysis.findMany({
        where: {
          strategicValueScore: {
            gte: 4,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 4,
        select: {
          id: true,
          radarId: true,
          title: true,
          status: true,
          executiveSummary: true,
          conclusion: true,
          strategicValueScore: true,
          businessRelevanceScore: true,
          engineeringReadinessScore: true,
          adoptionRiskScore: true,
          updatedAt: true,
          radar: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.technologyAnalysis.findMany({
        where: {
          adoptionRiskScore: {
            gte: 4,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 3,
        select: {
          id: true,
          radarId: true,
          title: true,
          risk: true,
          adoptionRiskScore: true,
          updatedAt: true,
          radar: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.dailyReport.findMany({
        orderBy: {
          reportDate: "desc",
        },
        take: 3,
        select: {
          id: true,
          radarId: true,
          title: true,
          summary: true,
          reportDate: true,
          status: true,
          createdAt: true,
          radar: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.radar.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          isActive: true,
          scanIntensity: true,
          businessDomain: true,
          focusQuestion: true,
          lastScannedAt: true,
          nextScanAt: true,
          _count: {
            select: {
              intelligenceItems: true,
              technologyAnalyses: true,
              recommendations: true,
              pocs: true,
              dailyReports: true,
            },
          },
        },
      }),
    ]),
    getTopConnectedTechnologies(6),
  ]);

  const [
    radarTotal,
    activeRadarTotal,
    highIntensityRadarTotal,

    analysisTotal,
    highStrategicValueAnalysisTotal,
    pendingReviewAnalysisTotal,

    validateByPocRecommendationTotal,
    watchRecommendationTotal,
    rejectForNowRecommendationTotal,
    needMoreInfoRecommendationTotal,

    plannedPocTotal,
    inProgressPocTotal,
    donePocTotal,
    cancelledPocTotal,

    recentHighValueAnalyses,
    recentRiskAnalyses,
    recentDailyReports,
    radars,
  ] = dashboardResult;

  return {
    radarOverview: {
      radarTotal,
      activeRadarTotal,
      highIntensityRadarTotal,
    },
    analysisOverview: {
      analysisTotal,
      highStrategicValueAnalysisTotal,
      pendingReviewAnalysisTotal,
    },
    recommendationOverview: {
      validateByPocRecommendationTotal,
      watchRecommendationTotal,
      rejectForNowRecommendationTotal,
      needMoreInfoRecommendationTotal,
    },
    pocOverview: {
      plannedPocTotal,
      inProgressPocTotal,
      donePocTotal,
      cancelledPocTotal,
    },
    recentHighValueAnalyses,
    recentRiskAnalyses,
    recentDailyReports,
    radars,
    topConnectedTechnologies,
  };
}

export type DashboardDecisionData = Awaited<
  ReturnType<typeof getDashboardDecisionData>
>;