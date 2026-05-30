/**
 * 文件作用：
 * AI 技术分析模块的业务服务层。
 * 负责：
 * 1. 调用 OpenAI-compatible LLM 封装
 * 2. 规范化 AI JSON
 * 3. 写入 TechnologyAnalysis / Recommendation / DailyReport / Radar
 * 4. 写入 ActivityLog
 *
 * 注意：
 * - 规则逻辑仍由本文件控制，例如分数裁剪、推荐动作兜底、状态写入。
 * - AI 只生成结构化内容，不直接决定数据库状态流转。
 */

import {
  ActivityActionType,
  ActivityEntityType,
  AnalysisSourceRelationType,
  AnalysisStatus,
  AnalysisType,
  DailyReportStatus,
  IntelligenceLifecycleStatus,
  PriorityLevel,
  RecommendationActionType,
  ScanIntensity,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { clampScore, clampText, normalizeStringArray } from "./json";
import {
  createMockDailyReport,
  createMockRadarSummary,
  createMockSuggestedRadarConfig,
  createMockTechnologyAnalysis,
} from "./mock";
import { requestAiJson } from "./openai-compatible";
import {
  AI_RADAR_PROMPT_VERSION,
  buildAnalyzeTechnologyMessages,
  buildDailyReportMessages,
  buildRadarSummaryMessages,
  buildSuggestRadarConfigMessages,
} from "./prompts";
import type {
  DailyReportJson,
  RadarContextInput,
  RadarSummaryJson,
  SuggestedRadarConfigJson,
  SuggestRadarConfigInput,
  TechnologyAnalysisJson,
} from "./types";

function toRadarContext(radar: {
  id: string;
  name: string;
  description: string;
  businessDomain: string | null;
  focusQuestion: string | null;
  observationScope: string | null;
  targetAudience: string | null;
  decisionContext: string | null;
  scanIntensity: ScanIntensity;
}): RadarContextInput {
  return {
    id: radar.id,
    name: radar.name,
    description: radar.description,
    businessDomain: radar.businessDomain,
    focusQuestion: radar.focusQuestion,
    observationScope: radar.observationScope,
    targetAudience: radar.targetAudience,
    decisionContext: radar.decisionContext,
    scanIntensity: radar.scanIntensity,
  };
}

function normalizeRecommendationAction(
  value: unknown,
): RecommendationActionType {
  if (
    value === RecommendationActionType.WATCH ||
    value === RecommendationActionType.VALIDATE_BY_POC ||
    value === RecommendationActionType.ADOPT_INCREMENTALLY ||
    value === RecommendationActionType.REJECT_FOR_NOW ||
    value === RecommendationActionType.NEED_MORE_INFO
  ) {
    return value;
  }

  return RecommendationActionType.NEED_MORE_INFO;
}

function normalizePriority(value: unknown): PriorityLevel {
  if (
    value === PriorityLevel.LOW ||
    value === PriorityLevel.MEDIUM ||
    value === PriorityLevel.HIGH ||
    value === PriorityLevel.CRITICAL
  ) {
    return value;
  }

  return PriorityLevel.MEDIUM;
}

function normalizeScanIntensity(value: unknown): ScanIntensity {
  if (
    value === ScanIntensity.LOW ||
    value === ScanIntensity.MEDIUM ||
    value === ScanIntensity.HIGH
  ) {
    return value;
  }

  return ScanIntensity.MEDIUM;
}

function normalizeTechnologyAnalysisJson(
  data: TechnologyAnalysisJson,
): TechnologyAnalysisJson {
  return {
    title: clampText(data.title, "AI 技术分析"),
    analysisInputSummary: clampText(
      data.analysisInputSummary,
      "暂无输入摘要。",
    ),
    executiveSummary: clampText(data.executiveSummary, "暂无执行摘要。"),
    opportunity: clampText(data.opportunity, "暂无机会分析。"),
    risk: clampText(data.risk, "暂无风险分析。"),
    adoptionSignals: clampText(data.adoptionSignals, "暂无采用信号。"),
    uncertainties: clampText(data.uncertainties, "暂无不确定性说明。"),
    conclusion: clampText(data.conclusion, "暂无结论。"),

    sourceTrustScore: clampScore(data.sourceTrustScore),
    technicalValueScore: clampScore(data.technicalValueScore),
    engineeringReadinessScore: clampScore(data.engineeringReadinessScore),
    businessRelevanceScore: clampScore(data.businessRelevanceScore),
    adoptionRiskScore: clampScore(data.adoptionRiskScore),
    strategicValueScore: clampScore(data.strategicValueScore),
    communityHeatScore: clampScore(data.communityHeatScore),

    recommendation: {
      title: clampText(data.recommendation?.title, "AI 推荐动作"),
      actionType: normalizeRecommendationAction(data.recommendation?.actionType),
      summary: clampText(data.recommendation?.summary, "暂无推荐摘要。"),
      rationale: clampText(data.recommendation?.rationale, "暂无推荐理由。"),
      expectedOutcome: clampText(
        data.recommendation?.expectedOutcome,
        "暂无预期收益。",
      ),
      riskNote: clampText(data.recommendation?.riskNote, "暂无风险提示。"),
      priority: normalizePriority(data.recommendation?.priority),
    },

    metadata: {
      provider: data.metadata?.provider === "llm" ? "llm" : "mock",
      promptVersion:
        data.metadata?.promptVersion ?? AI_RADAR_PROMPT_VERSION,
      tera: {
        totalScore: clampScore(data.metadata?.tera?.totalScore),
        sourceTrustLevel:
          data.metadata?.tera?.sourceTrustLevel === "HIGH" ||
          data.metadata?.tera?.sourceTrustLevel === "MEDIUM" ||
          data.metadata?.tera?.sourceTrustLevel === "LOW"
            ? data.metadata.tera.sourceTrustLevel
            : "MEDIUM",
        businessMatchLevel:
          data.metadata?.tera?.businessMatchLevel === "HIGH" ||
          data.metadata?.tera?.businessMatchLevel === "MEDIUM" ||
          data.metadata?.tera?.businessMatchLevel === "LOW"
            ? data.metadata.tera.businessMatchLevel
            : "MEDIUM",
        engineeringDifficulty:
          data.metadata?.tera?.engineeringDifficulty === "HIGH" ||
          data.metadata?.tera?.engineeringDifficulty === "MEDIUM" ||
          data.metadata?.tera?.engineeringDifficulty === "LOW"
            ? data.metadata.tera.engineeringDifficulty
            : "MEDIUM",
        roiJudgement:
          data.metadata?.tera?.roiJudgement === "VALIDATE" ||
          data.metadata?.tera?.roiJudgement === "WATCH" ||
          data.metadata?.tera?.roiJudgement === "RESERVE" ||
          data.metadata?.tera?.roiJudgement === "REJECT"
            ? data.metadata.tera.roiJudgement
            : "WATCH",
      },
      notes: normalizeStringArray(data.metadata?.notes, []),
    },
  };
}

export async function analyzeTechnology(intelligenceItemId: string) {
  const item = await prisma.intelligenceItem.findUnique({
    where: { id: intelligenceItemId },
    include: {
      radar: true,
      owner: true,
    },
  });

  if (!item) {
    throw new Error(`IntelligenceItem not found: ${intelligenceItemId}`);
  }

  const input = {
    radar: toRadarContext(item.radar),
    item: {
      id: item.id,
      title: item.title,
      summary: item.summary,
      rawContent: item.rawContent,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      sourceAuthor: item.sourceAuthor,
      sourcePublishedAt: item.sourcePublishedAt,
      technologyName: item.technologyName,
      vendor: item.vendor,
      topic: item.topic,
    },
  };

  const aiResult = await requestAiJson<TechnologyAnalysisJson>({
    taskName: "analyzeTechnology",
    messages: buildAnalyzeTechnologyMessages(input),
    fallback: () => createMockTechnologyAnalysis(input),
    temperature: 0.2,
  });

  const analysisJson = normalizeTechnologyAnalysisJson({
    ...aiResult.data,
    metadata: {
      ...aiResult.data.metadata,
      provider: aiResult.usedFallback ? "mock" : "llm",
      notes: [
        ...(aiResult.data.metadata?.notes ?? []),
        ...(aiResult.errorMessage ? [aiResult.errorMessage] : []),
      ],
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const analysis = await tx.technologyAnalysis.create({
      data: {
        ownerId: item.ownerId,
        radarId: item.radarId,
        organizationId: item.organizationId,
        visibility: item.visibility,
        title: analysisJson.title,
        status: AnalysisStatus.GENERATED,
        analysisType: AnalysisType.AI_GENERATED,
        analysisInputSummary: analysisJson.analysisInputSummary,
        analysisPromptVersion: AI_RADAR_PROMPT_VERSION,
        executiveSummary: analysisJson.executiveSummary,
        opportunity: analysisJson.opportunity,
        risk: analysisJson.risk,
        adoptionSignals: analysisJson.adoptionSignals,
        uncertainties: analysisJson.uncertainties,
        conclusion: analysisJson.conclusion,
        sourceTrustScore: analysisJson.sourceTrustScore,
        technicalValueScore: analysisJson.technicalValueScore,
        engineeringReadinessScore: analysisJson.engineeringReadinessScore,
        businessRelevanceScore: analysisJson.businessRelevanceScore,
        adoptionRiskScore: analysisJson.adoptionRiskScore,
        strategicValueScore: analysisJson.strategicValueScore,
        communityHeatScore: analysisJson.communityHeatScore,
        metadata: analysisJson.metadata,
      },
    });

    await tx.analysisSourceRef.create({
      data: {
        analysisId: analysis.id,
        intelligenceItemId: item.id,
        relationType: AnalysisSourceRelationType.PRIMARY,
        weight: 100,
        note: "Primary source used by AI analysis.",
      },
    });

    const recommendation = await tx.recommendation.create({
      data: {
        ownerId: item.ownerId,
        radarId: item.radarId,
        analysisId: analysis.id,
        organizationId: item.organizationId,
        visibility: item.visibility,
        title: analysisJson.recommendation.title,
        actionType: analysisJson.recommendation.actionType,
        summary: analysisJson.recommendation.summary,
        rationale: analysisJson.recommendation.rationale,
        expectedOutcome: analysisJson.recommendation.expectedOutcome,
        riskNote: analysisJson.recommendation.riskNote,
        priority: analysisJson.recommendation.priority,
        metadata: {
          generatedBy: "analyzeTechnology",
          promptVersion: AI_RADAR_PROMPT_VERSION,
          sourceIntelligenceItemId: item.id,
        },
      },
    });

    await tx.intelligenceItem.update({
      where: { id: item.id },
      data: {
        lifecycleStatus: IntelligenceLifecycleStatus.ANALYZED,
      },
    });

    await tx.activityLog.create({
      data: {
        ownerId: item.ownerId,
        actorId: item.ownerId,
        radarId: item.radarId,
        organizationId: item.organizationId,
        visibility: item.visibility,
        entityType: ActivityEntityType.TECHNOLOGY_ANALYSIS,
        entityId: analysis.id,
        actionType: ActivityActionType.GENERATED,
        message: `已生成技术分析：${analysis.title}`,
        afterSnapshot: {
          analysisId: analysis.id,
          recommendationId: recommendation.id,
          intelligenceItemId: item.id,
        },
      },
    });

    return { analysis, recommendation };
  });

  return {
    ...result,
    usedFallback: aiResult.usedFallback,
    errorMessage: aiResult.errorMessage,
  };
}

export async function generateRadarSummary(radarId: string) {
  const radar = await prisma.radar.findUnique({
    where: { id: radarId },
    include: {
      technologyAnalyses: {
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          title: true,
          executiveSummary: true,
          conclusion: true,
          businessRelevanceScore: true,
          engineeringReadinessScore: true,
          adoptionRiskScore: true,
        },
      },
      recommendations: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          title: true,
          actionType: true,
          summary: true,
          priority: true,
        },
      },
    },
  });

  if (!radar) {
    throw new Error(`Radar not found: ${radarId}`);
  }

  const input = {
    radar: toRadarContext(radar),
    recentAnalyses: radar.technologyAnalyses,
    recentRecommendations: radar.recommendations,
  };

  const aiResult = await requestAiJson<RadarSummaryJson>({
    taskName: "generateRadarSummary",
    messages: buildRadarSummaryMessages(input),
    fallback: () => createMockRadarSummary(input),
    temperature: 0.2,
  });

  const summaryJson = {
    summary: clampText(aiResult.data.summary, "暂无 Radar Summary。"),
    decisionContext: clampText(
      aiResult.data.decisionContext,
      radar.decisionContext ?? "暂无决策上下文。",
    ),
    keyOpportunities: normalizeStringArray(aiResult.data.keyOpportunities, []),
    keyRisks: normalizeStringArray(aiResult.data.keyRisks, []),
    suggestedFocus: normalizeStringArray(aiResult.data.suggestedFocus, []),
    metadata: {
      provider: aiResult.usedFallback ? "mock" : "llm",
      promptVersion: AI_RADAR_PROMPT_VERSION,
      errorMessage: aiResult.errorMessage,
    },
  };

  const updatedRadar = await prisma.radar.update({
    where: { id: radar.id },
    data: {
      summary: summaryJson.summary,
      decisionContext: summaryJson.decisionContext,
      metadata: {
        radarSummary: summaryJson,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      ownerId: radar.ownerId,
      actorId: radar.ownerId,
      radarId: radar.id,
      organizationId: radar.organizationId,
      visibility: radar.visibility,
      entityType: ActivityEntityType.RADAR,
      entityId: radar.id,
      actionType: ActivityActionType.GENERATED,
      message: `已生成 Radar Summary：${radar.name}`,
      afterSnapshot: summaryJson,
    },
  });

  return {
    radar: updatedRadar,
    summary: summaryJson,
    usedFallback: aiResult.usedFallback,
    errorMessage: aiResult.errorMessage,
  };
}

export async function generateDailyReport(radarId: string, reportDate = new Date()) {
  const start = new Date(reportDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const radar = await prisma.radar.findUnique({
    where: { id: radarId },
  });

  if (!radar) {
    throw new Error(`Radar not found: ${radarId}`);
  }

  const [intelligenceItems, analyses, recommendations, activePocCount] =
    await Promise.all([
      prisma.intelligenceItem.findMany({
        where: {
          radarId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.technologyAnalysis.findMany({
        where: {
          radarId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.recommendation.findMany({
        where: {
          radarId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.poC.count({
        where: {
          radarId,
          status: "IN_PROGRESS",
        },
      }),
    ]);

  const input = {
    radar: toRadarContext(radar),
    reportDate: start,
  };

  const reportData = {
    radar: input.radar,
    reportDate: start.toISOString().slice(0, 10),
    intelligenceItems,
    analyses,
    recommendations,
    activePocCount,
  };

  const aiResult = await requestAiJson<DailyReportJson>({
    taskName: "generateDailyReport",
    messages: buildDailyReportMessages(input, reportData),
    fallback: () => createMockDailyReport(start),
    temperature: 0.2,
  });

  const reportJson = {
    title: clampText(
      aiResult.data.title,
      `AI Radar 日报 - ${start.toISOString().slice(0, 10)}`,
    ),
    summary: clampText(aiResult.data.summary, "暂无日报摘要。"),
    highlights: clampText(aiResult.data.highlights, "暂无重点情报。"),
    decisions: clampText(aiResult.data.decisions, "暂无决策建议。"),
    risks: clampText(aiResult.data.risks, "暂无风险提示。"),
    nextActions: clampText(aiResult.data.nextActions, "暂无下一步动作。"),
    metadata: {
      provider: aiResult.usedFallback ? "mock" : "llm",
      promptVersion: AI_RADAR_PROMPT_VERSION,
      includedItemCount:
        intelligenceItems.length + analyses.length + recommendations.length,
      errorMessage: aiResult.errorMessage,
    },
  };

  const dailyReport = await prisma.dailyReport.upsert({
    where: {
      radarId_reportDate: {
        radarId,
        reportDate: start,
      },
    },
    create: {
      ownerId: radar.ownerId,
      radarId,
      organizationId: radar.organizationId,
      visibility: radar.visibility,
      reportDate: start,
      title: reportJson.title,
      status: DailyReportStatus.DRAFT,
      summary: reportJson.summary,
      highlights: reportJson.highlights,
      decisions: reportJson.decisions,
      risks: reportJson.risks,
      nextActions: reportJson.nextActions,
      newIntelligenceCount: intelligenceItems.length,
      newAnalysisCount: analyses.length,
      newRecommendationCount: recommendations.length,
      activePocCount,
      metadata: reportJson.metadata,
    },
    update: {
      title: reportJson.title,
      summary: reportJson.summary,
      highlights: reportJson.highlights,
      decisions: reportJson.decisions,
      risks: reportJson.risks,
      nextActions: reportJson.nextActions,
      newIntelligenceCount: intelligenceItems.length,
      newAnalysisCount: analyses.length,
      newRecommendationCount: recommendations.length,
      activePocCount,
      metadata: reportJson.metadata,
    },
  });

  await prisma.activityLog.create({
    data: {
      ownerId: radar.ownerId,
      actorId: radar.ownerId,
      radarId: radar.id,
      organizationId: radar.organizationId,
      visibility: radar.visibility,
      entityType: ActivityEntityType.DAILY_REPORT,
      entityId: dailyReport.id,
      actionType: ActivityActionType.GENERATED,
      message: `已生成日报：${dailyReport.title}`,
      afterSnapshot: {
        dailyReportId: dailyReport.id,
        reportDate: start.toISOString(),
      },
    },
  });

  return {
    dailyReport,
    usedFallback: aiResult.usedFallback,
    errorMessage: aiResult.errorMessage,
  };
}

export async function suggestRadarConfig(input: SuggestRadarConfigInput) {
  const aiResult = await requestAiJson<SuggestedRadarConfigJson>({
    taskName: "suggestRadarConfig",
    messages: buildSuggestRadarConfigMessages(input),
    fallback: () => createMockSuggestedRadarConfig(input),
    temperature: 0.3,
  });

  const data = aiResult.data;

  return {
    name: clampText(data.name, "AI 技术雷达"),
    description: clampText(data.description, "用于跟踪 AI 技术动态。"),
    businessDomain: clampText(data.businessDomain, "AI 应用开发"),
    focusQuestion: clampText(
      data.focusQuestion,
      "哪些技术真正值得投入资源？",
    ),
    observationScope: clampText(
      data.observationScope,
      "关注模型、工具、框架、工程化和应用落地相关技术。",
    ),
    targetAudience: clampText(
      data.targetAudience,
      "AI 产品经理、技术负责人、AI 工程师",
    ),
    decisionContext: clampText(
      data.decisionContext,
      "优先关注业务匹配度高、工程接入可控、可通过 PoC 快速验证的技术。",
    ),
    scanIntensity: normalizeScanIntensity(data.scanIntensity),
    keywords: normalizeStringArray(data.keywords, ["AI", "LLM", "Agent"]),
    excludedTopics: normalizeStringArray(data.excludedTopics, []),
    metadata: {
      provider: aiResult.usedFallback ? "mock" : "llm",
      promptVersion: AI_RADAR_PROMPT_VERSION,
      reason: data.metadata?.reason ?? "AI suggested radar config.",
      errorMessage: aiResult.errorMessage,
    },
  };
}