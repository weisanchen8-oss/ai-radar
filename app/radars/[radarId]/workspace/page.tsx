// Radar Workspace 页面：基于既有数据读取链路展示雷达概览、情报、分析、推荐、PoC 与日报。
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getRadarWorkspaceData } from "@/lib/data/radar-workspace";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined, withTime = false) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short", hour12: false } : {}),
  }).format(value);
}

function formatRadarStatus(value: string) {
  const map: Record<string, string> = {
    DRAFT: "草稿",
    ACTIVE: "运行中",
    PAUSED: "已暂停",
    ARCHIVED: "已归档",
  };

  return map[value] ?? value;
}

function formatActiveStatus(value: boolean) {
  return value ? "启用中" : "未启用";
}

function formatScanIntensity(value: string) {
  const map: Record<string, string> = {
    LOW: "低频扫描",
    MEDIUM: "中频扫描",
    HIGH: "高频扫描",
  };

  return map[value] ?? value;
}

function formatIntelligenceSourceType(value: string) {
  const map: Record<string, string> = {
    ARTICLE: "文章",
    GITHUB: "GitHub",
    SOCIAL: "社交平台",
    PAPER: "论文",
    VIDEO: "视频",
    NEWSLETTER: "Newsletter",
    DOCUMENTATION: "文档",
    MANUAL: "手动录入",
  };

  return map[value] ?? value;
}

function formatLifecycleStatus(value: string) {
  const map: Record<string, string> = {
    DISCOVERED: "已发现",
    ANALYZED: "已分析",
    TRACKING: "持续跟踪",
    ADOPTED: "已采纳",
    ARCHIVED: "已归档",
    DORMANT: "暂缓关注",
    REACTIVATED: "重新激活",
  };

  return map[value] ?? value;
}

function formatAnalysisStatus(value: string) {
  const map: Record<string, string> = {
    DRAFT: "草稿",
    GENERATED: "已生成",
    REVIEWED: "已复核",
    APPROVED: "已确认",
    SUPERSEDED: "已替代",
  };

  return map[value] ?? value;
}

function formatAnalysisType(value: string) {
  const map: Record<string, string> = {
    AI_GENERATED: "AI 生成",
    HUMAN_AUTHORED: "人工撰写",
    HYBRID: "混合模式",
  };

  return map[value] ?? value;
}

function formatRecommendationActionType(value: string) {
  const map: Record<string, string> = {
    WATCH: "持续观察",
    VALIDATE_BY_POC: "建议 PoC",
    ADOPT_INCREMENTALLY: "逐步采用",
    REJECT_FOR_NOW: "暂不推荐",
    NEED_MORE_INFO: "需要更多信息",
  };

  return map[value] ?? value;
}

function formatRecommendationStatus(value: string) {
  const map: Record<string, string> = {
    OPEN: "待处理",
    ACCEPTED: "已接受",
    REJECTED: "已拒绝",
    DONE: "已完成",
  };

  return map[value] ?? value;
}

function formatPriority(value: string | null) {
  if (!value) {
    return null;
  }

  const map: Record<string, string> = {
    HIGH: "高优先级",
    MEDIUM: "中优先级",
    LOW: "低优先级",
  };

  return map[value] ?? value;
}

function formatPocStatus(value: string) {
  const map: Record<string, string> = {
    PLANNED: "计划中",
    IN_PROGRESS: "验证中",
    DONE: "已完成",
    CANCELLED: "已取消",
  };

  return map[value] ?? value;
}

function formatPocOutcome(value: string | null) {
  if (!value) {
    return "暂无验证结论";
  }

  const map: Record<string, string> = {
    SUCCESS: "成功",
    PARTIAL: "部分成立",
    FAILED: "失败",
    INCONCLUSIVE: "结论不明确",
  };

  return map[value] ?? value;
}

function formatDailyReportStatus(value: string) {
  const map: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
  };

  return map[value] ?? value;
}

function toneByValue(value: string) {
  switch (value) {
    case "ACTIVE":
    case "APPROVED":
    case "DONE":
    case "PUBLISHED":
    case "ADOPTED":
    case "ACCEPTED":
      return "border-emerald-400/30 bg-emerald-400/15 text-emerald-100";
    case "HIGH":
    case "CRITICAL":
    case "IN_PROGRESS":
    case "OPEN":
      return "border-amber-400/30 bg-amber-400/15 text-amber-100";
    case "PAUSED":
    case "REJECTED":
    case "CANCELLED":
    case "ARCHIVED":
      return "border-rose-400/30 bg-rose-400/15 text-rose-100";
    default:
      return "border-white/15 bg-white/10 text-slate-100";
  }
}

function recommendationActionTone(value: string) {
  switch (value) {
    case "VALIDATE_BY_POC":
      return "border-cyan-300/30 bg-cyan-300/15 text-cyan-100";
    case "ADOPT_INCREMENTALLY":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
    case "WATCH":
      return "border-blue-300/30 bg-blue-300/15 text-blue-100";
    case "NEED_MORE_INFO":
      return "border-amber-300/30 bg-amber-300/15 text-amber-100";
    case "REJECT_FOR_NOW":
      return "border-slate-400/25 bg-slate-400/10 text-slate-200";
    default:
      return "border-white/15 bg-white/10 text-slate-100";
  }
}

function renderOptionalField(label: string, value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

type PocRecord = {
  id: string;
  title: string;
  status: string;
  objective: string;
  outcome: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

type RecommendationRecord = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  actionType: string;
  status: string;
  priority: string | null;
  createdAt: Date;
};

function getPocStatusClassName(status: string) {
  switch (status) {
    case "PLANNED":
      return "border-indigo-300/30 bg-indigo-300/15 text-indigo-100";
    case "IN_PROGRESS":
      return "border-cyan-300/30 bg-cyan-300/15 text-cyan-100";
    case "DONE":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
    case "CANCELLED":
      return "border-slate-300/20 bg-slate-300/10 text-slate-200";
    default:
      return "border-white/15 bg-white/10 text-slate-100";
  }
}

function getPocStatusCounts(pocs: PocRecord[]) {
  return pocs.reduce(
    (acc, poc) => {
      switch (poc.status) {
        case "PLANNED":
          acc.planned += 1;
          break;
        case "IN_PROGRESS":
          acc.inProgress += 1;
          break;
        case "DONE":
          acc.done += 1;
          break;
        case "CANCELLED":
          acc.cancelled += 1;
          break;
      }

      return acc;
    },
    { planned: 0, inProgress: 0, done: 0, cancelled: 0 },
  );
}

function pickPrimaryPoc(pocs: PocRecord[]) {
  return (
    pocs.find((poc) => poc.status === "IN_PROGRESS") ??
    pocs.find((poc) => poc.status === "PLANNED") ??
    pocs.find((poc) => poc.status === "DONE") ??
    pocs[0]
  );
}

function isSameDateTime(left: Date | null | undefined, right: Date | null | undefined) {
  if (!left || !right) {
    return false;
  }

  return left.getTime() === right.getTime();
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.03] px-5 py-8 text-sm text-slate-300">
      {text}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">{hint}</p>
    </article>
  );
}

function InfoPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-xs text-slate-200">
      <span className="text-slate-400">{label}</span>
      <span className={tone ?? ""}>{value}</span>
    </div>
  );
}

function pickPrimaryRecommendation(recommendations: RecommendationRecord[]) {
  return (
    recommendations.find((item) => item.actionType === "VALIDATE_BY_POC") ??
    recommendations.find((item) => item.actionType === "ADOPT_INCREMENTALLY") ??
    recommendations[0]
  );
}

export default async function RadarWorkspacePage({
  params,
}: {
  params: Promise<{ radarId: string }>;
}) {
  const { radarId } = await params;
  const workspaceData = await getRadarWorkspaceData(radarId);

  if (!workspaceData) {
    notFound();
  }

  const {
    radar,
    recentIntelligence,
    recentAnalyses,
    recentRecommendations,
    recentPocs,
    recentDailyReports,
  } = workspaceData;

  const statItems = [
    { label: "技术情报数量", value: recentIntelligence.length, hint: "Intelligence" },
    { label: "技术分析数量", value: recentAnalyses.length, hint: "Analysis" },
    { label: "推荐动作数量", value: recentRecommendations.length, hint: "Recommendation" },
    { label: "PoC 数量", value: recentPocs.length, hint: "PoC" },
    { label: "日报数量", value: recentDailyReports.length, hint: "Daily Report" },
  ];

  const radarMeta = [
    { label: "业务领域", value: radar.businessDomain || "未配置" },
    { label: "关注问题", value: radar.focusQuestion || "未配置" },
    { label: "扫描强度", value: formatScanIntensity(radar.scanIntensity) },
    { label: "运行状态", value: formatRadarStatus(radar.status) },
    { label: "启用状态", value: formatActiveStatus(radar.isActive) },
    { label: "最近扫描", value: formatDate(radar.lastScannedAt, true) || "暂无记录" },
    { label: "下次扫描", value: formatDate(radar.nextScanAt, true) || "未配置" },
  ];

  const analysisScores = (analysis: (typeof recentAnalyses)[number]) =>
    [
      ["来源可信度", analysis.sourceTrustScore],
      ["技术价值", analysis.technicalValueScore],
      ["工程就绪度", analysis.engineeringReadinessScore],
      ["业务相关性", analysis.businessRelevanceScore],
      ["采用风险", analysis.adoptionRiskScore],
      ["战略价值", analysis.strategicValueScore],
      ["社区热度", analysis.communityHeatScore],
    ].filter(([, value]) => typeof value === "number");

  const recommendationItems = recentRecommendations as RecommendationRecord[];
  const primaryRecommendation =
    recommendationItems.length > 0 ? pickPrimaryRecommendation(recommendationItems) : null;
  const secondaryRecommendations = primaryRecommendation
    ? recommendationItems.filter((item) => item.id !== primaryRecommendation.id)
    : [];

  return (
    <RadarAppShell activeKey="workspace">
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
          >
            返回 Dashboard
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.12),transparent_30%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-4xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-sky-100">
                    Radar Workspace
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${toneByValue(radar.status)}`}
                  >
                    {formatRadarStatus(radar.status)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      radar.isActive
                        ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
                        : "border-slate-400/20 bg-slate-400/10 text-slate-200"
                    }`}
                  >
                    {formatActiveStatus(radar.isActive)}
                  </span>
                </div>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                    {radar.name}
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
                    {radar.description || "暂无描述"}
                  </p>
                </div>
              </div>

              <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
                {radarMeta.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">观察范围</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {radar.observationScope || "未配置"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">目标受众</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {radar.targetAudience || "未配置"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">摘要</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {radar.summary || "未配置"}
                </p>
              </div>
            </div>

            {radar.decisionContext ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">决策背景</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{radar.decisionContext}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statItems.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-4">
            <SectionCard
              title="技术情报流"
              description="聚合当前 Radar 的最新技术情报，便于快速确认来源、技术主题与生命周期状态。"
            >
              {recentIntelligence.length === 0 ? (
                <EmptyState text="暂无技术情报。" />
              ) : (
                <div className="space-y-3">
                  {recentIntelligence.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="text-base font-medium text-white">{item.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <InfoPill
                              label="来源类型"
                              value={formatIntelligenceSourceType(item.sourceType)}
                            />
                            <InfoPill
                              label="生命周期"
                              value={formatLifecycleStatus(item.lifecycleStatus)}
                              tone={toneByValue(item.lifecycleStatus)}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          {formatDate(item.sourcePublishedAt ?? item.createdAt, true) || "暂无记录"}
                        </p>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-300">
                        {item.summary || "暂无摘要"}
                      </p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {renderOptionalField("技术名称", item.technologyName)}
                        {renderOptionalField("来源名称", item.sourceName)}
                      </div>

                      {item.sourceUrl ? (
                        <div className="mt-4">
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-sky-300 transition hover:text-sky-200"
                          >
                            查看来源
                          </a>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="技术分析"
              description="展示最新分析的状态、类型、摘要、结论与评分，用于承接情报判断。"
            >
              {recentAnalyses.length === 0 ? (
                <EmptyState text="暂无技术分析。" />
              ) : (
                <div className="space-y-3">
                  {recentAnalyses.map((analysis) => (
                    <article
                      key={analysis.id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="text-base font-medium text-white">{analysis.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <InfoPill
                              label="状态"
                              value={formatAnalysisStatus(analysis.status)}
                              tone={toneByValue(analysis.status)}
                            />
                            <InfoPill
                              label="类型"
                              value={formatAnalysisType(analysis.analysisType)}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          更新于 {formatDate(analysis.updatedAt, true) || "暂无记录"}
                        </p>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            执行摘要
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {analysis.executiveSummary || "暂无摘要"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            结论
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {analysis.conclusion || "暂无结论"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {analysisScores(analysis).map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                          >
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                              {label}
                            </p>
                            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="推荐动作" description="根据技术分析结果生成的下一步决策建议">
              {recentRecommendations.length === 0 ? (
                <EmptyState text="暂无推荐动作。当前 Radar 暂未生成明确的技术决策建议，可先查看技术情报与分析结果。" />
              ) : (
                <div className="space-y-4">
                  {primaryRecommendation ? (
                    <article className="overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(15,23,42,0.54)_42%,rgba(16,185,129,0.14))] p-5 shadow-[0_20px_60px_rgba(8,47,73,0.26)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                          <p className="text-xs uppercase tracking-[0.28em] text-sky-100/75">
                            重点推荐
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs ${recommendationActionTone(
                                primaryRecommendation.actionType,
                              )}`}
                            >
                              {formatRecommendationActionType(primaryRecommendation.actionType)}
                            </span>
                            {primaryRecommendation.status ? (
                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${toneByValue(
                                  primaryRecommendation.status,
                                )}`}
                              >
                                {formatRecommendationStatus(primaryRecommendation.status)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300">
                          {formatDate(primaryRecommendation.createdAt, true) || "暂无记录"}
                        </p>
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                        {primaryRecommendation.title}
                      </h3>

                      {primaryRecommendation.summary ? (
                        <p className="mt-4 text-sm leading-7 text-slate-200">
                          {primaryRecommendation.summary}
                        </p>
                      ) : null}

                      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
                        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            推荐理由
                          </p>
                          <p className="mt-3 text-sm leading-7 text-white">
                            {primaryRecommendation.rationale || "暂无推荐理由"}
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                          {primaryRecommendation.priority ? (
                            <>
                              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                优先级
                              </p>
                              <p className="mt-3 text-sm font-medium text-white">
                                优先级：{formatPriority(primaryRecommendation.priority)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-400">未设置优先级</p>
                          )}
                        </div>
                      </div>
                    </article>
                  ) : null}

                  {secondaryRecommendations.length > 0 ? (
                    <div className="space-y-3">
                      {secondaryRecommendations.map((recommendation) => (
                        <article
                          key={recommendation.id}
                          className="rounded-[1.55rem] border border-white/10 bg-black/20 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs ${recommendationActionTone(
                                    recommendation.actionType,
                                  )}`}
                                >
                                  {formatRecommendationActionType(recommendation.actionType)}
                                </span>
                                {recommendation.status ? (
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs ${toneByValue(
                                      recommendation.status,
                                    )}`}
                                  >
                                    {formatRecommendationStatus(recommendation.status)}
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="text-lg font-semibold text-white">
                                {recommendation.title}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-400">
                              {formatDate(recommendation.createdAt, true) || "暂无记录"}
                            </p>
                          </div>

                          {recommendation.summary ? (
                            <p className="mt-4 text-sm leading-7 text-slate-200">
                              {recommendation.summary}
                            </p>
                          ) : null}

                          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                推荐理由
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-200">
                                {recommendation.rationale || "暂无推荐理由"}
                              </p>
                            </div>
                            {recommendation.priority ? (
                              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                                <p className="text-sm font-medium text-white">
                                  优先级：{formatPriority(recommendation.priority)}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="PoC 验证"
              description="把推荐动作转化为可验证的技术实验"
            >
              {recentPocs.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.03] px-5 py-8">
                  <h3 className="text-lg font-semibold text-white">暂无 PoC 验证</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    当前 Radar 暂未创建验证实验，可从推荐动作中挑选高价值技术进行 PoC。
                  </p>
                </div>
              ) : (
                (() => {
                  const pocItems = recentPocs as PocRecord[];
                  const counts = getPocStatusCounts(pocItems);
                  const primaryPoc = pickPrimaryPoc(pocItems);
                  const secondaryPocs = pocItems.filter((poc) => poc.id !== primaryPoc.id);

                  return (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-[1.5rem] border border-indigo-300/15 bg-indigo-300/[0.08] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-indigo-100/75">
                            计划中
                          </p>
                          <p className="mt-3 text-3xl font-semibold text-white">{counts.planned}</p>
                          <p className="mt-2 text-sm text-slate-300">等待排期的验证实验</p>
                        </article>
                        <article className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.08] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">
                            验证中
                          </p>
                          <p className="mt-3 text-3xl font-semibold text-white">
                            {counts.inProgress}
                          </p>
                          <p className="mt-2 text-sm text-slate-300">正在推进的实验</p>
                        </article>
                        <article className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/[0.08] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/75">
                            已完成
                          </p>
                          <p className="mt-3 text-3xl font-semibold text-white">{counts.done}</p>
                          <p className="mt-2 text-sm text-slate-300">已形成结论的实验</p>
                        </article>
                        <article className="rounded-[1.5rem] border border-slate-300/15 bg-slate-300/[0.08] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-100/75">
                            已取消
                          </p>
                          <p className="mt-3 text-3xl font-semibold text-white">
                            {counts.cancelled}
                          </p>
                          <p className="mt-2 text-sm text-slate-300">已终止的实验</p>
                        </article>
                      </div>

                      <article className="rounded-[1.85rem] border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.52)_50%,rgba(34,197,94,0.12))] p-5 shadow-[0_20px_60px_rgba(8,47,73,0.26)]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.28em] text-sky-100/75">
                              重点 PoC
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${getPocStatusClassName(
                                  primaryPoc.status,
                                )}`}
                              >
                                {formatPocStatus(primaryPoc.status)}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-300">
                            <p>创建时间 {formatDate(primaryPoc.createdAt, true) || "暂无记录"}</p>
                            {!isSameDateTime(primaryPoc.createdAt, primaryPoc.updatedAt) ? (
                              <p className="mt-1">
                                更新时间 {formatDate(primaryPoc.updatedAt, true) || "暂无记录"}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                          {primaryPoc.title}
                        </h3>

                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                              验证目标
                            </p>
                            <p className="mt-3 text-sm leading-7 text-white">
                              {primaryPoc.objective || "暂无验证目标"}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                              验证结论
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-200">
                              {primaryPoc.outcome ? formatPocOutcome(primaryPoc.outcome) : "暂无验证结论"}
                            </p>
                          </div>
                        </div>
                      </article>

                      <div className="grid gap-3">
                        {secondaryPocs.map((poc) => (
                          <article
                            key={poc.id}
                            className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs ${getPocStatusClassName(
                                      poc.status,
                                    )}`}
                                  >
                                    {formatPocStatus(poc.status)}
                                  </span>
                                </div>
                                <h3 className="text-base font-semibold text-white">{poc.title}</h3>
                              </div>
                              <div className="text-xs text-slate-300">
                                <p>创建时间 {formatDate(poc.createdAt, true) || "暂无记录"}</p>
                                {!isSameDateTime(poc.createdAt, poc.updatedAt) ? (
                                  <p className="mt-1">
                                    更新时间 {formatDate(poc.updatedAt, true) || "暂无记录"}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                  验证目标
                                </p>
                                <p className="mt-3 text-sm leading-7 text-slate-200">
                                  {poc.objective || "暂无验证目标"}
                                </p>
                              </div>
                              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                  验证结论
                                </p>
                                <p className="mt-3 text-sm leading-7 text-slate-200">
                                  {poc.outcome ? formatPocOutcome(poc.outcome) : "暂无验证结论"}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </SectionCard>

            <SectionCard
              title="日报沉淀"
              description="沉淀每日总结，优先展示 reportDate，没有时回退到创建时间。"
            >
              {recentDailyReports.length === 0 ? (
                <EmptyState text="暂无日报沉淀。" />
              ) : (
                <div className="space-y-3">
                  {recentDailyReports.map((report) => (
                    <article
                      key={report.id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="text-base font-medium text-white">{report.title}</h3>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${toneByValue(
                            report.status,
                          )}`}
                        >
                          {formatDailyReportStatus(report.status)}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-300">
                        {report.summary || "暂无摘要"}
                      </p>

                      <p className="mt-4 text-xs text-slate-400">
                        报告日期 {formatDate(report.reportDate ?? report.createdAt) || "暂无记录"}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </section>
      </div>
    </RadarAppShell>
  );
}
