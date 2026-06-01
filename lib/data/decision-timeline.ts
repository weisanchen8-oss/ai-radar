/**
 * 文件作用：
 * 封装 DecisionTimeline 写入逻辑。
 *
 * 当前阶段边界：
 * - 只记录 Recommendation / PoC 相关决策流转
 * - 不负责 UI 展示
 * - 不修改 PoC 页面结构
 */

import type { Prisma, RecommendationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DecisionTimelineEventType =
  | "RECOMMENDATION_OPENED"
  | "RECOMMENDATION_ACCEPTED"
  | "RECOMMENDATION_REJECTED"
  | "RECOMMENDATION_POC_CREATED"
  | "RECOMMENDATION_DONE"
  | "POC_STARTED"
  | "POC_DONE"
  | "NOTE";

type CreateDecisionTimelineInput = {
  ownerId?: string | null;
  radarId: string;
  recommendationId?: string | null;
  eventType: DecisionTimelineEventType;
  title: string;
  description?: string | null;
  fromStatus?: RecommendationStatus | null;
  toStatus?: RecommendationStatus | null;
  metadata?: Prisma.InputJsonValue;
};

export async function createDecisionTimelineEvent(
  input: CreateDecisionTimelineInput,
) {
  const data = {
    ownerId: input.ownerId ?? null,
    radarId: input.radarId,
    recommendationId: input.recommendationId ?? null,
    eventType: input.eventType,
    title: input.title,
    description: input.description ?? null,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    metadata: input.metadata,
  } as unknown as Prisma.DecisionTimelineUncheckedCreateInput;

  return prisma.decisionTimeline.create({
    data,
  });
}