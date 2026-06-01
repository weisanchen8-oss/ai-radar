"use server";

import {
  ActivityActionType,
  ActivityEntityType,
  RecommendationStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createDecisionTimelineEvent } from "@/lib/data/decision-timeline";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${key}`);
  }

  return value.trim();
}

function getRecommendationActionMessage(status: RecommendationStatus) {
  switch (status) {
    case RecommendationStatus.ACCEPTED:
      return "已接受 Recommendation，下一步可以创建 PoC 进行快速验证。";
    case RecommendationStatus.REJECTED:
      return "已拒绝 Recommendation，系统已记录本次决策。";
    case RecommendationStatus.DONE:
      return "已完成 Recommendation，系统已记录本次决策闭环。";
    default:
      return "Recommendation 状态已更新。";
  }
}

function getDecisionTimelineEventType(status: RecommendationStatus) {
  switch (status) {
    case RecommendationStatus.ACCEPTED:
      return "RECOMMENDATION_ACCEPTED";
    case RecommendationStatus.REJECTED:
      return "RECOMMENDATION_REJECTED";
    case RecommendationStatus.DONE:
      return "RECOMMENDATION_DONE";
    default:
      return "NOTE";
  }
}

function getRedirectAction(status: RecommendationStatus) {
  switch (status) {
    case RecommendationStatus.ACCEPTED:
      return "recommendation-accepted";
    case RecommendationStatus.REJECTED:
      return "recommendation-rejected";
    case RecommendationStatus.DONE:
      return "recommendation-done";
    default:
      return "recommendation-updated";
  }
}

async function updateRecommendationStatusAction(
  formData: FormData,
  nextStatus: RecommendationStatus,
) {
  const radarId = getRequiredString(formData, "radarId");
  const recommendationId = getRequiredString(formData, "itemId");

  const recommendation = await prisma.recommendation.findFirst({
    where: {
      id: recommendationId,
      radarId,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      organizationId: true,
      visibility: true,
      title: true,
      status: true,
      summary: true,
      actionType: true,
      priority: true,
    },
  });

  if (!recommendation) {
    throw new Error("Recommendation not found.");
  }

  if (recommendation.status === nextStatus) {
    redirect(`/radars/${radarId}/workspace?action=${getRedirectAction(nextStatus)}`);
  }

  if (
    nextStatus === RecommendationStatus.ACCEPTED &&
    recommendation.status !== RecommendationStatus.OPEN
  ) {
    throw new Error("Only OPEN recommendations can be accepted.");
  }

  if (
    nextStatus === RecommendationStatus.REJECTED &&
    recommendation.status !== RecommendationStatus.OPEN
  ) {
    throw new Error("Only OPEN recommendations can be rejected.");
  }

  if (
    nextStatus === RecommendationStatus.DONE &&
    recommendation.status !== RecommendationStatus.ACCEPTED
  ) {
    throw new Error("Only ACCEPTED recommendations can be marked as done.");
  }

  const updatedRecommendation = await prisma.recommendation.update({
    where: {
      id: recommendation.id,
    },
    data: {
      status: nextStatus,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      organizationId: true,
      visibility: true,
      title: true,
      status: true,
      summary: true,
      actionType: true,
      priority: true,
      updatedAt: true,
    },
  });

  const message = getRecommendationActionMessage(nextStatus);

  await prisma.activityLog.create({
    data: {
      ownerId: recommendation.ownerId,
      actorId: recommendation.ownerId,
      radarId: recommendation.radarId,
      organizationId: recommendation.organizationId,
      visibility: recommendation.visibility,
      entityType: ActivityEntityType.RECOMMENDATION,
      entityId: recommendation.id,
      actionType: ActivityActionType.STATUS_CHANGED,
      beforeSnapshot: {
        id: recommendation.id,
        status: recommendation.status,
        title: recommendation.title,
      },
      afterSnapshot: {
        id: updatedRecommendation.id,
        status: updatedRecommendation.status,
        title: updatedRecommendation.title,
      },
      message,
      metadata: {
        fromStatus: recommendation.status,
        toStatus: updatedRecommendation.status,
        actionType: recommendation.actionType,
        priority: recommendation.priority,
      },
    },
  });

  await createDecisionTimelineEvent({
    ownerId: recommendation.ownerId,
    radarId: recommendation.radarId,
    recommendationId: recommendation.id,
    eventType: getDecisionTimelineEventType(nextStatus),
    title: `Recommendation：${updatedRecommendation.title}`,
    description: message,
    fromStatus: recommendation.status,
    toStatus: updatedRecommendation.status,
    metadata: {
      summary: recommendation.summary,
      actionType: recommendation.actionType,
      priority: recommendation.priority,
    },
  });

  revalidatePath(`/radars/${radarId}/workspace`);
  revalidatePath(`/dashboard`);

  redirect(`/radars/${radarId}/workspace?action=${getRedirectAction(nextStatus)}`);
}

export async function acceptRecommendationAction(formData: FormData) {
  await updateRecommendationStatusAction(formData, RecommendationStatus.ACCEPTED);
}

export async function rejectRecommendationAction(formData: FormData) {
  await updateRecommendationStatusAction(formData, RecommendationStatus.REJECTED);
}

export async function completeRecommendationAction(formData: FormData) {
  await updateRecommendationStatusAction(formData, RecommendationStatus.DONE);
}