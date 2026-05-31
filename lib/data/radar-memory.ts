/**
 * 文件作用：
 * Radar Memory 数据层。
 * 负责将 TechnologyAnalysis、Recommendation、PoC 自动沉淀为 DecisionTimeline。
 */

import {
  DecisionType,
  PocOutcome,
  PocStatus,
  RecommendationActionType,
  RecommendationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

function cleanTechnologyName(value?: string | null) {
  return value?.trim() || "未命名技术";
}

function pickTechnologyNameFromAnalysis(analysis: {
  title: string;
  sourceRefs: {
    intelligenceItem: {
      technologyName: string | null;
      title: string;
    };
  }[];
}) {
  const firstSource = analysis.sourceRefs[0]?.intelligenceItem;

  return cleanTechnologyName(
    firstSource?.technologyName ||
      firstSource?.title ||
      analysis.title.replace(/^技术分析：/, ""),
  );
}

async function createDecisionIfMissing(input: {
  radarId: string;
  technologyName: string;
  decisionType: DecisionType;
  summary: string;
  reason: string;
  sourceAnalysisId?: string | null;
  sourcePocId?: string | null;
}) {
  const existed = await prisma.decisionTimeline.findFirst({
    where: {
      radarId: input.radarId,
      decisionType: input.decisionType,
      sourceAnalysisId: input.sourceAnalysisId ?? null,
      sourcePocId: input.sourcePocId ?? null,
      summary: input.summary,
    },
    select: {
      id: true,
    },
  });

  if (existed) {
    return existed;
  }

  return prisma.decisionTimeline.create({
    data: {
      radarId: input.radarId,
      technologyName: input.technologyName,
      decisionType: input.decisionType,
      summary: input.summary,
      reason: input.reason,
      sourceAnalysisId: input.sourceAnalysisId ?? null,
      sourcePocId: input.sourcePocId ?? null,
    },
  });
}

function mapRecommendationToDecisionType(input: {
  actionType: RecommendationActionType;
  status: RecommendationStatus;
}) {
  if (
    input.status === RecommendationStatus.REJECTED ||
    input.actionType === RecommendationActionType.REJECT_FOR_NOW
  ) {
    return DecisionType.REJECTED;
  }

  if (
    input.actionType === RecommendationActionType.ADOPT_INCREMENTALLY &&
    (input.status === RecommendationStatus.ACCEPTED ||
      input.status === RecommendationStatus.DONE)
  ) {
    return DecisionType.INTEGRATED;
  }

  return DecisionType.RECOMMENDED;
}

function mapPocToDecisionType(input: {
  status: PocStatus;
  outcome: PocOutcome | null;
}) {
  if (input.status === PocStatus.CANCELLED) {
    return DecisionType.ARCHIVED;
  }

  if (input.status !== PocStatus.DONE) {
    return null;
  }

  if (
    input.outcome === PocOutcome.SUCCESS ||
    input.outcome === PocOutcome.PARTIAL
  ) {
    return DecisionType.VALIDATED;
  }

  if (
    input.outcome === PocOutcome.FAILED ||
    input.outcome === PocOutcome.INCONCLUSIVE
  ) {
    return DecisionType.REJECTED;
  }

  return DecisionType.VALIDATED;
}

export async function syncRadarDecisionTimeline(radarId: string) {
  const [analyses, recommendations, pocs] = await Promise.all([
    prisma.technologyAnalysis.findMany({
      where: { radarId },
      include: {
        sourceRefs: {
          include: {
            intelligenceItem: {
              select: {
                title: true,
                technologyName: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.recommendation.findMany({
      where: { radarId },
      include: {
        analysis: {
          include: {
            sourceRefs: {
              include: {
                intelligenceItem: {
                  select: {
                    title: true,
                    technologyName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.poC.findMany({
      where: { radarId },
      include: {
        recommendation: {
          include: {
            analysis: {
              include: {
                sourceRefs: {
                  include: {
                    intelligenceItem: {
                      select: {
                        title: true,
                        technologyName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  for (const analysis of analyses) {
    const technologyName = pickTechnologyNameFromAnalysis(analysis);

    await createDecisionIfMissing({
      radarId,
      technologyName,
      decisionType: DecisionType.ANALYZED,
      summary: `完成技术分析：${analysis.title}`,
      reason:
        analysis.conclusion ||
        analysis.executiveSummary ||
        "系统已基于当前情报形成结构化技术分析。",
      sourceAnalysisId: analysis.id,
    });
  }

  for (const recommendation of recommendations) {
    const technologyName = pickTechnologyNameFromAnalysis(recommendation.analysis);
    const decisionType = mapRecommendationToDecisionType({
      actionType: recommendation.actionType,
      status: recommendation.status,
    });

    await createDecisionIfMissing({
      radarId,
      technologyName,
      decisionType,
      summary: `形成推荐动作：${recommendation.title}`,
      reason:
        recommendation.rationale ||
        recommendation.summary ||
        "系统已根据技术分析形成推荐动作。",
      sourceAnalysisId: recommendation.analysisId,
    });
  }

  for (const poc of pocs) {
    const decisionType = mapPocToDecisionType({
      status: poc.status,
      outcome: poc.outcome,
    });

    if (!decisionType) {
      continue;
    }

    const technologyName = pickTechnologyNameFromAnalysis(
      poc.recommendation.analysis,
    );

    await createDecisionIfMissing({
      radarId,
      technologyName,
      decisionType,
      summary: `记录 PoC 结论：${poc.title}`,
      reason:
        poc.recommendationBack ||
        poc.findings ||
        poc.outcome ||
        "PoC 已产生阶段性验证结论。",
      sourceAnalysisId: poc.recommendation.analysisId,
      sourcePocId: poc.id,
    });
  }
}

export async function getDecisionHistoryForRadar(radarId: string, take = 8) {
  return prisma.decisionTimeline.findMany({
    where: { radarId },
    orderBy: {
      createdAt: "desc",
    },
    take,
    include: {
      sourceAnalysis: {
        select: {
          id: true,
          title: true,
        },
      },
      sourcePoc: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function getHistoricalDecisionsForTechnology(input: {
  radarId: string;
  technologyName: string;
}) {
  return prisma.decisionTimeline.findMany({
    where: {
      radarId: input.radarId,
      technologyName: input.technologyName,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sourceAnalysis: {
        select: {
          id: true,
          title: true,
        },
      },
      sourcePoc: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function getRecentDecisionsForDashboard(take = 6) {
  return prisma.decisionTimeline.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take,
    include: {
      radar: {
        select: {
          id: true,
          name: true,
        },
      },
      sourceAnalysis: {
        select: {
          id: true,
          title: true,
        },
      },
      sourcePoc: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}