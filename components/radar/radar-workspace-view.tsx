import Link from "next/link";
import type { ReactNode } from "react";
import type { getRadarWorkspaceData } from "@/lib/data/radar-workspace";
import {
  createPocFromIntelligenceAction,
  favoriteIntelligenceAction,
  markIntelligenceIrrelevantAction,
  observeIntelligenceAction,
} from "@/app/radars/[radarId]/workspace/actions";
import {
  acceptRecommendationAction,
  completeRecommendationAction,
  rejectRecommendationAction,
} from "@/app/radars/[radarId]/recommendations/actions";
import {
  hasTechnologyGraphLite,
  parseTechnologyGraphLite,
} from "@/lib/technology-graph";
import { DecisionHistory } from "@/components/radar/decision-history";

type WorkspaceData = NonNullable<
  Awaited<ReturnType<typeof getRadarWorkspaceData>>
>;

type RecentIntelligence = WorkspaceData["recentIntelligence"][number];
type RecentAnalysis = WorkspaceData["recentAnalyses"][number];
type RecentRecommendation = WorkspaceData["recentRecommendations"][number];
type RecentPoc = WorkspaceData["recentPocs"][number];
type RecentDailyReport = WorkspaceData["recentDailyReports"][number];
type TechnologyNetwork = NonNullable<WorkspaceData["technologyNetwork"]>;
type RelatedRelation = TechnologyNetwork["relatedRelations"][number];

type RadarWorkspaceViewProps = {
  data: WorkspaceData;
  actionMessage?: string;
};

function formatDate(value: Date | null | undefined, withTime = false) {
  if (!value) return "暂无记录";

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short", hour12: false } : {}),
  }).format(value);
}

function mapValue(value: string, map: Record<string, string>) {
  return map[value] ?? value;
}

function statusTone(value: string | boolean | null | undefined) {
  if (value === true) return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
  if (value === false) return "border-slate-300/20 bg-slate-300/10 text-slate-200";

  switch (value) {
    case "ACTIVE":
    case "APPROVED":
    case "DONE":
    case "PUBLISHED":
    case "ACCEPTED":
    case "ADOPTED":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
    case "HIGH":
    case "CRITICAL":
    case "OPEN":
    case "IN_PROGRESS":
    case "VALIDATE_BY_POC":
      return "border-amber-300/30 bg-amber-300/15 text-amber-100";
    case "PAUSED":
    case "REJECTED":
    case "CANCELLED":
    case "ARCHIVED":
      return "border-rose-300/30 bg-rose-300/15 text-rose-100";
    default:
      return "border-white/15 bg-white/10 text-slate-100";
  }
}

function Pill({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        tone ?? "border-white/15 bg-white/10 text-slate-100"
      }`}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {desc ? <p className="mt-1 text-sm leading-6 text-slate-300">{desc}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm text-slate-400">
      {text}
    </div>
  );
}

function FormButton({
  action,
  radarId,
  itemId,
  children,
  variant = "secondary",
}: {
  action: (formData: FormData) => void | Promise<void>;
  radarId: string;
  itemId: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const className =
    variant === "primary"
      ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/25"
      : variant === "danger"
        ? "border-rose-300/30 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20"
        : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10";

  return (
    <form action={action}>
      <input type="hidden" name="radarId" value={radarId} />
      <input type="hidden" name="itemId" value={itemId} />
      <button
        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${className}`}
        type="submit"
      >
        {children}
      </button>
    </form>
  );
}

function getActionMessage(action?: string) {
  const map: Record<string, string> = {
    observed: "已加入观察，生命周期状态已更新。",
    "poc-created": "已创建 PoC，可在 PoC 页面继续补充验证计划。",
    favorited: "已收藏，该操作已写入活动记录。",
    "marked-irrelevant": "已标记不相关，该操作已写入活动记录。",
    "recommendation-accepted": "已接受 Recommendation，下一步可以创建 PoC 进行快速验证。",
    "recommendation-rejected": "已拒绝 Recommendation，系统已记录本次决策。",
    "recommendation-done": "已完成 Recommendation，系统已记录本次决策闭环。",
    "recommendation-updated": "Recommendation 状态已更新。",
  };

  return action ? map[action] : undefined;
}

function formatTechnologyRelationType(value: string) {
  switch (value) {
    case "RELATED":
      return "相关技术";
    case "ALTERNATIVE":
      return "替代方案";
    case "DEPENDENCY":
      return "依赖关系";
    case "PART_OF":
      return "组成部分";
    case "ENABLES":
      return "能力支持";
    default:
      return value;
  }
}

export function RadarWorkspaceView({ data, actionMessage }: RadarWorkspaceViewProps) {
  const {
    radar,
    recentIntelligence,
    recentAnalyses,
    recentRecommendations,
    recentPocs,
    recentDailyReports,
    recentDecisions,
    technologyNetwork,
    stats,
  } = data;

  const message = getActionMessage(actionMessage);

  const scanIntensityText = mapValue(radar.scanIntensity, {
    LOW: "低频扫描",
    MEDIUM: "中频扫描",
    HIGH: "高频扫描",
  });

  const statusText = mapValue(radar.status, {
    DRAFT: "草稿",
    ACTIVE: "运行中",
    PAUSED: "已暂停",
    ARCHIVED: "已归档",
  });

  const currentConclusion =
    recentAnalyses[0]?.conclusion ||
    radar.summary ||
    "当前 Radar 已进入持续观察状态，等待更多技术情报和分析结论沉淀。";

  const focusTechnologies =
    recentIntelligence
      .map((item: RecentIntelligence) => item.technologyName)
      .filter(Boolean)
      .slice(0, 4)
      .join("、") || "暂未形成明确技术方向";

  const mainRisk =
    recentAnalyses[0]?.risk ||
    recentRecommendations[0]?.riskNote ||
    "当前主要风险来自信息不足、工程接入成本未验证，以及技术收益尚未通过 PoC 量化。";

  const nextAction =
    recentRecommendations[0]?.summary ||
    "优先从高相关技术情报中选择一个候选技术，创建最小 PoC 进行验证。";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link className="text-sm text-slate-300 hover:text-white" href="/dashboard">
          ← 返回 Dashboard
        </Link>
        <div className="flex gap-2">
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            href={`/radars/${radar.id}/pocs`}
          >
            PoC
          </Link>
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            href={`/radars/${radar.id}/daily-reports`}
          >
            Daily Reports
          </Link>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-8 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <Pill tone={statusTone(radar.status)}>{statusText}</Pill>
              <Pill tone={statusTone(radar.isActive)}>{radar.isActive ? "启用中" : "未启用"}</Pill>
              <Pill>{scanIntensityText}</Pill>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {radar.name}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300">
              {radar.description || "暂无 Radar 描述。"}
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 rounded-3xl border border-white/10 bg-black/15 p-5 text-sm">
            <div>
              <p className="text-slate-400">Business Domain</p>
              <p className="mt-1 text-white">{radar.businessDomain || "未配置"}</p>
            </div>
            <div>
              <p className="text-slate-400">Focus Question</p>
              <p className="mt-1 text-white">{radar.focusQuestion || "未配置"}</p>
            </div>
            <div>
              <p className="text-slate-400">Last Scanned</p>
              <p className="mt-1 text-white">{formatDate(radar.lastScannedAt, true)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="情报" value={stats.intelligenceItemCount} />
          <Stat label="分析" value={stats.analysisCount} />
          <Stat label="推荐动作" value={stats.recommendationCount} />
          <Stat label="PoC" value={stats.pocCount} />
        </div>
      </header>

      <Section title="Radar Summary" desc="将当前 Radar 的观察结论、重点方向、风险与下一步动作集中展示。">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryBlock title="当前观察结论" text={currentConclusion} />
          <SummaryBlock title="本轮重点技术方向" text={focusTechnologies} />
          <SummaryBlock title="主要风险" text={mainRisk} />
          <SummaryBlock title="推荐下一步动作" text={nextAction} />
        </div>
      </Section>

      <DecisionHistory
        decisions={recentDecisions}
        title="Decision History"
        emptyText="当前 Radar 暂无历史技术决策。"
      />

      <Section title="Intelligence Feed" desc="展示当前 Radar 下最近捕获的技术情报，并提供观察、PoC、收藏和不相关标记。">
        {recentIntelligence.length === 0 ? (
          <EmptyState text="当前暂无技术情报。" />
        ) : (
          <div className="grid gap-4">
            {recentIntelligence.map((item: RecentIntelligence) => (
              <article
                key={item.id}
                className="rounded-3xl border border-white/10 bg-black/15 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Pill>
                        {mapValue(item.sourceType, {
                          ARTICLE: "文章",
                          GITHUB: "GitHub",
                          SOCIAL: "社交平台",
                          PAPER: "论文",
                          VIDEO: "视频",
                          NEWSLETTER: "Newsletter",
                          DOCUMENTATION: "文档",
                          MANUAL: "手动录入",
                        })}
                      </Pill>
                      <Pill tone={statusTone(item.lifecycleStatus)}>
                        {mapValue(item.lifecycleStatus, {
                          DISCOVERED: "已发现",
                          ANALYZED: "已分析",
                          TRACKING: "持续跟踪",
                          ADOPTED: "已采纳",
                          ARCHIVED: "已归档",
                          DORMANT: "暂缓关注",
                          REACTIVATED: "重新激活",
                        })}
                      </Pill>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {item.summary || "暂无摘要。"}
                    </p>
                  </div>
                  <div className="text-sm text-slate-400 md:text-right">
                    <p>{formatDate(item.sourcePublishedAt ?? item.createdAt, true)}</p>
                    {item.sourceName ? <p className="mt-1">{item.sourceName}</p> : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm md:grid-cols-3">
                  <Meta label="技术名称" value={item.technologyName || "未标注"} />
                  <Meta label="Vendor" value={item.vendor || "未标注"} />
                  <Meta label="Topic" value={item.topic || "未标注"} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <FormButton action={observeIntelligenceAction} radarId={radar.id} itemId={item.id}>
                    加入观察
                  </FormButton>
                  <FormButton
                    action={createPocFromIntelligenceAction}
                    radarId={radar.id}
                    itemId={item.id}
                    variant="primary"
                  >
                    创建 PoC
                  </FormButton>
                  <FormButton action={favoriteIntelligenceAction} radarId={radar.id} itemId={item.id}>
                    收藏
                  </FormButton>
                  <FormButton
                    action={markIntelligenceIrrelevantAction}
                    radarId={radar.id}
                    itemId={item.id}
                    variant="danger"
                  >
                    标记不相关
                  </FormButton>
                  <a
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    href={item.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    查看来源
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="TechnologyAnalysis"
        desc="展示 TERA 七项评分、执行摘要、机会、风险、结论与轻量技术图谱。"
      >
        {recentAnalyses.length === 0 ? (
          <EmptyState text="当前暂无技术分析。" />
        ) : (
          <div className="grid gap-4">
            {recentAnalyses.map((analysis: RecentAnalysis) => {
              const graphLite = parseTechnologyGraphLite(analysis.metadata);
              const hasGraphLite = hasTechnologyGraphLite(graphLite);

              return (
                <article
                  key={analysis.id}
                  className="rounded-3xl border border-white/10 bg-black/15 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Pill tone={statusTone(analysis.status)}>
                          {mapValue(analysis.status, {
                            DRAFT: "草稿",
                            GENERATED: "已生成",
                            REVIEWED: "已复核",
                            APPROVED: "已确认",
                            SUPERSEDED: "已替代",
                          })}
                        </Pill>
                        <Pill>
                          {mapValue(analysis.analysisType, {
                            AI_GENERATED: "AI 生成",
                            HUMAN_AUTHORED: "人工撰写",
                            HYBRID: "混合模式",
                          })}
                        </Pill>
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {analysis.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400">
                      更新于 {formatDate(analysis.updatedAt, true)}
                    </p>
                  </div>
      
                  <div className="mt-5 grid gap-3 md:grid-cols-7">
                    <Score label="来源可信" value={analysis.sourceTrustScore} />
                    <Score label="技术价值" value={analysis.technicalValueScore} />
                    <Score label="工程就绪" value={analysis.engineeringReadinessScore} />
                    <Score label="业务相关" value={analysis.businessRelevanceScore} />
                    <Score label="采用风险" value={analysis.adoptionRiskScore} />
                    <Score label="战略价值" value={analysis.strategicValueScore} />
                    <Score label="社区热度" value={analysis.communityHeatScore} />
                  </div>
      
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <TextPanel
                      title="Executive Summary"
                      text={analysis.executiveSummary}
                    />
                    <TextPanel title="Opportunity" text={analysis.opportunity} />
                    <TextPanel title="Risk" text={analysis.risk} />
                    <TextPanel title="Conclusion" text={analysis.conclusion} />
                  </div>
      
                  <GraphLitePanel
                    graphLite={graphLite}
                    hasGraphLite={hasGraphLite}
                  />
                </article>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Recommendation"
        desc="展示推荐动作，并提供进入 PoC 或创建 PoC 的工作入口。"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              href={`/radars/${radar.id}/recommendations`}
            >
              查看全部 Recommendation
            </Link>
        
            <Link
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-300/20"
              href={`/radars/${radar.id}/pocs/new`}
            >
              新建 PoC
            </Link>
          </div>
        }
      >
        {recentRecommendations.length === 0 ? (
          <EmptyState text="当前暂无推荐动作。" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recentRecommendations.map(
              (recommendation: RecentRecommendation) => (
              <article
                key={recommendation.id}
                className="rounded-3xl border border-white/10 bg-black/15 p-5"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <Pill tone={statusTone(recommendation.actionType)}>
                    {mapValue(recommendation.actionType, {
                      WATCH: "持续观察",
                      VALIDATE_BY_POC: "建议 PoC",
                      ADOPT_INCREMENTALLY: "逐步采用",
                      REJECT_FOR_NOW: "暂不推荐",
                      NEED_MORE_INFO: "需要更多信息",
                    })}
                  </Pill>
                  <Pill tone={statusTone(recommendation.status)}>
                    {mapValue(recommendation.status, {
                      OPEN: "待处理",
                      ACCEPTED: "已接受",
                      REJECTED: "已拒绝",
                      DONE: "已完成",
                    })}
                  </Pill>
                  {recommendation.priority ? (
                    <Pill tone={statusTone(recommendation.priority)}>
                      {mapValue(recommendation.priority, {
                        LOW: "低优先级",
                        MEDIUM: "中优先级",
                        HIGH: "高优先级",
                        CRITICAL: "关键优先级",
                      })}
                    </Pill>
                  ) : null}
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {recommendation.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {recommendation.summary || "暂无推荐摘要。"}
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <TextPanel title="推荐理由" text={recommendation.rationale} />
                  <TextPanel title="预期结果" text={recommendation.expectedOutcome} />
                  <TextPanel title="风险提示" text={recommendation.riskNote} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  {recommendation.status === "OPEN" ? (
                    <>
                      <FormButton
                        action={acceptRecommendationAction}
                        radarId={radar.id}
                        itemId={recommendation.id}
                        variant="primary"
                      >
                        接受
                      </FormButton>
                
                      <FormButton
                        action={rejectRecommendationAction}
                        radarId={radar.id}
                        itemId={recommendation.id}
                        variant="danger"
                      >
                        拒绝
                      </FormButton>
                    </>
                  ) : null}
                
                  {recommendation.status === "ACCEPTED" ? (
                    <FormButton
                      action={completeRecommendationAction}
                      radarId={radar.id}
                      itemId={recommendation.id}
                      variant="primary"
                    >
                      标记完成
                    </FormButton>
                  ) : null}
                
                  {recommendation.status !== "REJECTED" && recommendation.status !== "DONE" ? (
                    <Link
                      className="rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/25"
                      href={`/radars/${radar.id}/pocs/new?recommendationId=${recommendation.id}`}
                    >
                      创建 PoC
                    </Link>
                  ) : null}
                
                  <Link
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                    href={`/radars/${radar.id}/pocs`}
                  >
                    查看 PoC
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="PoC 快捷入口"
          desc="查看当前 Radar 的验证实验进展。"
          action={
            <Link
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              href={`/radars/${radar.id}/pocs`}
            >
              查看全部
            </Link>
          }
        >
          {recentPocs.length === 0 ? (
            <EmptyState text="当前暂无 PoC。" />
          ) : (
            <div className="space-y-3">
              {recentPocs.map((poc: RecentPoc) => (
                <Link
                  className="block rounded-2xl border border-white/10 bg-black/15 p-4 hover:bg-white/[0.08]"
                  href={`/radars/${radar.id}/pocs/${poc.id}`}
                  key={poc.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-white">{poc.title}</h3>
                    <Pill tone={statusTone(poc.status)}>
                      {mapValue(poc.status, {
                        PLANNED: "计划中",
                        IN_PROGRESS: "验证中",
                        DONE: "已完成",
                        CANCELLED: "已取消",
                      })}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{poc.objective}</p>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="DailyReport 快捷入口"
          desc="查看近期日报摘要和下一步动作。"
          action={
            <Link
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              href={`/radars/${radar.id}/daily-reports`}
            >
              查看全部
            </Link>
          }
        >
          {recentDailyReports.length === 0 ? (
            <EmptyState text="当前暂无日报。" />
          ) : (
            <div className="space-y-3">
              {recentDailyReports.map((report: RecentDailyReport) => (
                <Link
                  className="block rounded-2xl border border-white/10 bg-black/15 p-4 hover:bg-white/[0.08]"
                  href={`/radars/${radar.id}/daily-reports/${report.id}`}
                  key={report.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-white">{report.title}</h3>
                    <Pill tone={statusTone(report.status)}>
                      {mapValue(report.status, {
                        DRAFT: "草稿",
                        PUBLISHED: "已发布",
                      })}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {report.summary || "暂无摘要。"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    报告日期：{formatDate(report.reportDate)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200/80">
                Technology Network
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                技术关系网络
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                展示当前 Radar 下已沉淀的技术关系，包括相关技术、替代方案和依赖关系。当前版本先展示结构化关联，不做图谱可视化。
              </p>
            </div>
          </div>
        
          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400">技术节点</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {stats.technologyNodeCount}
              </p>
            </div>
        
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400">技术关系</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {stats.technologyRelationCount}
              </p>
            </div>
        
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400">相关关系</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {technologyNetwork?.stats.relatedCount ?? 0}
              </p>
            </div>
        
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400">替代关系</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {technologyNetwork?.stats.alternativeCount ?? 0}
              </p>
            </div>
        
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400">依赖关系</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {technologyNetwork?.stats.dependencyCount ?? 0}
              </p>
            </div>
          </div>
        
          {!technologyNetwork || technologyNetwork.stats.relationCount === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-300">
              当前 Radar 暂无技术关系数据。后续可从情报分析、推荐动作和 PoC 结论中沉淀技术节点与关系。
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-base font-semibold text-white">
                  Related Technologies
                </h3>
        
                <div className="mt-4 space-y-3">
                  {technologyNetwork.relatedRelations.length === 0 ? (
                    <p className="text-sm text-slate-400">暂无相关技术关系。</p>
                  ) : (
                    technologyNetwork.relatedRelations.map((relation: RelatedRelation) => (
                      <div
                        key={relation.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {relation.sourceNode.name} → {relation.targetNode.name}
                        </p>
                        <p className="mt-2 text-xs text-cyan-200">
                          {formatTechnologyRelationType(relation.relationType)} · 强度{" "}
                          {relation.strength}
                        </p>
                        {relation.note ? (
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {relation.note}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
        
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-base font-semibold text-white">
                  Alternative Technologies
                </h3>
        
                <div className="mt-4 space-y-3">
                  {technologyNetwork.alternativeRelations.length === 0 ? (
                    <p className="text-sm text-slate-400">暂无替代方案关系。</p>
                  ) : (
                    technologyNetwork.alternativeRelations.map((relation: RelatedRelation) => (
                      <div
                        key={relation.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {relation.sourceNode.name} ↔ {relation.targetNode.name}
                        </p>
                        <p className="mt-2 text-xs text-amber-200">
                          {formatTechnologyRelationType(relation.relationType)} · 强度{" "}
                          {relation.strength}
                        </p>
                        {relation.note ? (
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {relation.note}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
        
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-base font-semibold text-white">Dependencies</h3>
        
                <div className="mt-4 space-y-3">
                  {technologyNetwork.dependencyRelations.length === 0 ? (
                    <p className="text-sm text-slate-400">暂无依赖关系。</p>
                  ) : (
                    technologyNetwork.dependencyRelations.map((relation: RelatedRelation) => (
                      <div
                        key={relation.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {relation.sourceNode.name} → {relation.targetNode.name}
                        </p>
                        <p className="mt-2 text-xs text-violet-200">
                          {formatTechnologyRelationType(relation.relationType)} · 强度{" "}
                          {relation.strength}
                        </p>
                        {relation.note ? (
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {relation.note}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-100">{text}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TextPanel({ title, text }: { title: string; text?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-200">
        {text || "暂无内容。"}
      </p>
    </div>
  );
}

function GraphLitePanel({
  graphLite,
  hasGraphLite,
}: {
  graphLite: {
    relatedTechnologies: string[];
    alternativeTechnologies: string[];
    dependencyTechnologies: string[];
    technologyRoute: string;
    graphNote: string;
  };
  hasGraphLite: boolean;
}) {
  return (
    <div className="mt-5 rounded-3xl border border-cyan-400/15 bg-cyan-400/5 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Technology Graph Lite
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            轻量技术关联
          </h4>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            用于沉淀相关技术、替代方案、依赖技术和所属技术路线，作为后续正式 Technology Graph 的基础。
          </p>
        </div>

        <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
          Graph Lite
        </span>
      </div>

      {hasGraphLite ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {graphLite.technologyRoute ? (
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4 md:col-span-2">
              <p className="text-xs font-medium text-slate-400">
                所属技术路线
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {graphLite.technologyRoute}
              </p>
            </div>
          ) : null}

          {graphLite.relatedTechnologies.length > 0 ? (
            <GraphLiteTagGroup
              title="相关技术"
              items={graphLite.relatedTechnologies}
            />
          ) : null}

          {graphLite.alternativeTechnologies.length > 0 ? (
            <GraphLiteTagGroup
              title="替代技术"
              items={graphLite.alternativeTechnologies}
            />
          ) : null}

          {graphLite.dependencyTechnologies.length > 0 ? (
            <GraphLiteTagGroup
              title="依赖技术"
              items={graphLite.dependencyTechnologies}
            />
          ) : null}

          {graphLite.graphNote ? (
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4 md:col-span-2">
              <p className="text-xs font-medium text-slate-400">图谱备注</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {graphLite.graphNote}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-4">
          <p className="text-sm leading-6 text-slate-400">
            当前分析暂未沉淀技术关系。后续可由 AI 分析或人工整理写入 metadata.graphLite。
          </p>
        </div>
      )}
    </div>
  );
}

function GraphLiteTagGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}