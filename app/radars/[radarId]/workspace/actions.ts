/**
 * 文件作用：
 * 定义 Radar Workspace 中技术情报卡片的 Quick Actions。
 *
 * 当前阶段边界：
 * - 不接入真实 AI
 * - 不修改 schema
 * - 不修改 seed
 * - 不处理前端按钮接入
 *
 * 实现内容：
 * - 加入观察：更新 IntelligenceItem.lifecycleStatus 为 TRACKING
 * - 创建 PoC：基于 IntelligenceItem 找到或创建 TechnologyAnalysis / Recommendation，再真实创建 PoC
 * - 收藏：写入 ActivityLog
 * - 标记不相关：写入 ActivityLog
 */

"use server";

import {
  ActivityActionType,
  ActivityEntityType,
  AnalysisSourceRelationType,
  AnalysisStatus,
  AnalysisType,
  IntelligenceLifecycleStatus,
  Prisma,
  PriorityLevel,
  RecommendationActionType,
  RecommendationStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`Missing required field: ${key}`);
  }

  return value;
}

function getWorkspacePath(radarId: string, action?: string) {
  const basePath = `/radars/${radarId}/workspace`;

  if (!action) {
    return basePath;
  }

  return `${basePath}?action=${action}`;
}

async function getIntelligenceItemForAction(radarId: string, itemId: string) {
  const intelligenceItem = await prisma.intelligenceItem.findFirst({
    where: {
      id: itemId,
      radarId,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      organizationId: true,
      visibility: true,
      title: true,
      summary: true,
      sourceName: true,
      sourceUrl: true,
      technologyName: true,
      lifecycleStatus: true,
    },
  });

  if (!intelligenceItem) {
    throw new Error("Intelligence item not found.");
  }

  return intelligenceItem;
}

async function writeActivityLog(input: {
  ownerId: string;
  actorId: string;
  radarId: string;
  entityType: ActivityEntityType;
  entityId: string;
  actionType: ActivityActionType;
  message: string;
  beforeSnapshot?: Prisma.InputJsonValue;
  afterSnapshot?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      ownerId: input.ownerId,
      actorId: input.actorId,
      radarId: input.radarId,
      entityType: input.entityType,
      entityId: input.entityId,
      actionType: input.actionType,
      beforeSnapshot: input.beforeSnapshot,
      afterSnapshot: input.afterSnapshot,
      message: input.message,
      metadata: input.metadata,
    },
  });
}

async function getOrCreateAnalysisAndRecommendation(input: {
  radarId: string;
  itemId: string;
}) {
  const intelligenceItem = await getIntelligenceItemForAction(
    input.radarId,
    input.itemId,
  );

  const existingSourceRef = await prisma.analysisSourceRef.findFirst({
    where: {
      intelligenceItemId: intelligenceItem.id,
      analysis: {
        radarId: input.radarId,
      },
    },
    include: {
      analysis: {
        include: {
          recommendations: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  let analysisId = existingSourceRef?.analysis.id ?? null;

  if (!analysisId) {
    const createdAnalysis = await prisma.technologyAnalysis.create({
      data: {
        ownerId: intelligenceItem.ownerId,
        radarId: intelligenceItem.radarId,
        organizationId: intelligenceItem.organizationId,
        visibility: intelligenceItem.visibility,
        title: `技术分析：${
          intelligenceItem.technologyName || intelligenceItem.title
        }`,
        status: AnalysisStatus.REVIEWED,
        analysisType: AnalysisType.HYBRID,
        analysisInputSummary:
          intelligenceItem.summary || "基于技术情报创建的最小分析记录。",
        executiveSummary:
          intelligenceItem.summary ||
          "该技术情报已进入 Radar Workspace 的人工验证流程。",
        opportunity:
          "可作为当前业务场景下的候选技术，后续通过 PoC 验证实际收益。",
        risk: "当前结论来自 Workspace 快捷操作，仍需要通过实际验证补充证据。",
        adoptionSignals: "用户已从技术情报流触发验证动作。",
        uncertainties: "尚未完成真实工程接入、成本评估和效果指标验证。",
        conclusion: "建议先创建小范围 PoC，验证业务匹配度与工程可行性。",
        sourceTrustScore: 3,
        technicalValueScore: 3,
        engineeringReadinessScore: 3,
        businessRelevanceScore: 4,
        adoptionRiskScore: 3,
        strategicValueScore: 3,
        communityHeatScore: 3,
        metadata: {
          createdByQuickAction: true,
          sourceIntelligenceItemId: intelligenceItem.id,
        },
      },
    });

    analysisId = createdAnalysis.id;

    await prisma.analysisSourceRef.create({
      data: {
        analysisId: createdAnalysis.id,
        intelligenceItemId: intelligenceItem.id,
        relationType: AnalysisSourceRelationType.PRIMARY,
        weight: 100,
        note: "由 Workspace Quick Action 自动建立的来源关联。",
        metadata: {
          createdByQuickAction: true,
        },
      },
    });
  }

  const existingRecommendation =
    existingSourceRef?.analysis.recommendations.find(
      (recommendation) =>
        recommendation.actionType === RecommendationActionType.VALIDATE_BY_POC,
    ) ?? existingSourceRef?.analysis.recommendations[0];

  if (existingRecommendation) {
    return {
      intelligenceItem,
      recommendation: existingRecommendation,
    };
  }

  const recommendation = await prisma.recommendation.create({
    data: {
      ownerId: intelligenceItem.ownerId,
      radarId: intelligenceItem.radarId,
      analysisId,
      organizationId: intelligenceItem.organizationId,
      visibility: intelligenceItem.visibility,
      title: `建议验证：${
        intelligenceItem.technologyName || intelligenceItem.title
      }`,
      actionType: RecommendationActionType.VALIDATE_BY_POC,
      status: RecommendationStatus.OPEN,
      summary: "由技术情报卡片触发的 PoC 验证建议。",
      rationale:
        "该技术与当前 Radar 关注方向存在潜在关联，建议通过小范围实验验证业务收益、工程接入难度和采用风险。",
      expectedOutcome:
        "形成是否继续投入、持续观察或暂不采用的初步判断。",
      riskNote:
        "当前建议基于已有 seed 数据和人工触发动作生成，仍需实际验证数据支撑。",
      priority: PriorityLevel.MEDIUM,
      metadata: {
        createdByQuickAction: true,
        sourceIntelligenceItemId: intelligenceItem.id,
      },
    },
  });

  return {
    intelligenceItem,
    recommendation,
  };
}

export async function createPocFromIntelligenceAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const itemId = getRequiredString(formData, "itemId");

  const { intelligenceItem, recommendation } =
    await getOrCreateAnalysisAndRecommendation({
      radarId,
      itemId,
    });

  const poc = await prisma.poC.create({
    data: {
      ownerId: intelligenceItem.ownerId,
      radarId: intelligenceItem.radarId,
      recommendationId: recommendation.id,
      organizationId: intelligenceItem.organizationId,
      visibility: intelligenceItem.visibility,
      title: `PoC：${intelligenceItem.technologyName || intelligenceItem.title}`,
      objective: `验证「${
        intelligenceItem.technologyName || intelligenceItem.title
      }」是否适合当前 Radar 业务场景。`,
      hypothesis:
        "如果该技术具备足够的业务匹配度和工程可行性，则应能在小范围验证中体现明确收益。",
      successCriteria:
        "完成最小 Demo 或验证脚本，并记录效果、成本、接入难度与主要风险。",
      plan:
        "1. 明确验证场景；2. 准备最小数据和测试用例；3. 完成最小接入；4. 记录指标和结论。",
      risks:
        "当前 PoC 由 Workspace 快捷动作创建，验证指标仍需人工补充。",
      metadata: {
        createdByQuickAction: true,
        sourceIntelligenceItemId: intelligenceItem.id,
        sourceName: intelligenceItem.sourceName,
        sourceUrl: intelligenceItem.sourceUrl,
      },
    },
  });

  await writeActivityLog({
    ownerId: intelligenceItem.ownerId,
    actorId: intelligenceItem.ownerId,
    radarId: intelligenceItem.radarId,
    entityType: ActivityEntityType.POC,
    entityId: poc.id,
    actionType: ActivityActionType.CREATED,
    message: `从技术情报「${intelligenceItem.title}」创建了 PoC「${poc.title}」。`,
    afterSnapshot: {
      pocId: poc.id,
      title: poc.title,
      sourceIntelligenceItemId: intelligenceItem.id,
    },
  });

  revalidatePath(`/radars/${radarId}/workspace`);
  redirect(getWorkspacePath(radarId, "poc-created"));
}

export async function observeIntelligenceAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const itemId = getRequiredString(formData, "itemId");

  const intelligenceItem = await getIntelligenceItemForAction(radarId, itemId);

  const updatedItem = await prisma.intelligenceItem.update({
    where: {
      id: intelligenceItem.id,
    },
    data: {
      lifecycleStatus: IntelligenceLifecycleStatus.TRACKING,
    },
    select: {
      id: true,
      lifecycleStatus: true,
    },
  });

  await writeActivityLog({
    ownerId: intelligenceItem.ownerId,
    actorId: intelligenceItem.ownerId,
    radarId: intelligenceItem.radarId,
    entityType: ActivityEntityType.INTELLIGENCE_ITEM,
    entityId: intelligenceItem.id,
    actionType: ActivityActionType.STATUS_CHANGED,
    message: `已将技术情报「${intelligenceItem.title}」加入观察。`,
    beforeSnapshot: {
      lifecycleStatus: intelligenceItem.lifecycleStatus,
    },
    afterSnapshot: {
      lifecycleStatus: updatedItem.lifecycleStatus,
    },
  });

  revalidatePath(`/radars/${radarId}/workspace`);
  redirect(getWorkspacePath(radarId, "observed"));
}

export async function favoriteIntelligenceAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const itemId = getRequiredString(formData, "itemId");

  const intelligenceItem = await getIntelligenceItemForAction(radarId, itemId);

  await writeActivityLog({
    ownerId: intelligenceItem.ownerId,
    actorId: intelligenceItem.ownerId,
    radarId: intelligenceItem.radarId,
    entityType: ActivityEntityType.INTELLIGENCE_ITEM,
    entityId: intelligenceItem.id,
    actionType: ActivityActionType.UPDATED,
    message: `已收藏技术情报「${intelligenceItem.title}」。`,
    metadata: {
      quickAction: "favorite",
      sourceIntelligenceItemId: intelligenceItem.id,
    },
  });

  revalidatePath(`/radars/${radarId}/workspace`);
  redirect(getWorkspacePath(radarId, "favorited"));
}

export async function markIntelligenceIrrelevantAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const itemId = getRequiredString(formData, "itemId");

  const intelligenceItem = await getIntelligenceItemForAction(radarId, itemId);

  await writeActivityLog({
    ownerId: intelligenceItem.ownerId,
    actorId: intelligenceItem.ownerId,
    radarId: intelligenceItem.radarId,
    entityType: ActivityEntityType.INTELLIGENCE_ITEM,
    entityId: intelligenceItem.id,
    actionType: ActivityActionType.UPDATED,
    message: `已标记技术情报「${intelligenceItem.title}」为不相关。`,
    metadata: {
      quickAction: "mark_irrelevant",
      sourceIntelligenceItemId: intelligenceItem.id,
    },
  });

  revalidatePath(`/radars/${radarId}/workspace`);
  redirect(getWorkspacePath(radarId, "marked-irrelevant"));
}