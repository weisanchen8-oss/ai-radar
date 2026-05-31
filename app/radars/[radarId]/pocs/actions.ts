"use server";

import {
  ActivityActionType,
  ActivityEntityType,
  PocOutcome,
  PocStatus,
  Prisma,
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

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function parseOptionalDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function parseOptionalDecimal(value: string | null) {
  if (!value) {
    return null;
  }

  return new Prisma.Decimal(value);
}

function isPocStatus(value: string): value is PocStatus {
  return Object.values(PocStatus).includes(value as PocStatus);
}

function isPocOutcome(value: string): value is PocOutcome {
  return Object.values(PocOutcome).includes(value as PocOutcome);
}

function getPocListPath(radarId: string, action?: string) {
  const basePath = `/radars/${radarId}/pocs`;
  return action ? `${basePath}?action=${action}` : basePath;
}

function getPocDetailPath(radarId: string, pocId: string, action?: string) {
  const basePath = `/radars/${radarId}/pocs/${pocId}`;
  return action ? `${basePath}?action=${action}` : basePath;
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

export async function createPocAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const recommendationId = getRequiredString(formData, "recommendationId");

  const title = getRequiredString(formData, "title");
  const objective = getRequiredString(formData, "objective");
  const hypothesis = getRequiredString(formData, "hypothesis");
  const successCriteria = getRequiredString(formData, "successCriteria");

  const plan = getOptionalString(formData, "plan");
  const risks = getOptionalString(formData, "risks");
  const repoUrl = getOptionalString(formData, "repoUrl");
  const demoUrl = getOptionalString(formData, "demoUrl");
  const artifactUrl = getOptionalString(formData, "artifactUrl");
  const startDate = parseOptionalDate(getOptionalString(formData, "startDate"));
  const endDate = parseOptionalDate(getOptionalString(formData, "endDate"));
  const timeSpentHours = parseOptionalDecimal(
    getOptionalString(formData, "timeSpentHours"),
  );

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
    },
  });

  if (!recommendation) {
    throw new Error("Recommendation not found.");
  }

  const poc = await prisma.poC.create({
    data: {
      ownerId: recommendation.ownerId,
      radarId: recommendation.radarId,
      recommendationId: recommendation.id,
      organizationId: recommendation.organizationId,
      visibility: recommendation.visibility,
      title,
      objective,
      hypothesis,
      successCriteria,
      plan,
      risks,
      repoUrl,
      demoUrl,
      artifactUrl,
      startDate,
      endDate,
      timeSpentHours,
    },
  });

  if (recommendation.status === RecommendationStatus.OPEN) {
    await prisma.recommendation.update({
      where: { id: recommendation.id },
      data: { status: RecommendationStatus.ACCEPTED },
    });
  }

  await writeActivityLog({
    ownerId: recommendation.ownerId,
    actorId: recommendation.ownerId,
    radarId: recommendation.radarId,
    entityType: ActivityEntityType.POC,
    entityId: poc.id,
    actionType: ActivityActionType.CREATED,
    message: `基于推荐「${recommendation.title}」创建了 PoC「${poc.title}」。`,
    afterSnapshot: {
      pocId: poc.id,
      title: poc.title,
      recommendationId: recommendation.id,
    },
  });

  revalidatePath(`/radars/${radarId}/pocs`);
  revalidatePath(`/radars/${radarId}/workspace`);
  redirect(getPocDetailPath(radarId, poc.id, "created"));
}

export async function createPocFromRecommendationAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const recommendationId = getRequiredString(formData, "recommendationId");

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
      summary: true,
      rationale: true,
      expectedOutcome: true,
      riskNote: true,
      status: true,
    },
  });

  if (!recommendation) {
    throw new Error("Recommendation not found.");
  }

  const poc = await prisma.poC.create({
    data: {
      ownerId: recommendation.ownerId,
      radarId: recommendation.radarId,
      recommendationId: recommendation.id,
      organizationId: recommendation.organizationId,
      visibility: recommendation.visibility,
      title: `PoC：${recommendation.title}`,
      objective:
        recommendation.summary ||
        `验证推荐「${recommendation.title}」是否值得在当前 Radar 场景中继续投入。`,
      hypothesis:
        recommendation.rationale ||
        "如果该推荐具备真实业务价值和工程可行性，则应能在小范围验证中得到初步证据。",
      successCriteria:
        recommendation.expectedOutcome ||
        "完成最小验证记录，明确实际收益、接入难度、主要风险和后续动作。",
      plan:
        "1. 明确验证场景；\n2. 准备最小测试数据；\n3. 记录验证过程；\n4. 总结是否继续投入。",
      risks:
        recommendation.riskNote ||
        "当前 PoC 为记录型验证，不包含自动实验，需要人工补充验证证据。",
      metadata: {
        createdFromRecommendationList: true,
      },
    },
  });

  if (recommendation.status === RecommendationStatus.OPEN) {
    await prisma.recommendation.update({
      where: { id: recommendation.id },
      data: { status: RecommendationStatus.ACCEPTED },
    });
  }

  await writeActivityLog({
    ownerId: recommendation.ownerId,
    actorId: recommendation.ownerId,
    radarId: recommendation.radarId,
    entityType: ActivityEntityType.POC,
    entityId: poc.id,
    actionType: ActivityActionType.CREATED,
    message: `从推荐「${recommendation.title}」快速创建了 PoC「${poc.title}」。`,
    afterSnapshot: {
      pocId: poc.id,
      recommendationId: recommendation.id,
      title: poc.title,
    },
  });

  revalidatePath(`/radars/${radarId}/pocs`);
  revalidatePath(`/radars/${radarId}/workspace`);
  redirect(getPocDetailPath(radarId, poc.id, "created-from-recommendation"));
}

export async function updatePocAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const pocId = getRequiredString(formData, "pocId");

  const statusRaw = getRequiredString(formData, "status");

  if (!isPocStatus(statusRaw)) {
    throw new Error("Invalid PoC status.");
  }

  const status: PocStatus = statusRaw as PocStatus;

  const outcomeRaw = getOptionalString(formData, "outcome");

  if (outcomeRaw && !isPocOutcome(outcomeRaw)) {
    throw new Error("Invalid PoC outcome.");
  }

  const outcome: PocOutcome | null = outcomeRaw
    ? (outcomeRaw as PocOutcome)
    : null;

  const existingPoc = await prisma.poC.findFirst({
    where: {
      id: pocId,
      radarId,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      recommendationId: true,
      title: true,
      status: true,
      outcome: true,
      findings: true,
      risks: true,
      recommendationBack: true,
      repoUrl: true,
      demoUrl: true,
      artifactUrl: true,
      startDate: true,
      endDate: true,
      timeSpentHours: true,
      recommendation: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!existingPoc) {
    throw new Error("PoC not found.");
  }

  const findings = getOptionalString(formData, "findings");
  const risks = getOptionalString(formData, "risks");
  const recommendationBack = getOptionalString(formData, "recommendationBack");
  const repoUrl = getOptionalString(formData, "repoUrl");
  const demoUrl = getOptionalString(formData, "demoUrl");
  const artifactUrl = getOptionalString(formData, "artifactUrl");
  const startDate = parseOptionalDate(getOptionalString(formData, "startDate"));
  const endDate = parseOptionalDate(getOptionalString(formData, "endDate"));
  const timeSpentHours = parseOptionalDecimal(
    getOptionalString(formData, "timeSpentHours"),
  );

  const result = await prisma.$transaction(async (tx) => {
    const updatedPoc = await tx.poC.update({
      where: { id: existingPoc.id },
      data: {
        status,
        outcome,
        findings,
        risks,
        recommendationBack,
        repoUrl,
        demoUrl,
        artifactUrl,
        startDate,
        endDate,
        timeSpentHours,
      },
      select: {
        id: true,
        title: true,
        status: true,
        outcome: true,
        findings: true,
        risks: true,
        recommendationBack: true,
        repoUrl: true,
        demoUrl: true,
        artifactUrl: true,
        startDate: true,
        endDate: true,
        timeSpentHours: true,
      },
    });

    let updatedRecommendation: {
      id: string;
      title: string;
      status: RecommendationStatus;
    } | null = null;

    if (
      status === PocStatus.DONE &&
      existingPoc.recommendation.status !== RecommendationStatus.DONE
    ) {
      updatedRecommendation = await tx.recommendation.update({
        where: { id: existingPoc.recommendationId },
        data: {
          status: RecommendationStatus.DONE,
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        ownerId: existingPoc.ownerId,
        actorId: existingPoc.ownerId,
        radarId: existingPoc.radarId,
        entityType: ActivityEntityType.POC,
        entityId: existingPoc.id,
        actionType: ActivityActionType.STATUS_CHANGED,
        message:
          status === PocStatus.DONE
            ? `完成了 PoC「${existingPoc.title}」，并回写 Recommendation「${existingPoc.recommendation.title}」状态。`
            : `更新了 PoC「${existingPoc.title}」的验证记录。`,
        beforeSnapshot: {
          status: existingPoc.status,
          outcome: existingPoc.outcome,
          findings: existingPoc.findings,
          risks: existingPoc.risks,
          recommendationBack: existingPoc.recommendationBack,
          recommendationStatus: existingPoc.recommendation.status,
        },
        afterSnapshot: {
          status: updatedPoc.status,
          outcome: updatedPoc.outcome,
          findings: updatedPoc.findings,
          risks: updatedPoc.risks,
          recommendationBack: updatedPoc.recommendationBack,
          recommendationStatus:
            updatedRecommendation?.status ?? existingPoc.recommendation.status,
        },
        metadata: {
          recommendationId: existingPoc.recommendationId,
          recommendationUpdated: Boolean(updatedRecommendation),
        },
      },
    });

    return {
      updatedPoc,
      updatedRecommendation,
    };
  });

  revalidatePath(`/radars/${radarId}/pocs`);
  revalidatePath(`/radars/${radarId}/pocs/${pocId}`);
  revalidatePath(`/radars/${radarId}/workspace`);

  if (result.updatedRecommendation) {
    redirect(getPocDetailPath(radarId, pocId, "poc-done-recommendation-updated"));
  }

  redirect(getPocDetailPath(radarId, pocId, "updated"));
}