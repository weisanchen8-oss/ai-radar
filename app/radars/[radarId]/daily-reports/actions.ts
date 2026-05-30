"use server";

import {
  ActivityActionType,
  ActivityEntityType,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildDailyReportContent,
  normalizeReportDate,
} from "@/lib/data/radar-daily-reports";
import { prisma } from "@/lib/prisma";

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`Missing required field: ${key}`);
  }

  return value;
}

function getReportListPath(radarId: string, action?: string) {
  const basePath = `/radars/${radarId}/daily-reports`;
  return action ? `${basePath}?action=${action}` : basePath;
}

function getReportDetailPath(radarId: string, reportId: string, action?: string) {
  const basePath = `/radars/${radarId}/daily-reports/${reportId}`;
  return action ? `${basePath}?action=${action}` : basePath;
}

async function writeActivityLog(input: {
  ownerId: string;
  actorId: string;
  radarId: string;
  entityId: string;
  message: string;
  afterSnapshot?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      ownerId: input.ownerId,
      actorId: input.actorId,
      radarId: input.radarId,
      entityType: ActivityEntityType.DAILY_REPORT,
      entityId: input.entityId,
      actionType: ActivityActionType.GENERATED,
      message: input.message,
      afterSnapshot: input.afterSnapshot,
    },
  });
}

export async function generateDailyReportAction(formData: FormData) {
  const radarId = getRequiredString(formData, "radarId");
  const reportDateInput = getRequiredString(formData, "reportDate");
  const reportDate = normalizeReportDate(reportDateInput);

  const content = await buildDailyReportContent({
    radarId,
    reportDate,
  });

  if (!content) {
    redirect(getReportListPath(radarId, "radar-not-found"));
  }

  const report = await prisma.dailyReport.upsert({
    where: {
      radarId_reportDate: {
        radarId,
        reportDate,
      },
    },
    create: {
      ownerId: content.radar.ownerId,
      radarId: content.radar.id,
      organizationId: content.radar.organizationId,
      visibility: content.radar.visibility,
      reportDate,
      title: content.title,
      summary: content.summary,
      highlights: content.highlights,
      decisions: content.decisions,
      risks: content.risks,
      nextActions: content.nextActions,
      newIntelligenceCount: content.counts.newIntelligenceCount,
      newAnalysisCount: content.counts.newAnalysisCount,
      newRecommendationCount: content.counts.newRecommendationCount,
      activePocCount: content.counts.activePocCount,
      metadata: content.metadata,
    },
    update: {
      title: content.title,
      summary: content.summary,
      highlights: content.highlights,
      decisions: content.decisions,
      risks: content.risks,
      nextActions: content.nextActions,
      newIntelligenceCount: content.counts.newIntelligenceCount,
      newAnalysisCount: content.counts.newAnalysisCount,
      newRecommendationCount: content.counts.newRecommendationCount,
      activePocCount: content.counts.activePocCount,
      metadata: content.metadata,
    },
    select: {
      id: true,
      title: true,
      ownerId: true,
      radarId: true,
      reportDate: true,
      newIntelligenceCount: true,
      newAnalysisCount: true,
      newRecommendationCount: true,
      activePocCount: true,
    },
  });

  await writeActivityLog({
    ownerId: report.ownerId,
    actorId: report.ownerId,
    radarId: report.radarId,
    entityId: report.id,
    message: `手动生成了日报「${report.title}」。`,
    afterSnapshot: {
      reportId: report.id,
      reportDate: report.reportDate.toISOString(),
      newIntelligenceCount: report.newIntelligenceCount,
      newAnalysisCount: report.newAnalysisCount,
      newRecommendationCount: report.newRecommendationCount,
      activePocCount: report.activePocCount,
    },
  });

  revalidatePath(`/radars/${radarId}/daily-reports`);
  revalidatePath(`/radars/${radarId}/daily-reports/${report.id}`);
  revalidatePath(`/radars/${radarId}/workspace`);

  redirect(getReportDetailPath(radarId, report.id, "generated"));
}