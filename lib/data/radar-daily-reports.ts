import { PocStatus, RecommendationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function normalizeReportDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function getNextDate(value: Date) {
  const nextDate = new Date(value);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate;
}

export function formatReportDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function getRadarDailyReportListData(radarId: string) {
  const radar = await prisma.radar.findUnique({
    where: { id: radarId },
    select: {
      id: true,
      name: true,
      description: true,
      businessDomain: true,
      focusQuestion: true,
      observationScope: true,
      targetAudience: true,
      decisionContext: true,
      status: true,
      isActive: true,
      updatedAt: true,
    },
  });

  if (!radar) {
    return null;
  }

  const [reports, latestAnalyses, latestRecommendations, activePocs] =
    await Promise.all([
      prisma.dailyReport.findMany({
        where: { radarId },
        orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          status: true,
          reportDate: true,
          summary: true,
          newIntelligenceCount: true,
          newAnalysisCount: true,
          newRecommendationCount: true,
          activePocCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.technologyAnalysis.findMany({
        where: { radarId },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 3,
        select: {
          id: true,
          title: true,
          executiveSummary: true,
          conclusion: true,
          updatedAt: true,
        },
      }),

      prisma.recommendation.findMany({
        where: { radarId },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          actionType: true,
          status: true,
          summary: true,
          rationale: true,
          priority: true,
          createdAt: true,
        },
      }),

      prisma.poC.findMany({
        where: {
          radarId,
          status: {
            in: [PocStatus.PLANNED, PocStatus.IN_PROGRESS],
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          objective: true,
          outcome: true,
          updatedAt: true,
        },
      }),
    ]);

  return {
    radar,
    reports,
    latestAnalyses,
    latestRecommendations,
    activePocs,
  };
}

export async function getRadarDailyReportDetailData(
  radarId: string,
  reportId: string,
) {
  const report = await prisma.dailyReport.findFirst({
    where: {
      id: reportId,
      radarId,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      title: true,
      status: true,
      reportDate: true,
      summary: true,
      highlights: true,
      decisions: true,
      risks: true,
      nextActions: true,
      newIntelligenceCount: true,
      newAnalysisCount: true,
      newRecommendationCount: true,
      activePocCount: true,
      publishedAt: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      radar: {
        select: {
          id: true,
          name: true,
          description: true,
          businessDomain: true,
          focusQuestion: true,
          observationScope: true,
          targetAudience: true,
          decisionContext: true,
        },
      },
    },
  });

  if (!report) {
    return null;
  }

  const startDate = report.reportDate;
  const endDate = getNextDate(startDate);

  const [intelligenceItems, analyses, recommendations, pocs] =
    await Promise.all([
      prisma.intelligenceItem.findMany({
        where: {
          radarId,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          summary: true,
          sourceType: true,
          sourceName: true,
          sourceUrl: true,
          technologyName: true,
          createdAt: true,
        },
      }),

      prisma.technologyAnalysis.findMany({
        where: {
          radarId,
          OR: [
            {
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              updatedAt: {
                gte: startDate,
                lt: endDate,
              },
            },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          title: true,
          executiveSummary: true,
          conclusion: true,
          opportunity: true,
          risk: true,
          updatedAt: true,
        },
      }),

      prisma.recommendation.findMany({
        where: {
          radarId,
          OR: [
            {
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              updatedAt: {
                gte: startDate,
                lt: endDate,
              },
            },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          title: true,
          actionType: true,
          status: true,
          summary: true,
          rationale: true,
          expectedOutcome: true,
          riskNote: true,
          priority: true,
          createdAt: true,
        },
      }),

      prisma.poC.findMany({
        where: {
          radarId,
          OR: [
            {
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              updatedAt: {
                gte: startDate,
                lt: endDate,
              },
            },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          objective: true,
          findings: true,
          outcome: true,
          recommendationBack: true,
          updatedAt: true,
        },
      }),
    ]);

  return {
    report,
    intelligenceItems,
    analyses,
    recommendations,
    pocs,
  };
}

export async function buildDailyReportContent(input: {
  radarId: string;
  reportDate: Date;
}) {
  const { radarId, reportDate } = input;
  const nextDate = getNextDate(reportDate);

  const radar = await prisma.radar.findUnique({
    where: { id: radarId },
    select: {
      id: true,
      ownerId: true,
      organizationId: true,
      visibility: true,
      name: true,
      description: true,
      businessDomain: true,
      focusQuestion: true,
      observationScope: true,
      targetAudience: true,
      decisionContext: true,
      summary: true,
    },
  });

  if (!radar) {
    return null;
  }

  const [newIntelligence, updatedAnalyses, updatedRecommendations, updatedPocs] =
    await Promise.all([
      prisma.intelligenceItem.findMany({
        where: {
          radarId,
          createdAt: {
            gte: reportDate,
            lt: nextDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          summary: true,
          technologyName: true,
          sourceName: true,
          sourceType: true,
          createdAt: true,
        },
      }),

      prisma.technologyAnalysis.findMany({
        where: {
          radarId,
          OR: [
            {
              createdAt: {
                gte: reportDate,
                lt: nextDate,
              },
            },
            {
              updatedAt: {
                gte: reportDate,
                lt: nextDate,
              },
            },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          executiveSummary: true,
          conclusion: true,
          opportunity: true,
          risk: true,
          updatedAt: true,
        },
      }),

      prisma.recommendation.findMany({
        where: {
          radarId,
          OR: [
            {
              createdAt: {
                gte: reportDate,
                lt: nextDate,
              },
            },
            {
              updatedAt: {
                gte: reportDate,
                lt: nextDate,
              },
            },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          actionType: true,
          status: true,
          summary: true,
          rationale: true,
          expectedOutcome: true,
          riskNote: true,
          priority: true,
        },
      }),

      prisma.poC.findMany({
        where: {
          radarId,
          OR: [
            {
              createdAt: {
                gte: reportDate,
                lt: nextDate,
              },
            },
            {
              updatedAt: {
                gte: reportDate,
                lt: nextDate,
              },
            },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          objective: true,
          outcome: true,
          findings: true,
          risks: true,
          recommendationBack: true,
        },
      }),
    ]);

  const [fallbackAnalyses, fallbackRecommendations, activePocs] =
    await Promise.all([
      updatedAnalyses.length > 0
        ? Promise.resolve([])
        : prisma.technologyAnalysis.findMany({
            where: { radarId },
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            take: 3,
            select: {
              id: true,
              title: true,
              executiveSummary: true,
              conclusion: true,
              opportunity: true,
              risk: true,
              updatedAt: true,
            },
          }),

      updatedRecommendations.length > 0
        ? Promise.resolve([])
        : prisma.recommendation.findMany({
            where: {
              radarId,
              status: {
                in: [RecommendationStatus.OPEN, RecommendationStatus.ACCEPTED],
              },
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
            take: 3,
            select: {
              id: true,
              title: true,
              actionType: true,
              status: true,
              summary: true,
              rationale: true,
              expectedOutcome: true,
              riskNote: true,
              priority: true,
            },
          }),

      prisma.poC.findMany({
        where: {
          radarId,
          status: {
            in: [PocStatus.PLANNED, PocStatus.IN_PROGRESS],
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          objective: true,
          outcome: true,
          findings: true,
          risks: true,
          recommendationBack: true,
        },
      }),
    ]);

  const reportAnalyses =
    updatedAnalyses.length > 0 ? updatedAnalyses : fallbackAnalyses;
  const reportRecommendations =
    updatedRecommendations.length > 0
      ? updatedRecommendations
      : fallbackRecommendations;
  const reportPocs = updatedPocs.length > 0 ? updatedPocs : activePocs;

  const reportDateText = reportDate.toISOString().slice(0, 10);

  const summary = [
    `本日报基于 Radar「${radar.name}」在 ${reportDateText} 的技术分析、推荐动作与 PoC 验证记录生成。`,
    radar.focusQuestion ? `当前关注问题：${radar.focusQuestion}` : null,
    radar.businessDomain ? `业务领域：${radar.businessDomain}` : null,
    `当日新增情报 ${newIntelligence.length} 条，更新分析 ${updatedAnalyses.length} 条，更新推荐 ${updatedRecommendations.length} 条，相关 PoC ${updatedPocs.length} 条，当前活跃 PoC ${activePocs.length} 条。`,
  ]
    .filter(Boolean)
    .join("\n");

  const highlights = [
    `【Radar 摘要】\n${radar.summary || radar.description || "暂无 Radar 摘要。"}`,
    `【技术分析】\n${
      reportAnalyses.length === 0
        ? "暂无新的技术分析更新。"
        : reportAnalyses
            .map(
              (item, index) =>
                `${index + 1}. ${item.title}\n摘要：${
                  item.executiveSummary || "暂无摘要"
                }\n结论：${item.conclusion || "暂无结论"}`,
            )
            .join("\n\n")
    }`,
    `【推荐动作】\n${
      reportRecommendations.length === 0
        ? "暂无新的推荐动作。"
        : reportRecommendations
            .map(
              (item, index) =>
                `${index + 1}. ${item.title}\n动作：${
                  item.actionType
                }\n摘要：${item.summary || item.rationale || "暂无摘要"}`,
            )
            .join("\n\n")
    }`,
    `【PoC 验证】\n${
      reportPocs.length === 0
        ? "暂无活跃或更新的 PoC。"
        : reportPocs
            .map(
              (item, index) =>
                `${index + 1}. ${item.title}\n状态：${
                  item.status
                }\n目标：${item.objective || "暂无目标"}\n结论：${
                  item.outcome || "暂无结论"
                }`,
            )
            .join("\n\n")
    }`,
  ].join("\n\n");

  const decisions =
    reportRecommendations.length === 0
      ? "暂无需要立即决策的推荐动作。"
      : reportRecommendations
          .map(
            (item, index) =>
              `${index + 1}. ${item.title}\n建议动作：${
                item.actionType
              }\n推荐理由：${item.rationale || "暂无推荐理由"}\n预期结果：${
                item.expectedOutcome || "暂无预期结果"
              }`,
          )
          .join("\n\n");

  const risks = [
    ...reportAnalyses
      .filter((item) => item.risk)
      .map((item) => `分析风险：${item.title}\n${item.risk}`),
    ...reportRecommendations
      .filter((item) => item.riskNote)
      .map((item) => `推荐风险：${item.title}\n${item.riskNote}`),
    ...reportPocs
      .filter((item) => item.risks)
      .map((item) => `PoC 风险：${item.title}\n${item.risks}`),
  ].join("\n\n");

  const nextActions = [
    ...reportRecommendations
      .filter(
        (item) =>
          item.actionType === "VALIDATE_BY_POC" ||
          item.actionType === "ADOPT_INCREMENTALLY",
      )
      .map((item) => `推进推荐：${item.title}，建议动作：${item.actionType}`),
    ...activePocs.map((item) => `跟进 PoC：${item.title}，当前状态：${item.status}`),
  ];

  return {
    radar,
    reportDate,
    title: `${radar.name} · ${reportDateText} 日报`,
    summary,
    highlights,
    decisions,
    risks: risks || "暂无明显风险更新。",
    nextActions:
      nextActions.length === 0
        ? "暂无明确下一步动作。"
        : nextActions.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    counts: {
      newIntelligenceCount: newIntelligence.length,
      newAnalysisCount: updatedAnalyses.length,
      newRecommendationCount: updatedRecommendations.length,
      activePocCount: activePocs.length,
    },
    metadata: {
      generatedBy: "manual",
      radarSnapshot: {
        id: radar.id,
        name: radar.name,
        businessDomain: radar.businessDomain,
        focusQuestion: radar.focusQuestion,
        observationScope: radar.observationScope,
        targetAudience: radar.targetAudience,
      },
      referencedIntelligenceIds: newIntelligence.map((item) => item.id),
      referencedAnalysisIds: reportAnalyses.map((item) => item.id),
      referencedRecommendationIds: reportRecommendations.map((item) => item.id),
      referencedPocIds: reportPocs.map((item) => item.id),
    },
  };
}