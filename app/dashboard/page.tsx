/**
 * 文件作用：
 * 定义 AI Radar Dashboard 首页。
 * 当前页面定位为 AI 技术分析与验证平台的决策驾驶舱，
 * 展示 Radar、技术分析、推荐动作、PoC、技术图谱、风险提醒、日报入口和近期决策记忆。
 */

import Link from "next/link";
import { DecisionHistory } from "@/components/radar/decision-history";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import {
  getDashboardDecisionData,
  type DashboardDecisionData,
} from "@/lib/data/dashboard";
import { getRecentDecisionsForDashboard } from "@/lib/data/radar-memory";

export const dynamic = "force-dynamic";

type RadarCard = DashboardDecisionData["radars"][number];
type HighValueAnalysis = DashboardDecisionData["recentHighValueAnalyses"][number];
type RiskAnalysis = DashboardDecisionData["recentRiskAnalyses"][number];
type DailyReport = DashboardDecisionData["recentDailyReports"][number];
type TopConnectedTechnology =
  DashboardDecisionData["topConnectedTechnologies"][number];

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "暂无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatRadarStatus(status: string) {
  const statusMap: Record<string, string> = {
    DRAFT: "草稿",
    ACTIVE: "运行中",
    PAUSED: "已暂停",
    ARCHIVED: "已归档",
  };

  return statusMap[status] ?? status;
}

function formatScanIntensity(scanIntensity: string) {
  const intensityMap: Record<string, string> = {
    LOW: "低强度",
    MEDIUM: "中强度",
    HIGH: "高强度",
  };

  return intensityMap[scanIntensity] ?? scanIntensity;
}

function formatAnalysisStatus(status: string) {
  const statusMap: Record<string, string> = {
    DRAFT: "草稿",
    GENERATED: "待审核",
    REVIEWED: "已复核",
    APPROVED: "已通过",
    SUPERSEDED: "已替代",
  };

  return statusMap[status] ?? status;
}

function formatReportStatus(status: string) {
  const statusMap: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
  };

  return statusMap[status] ?? status;
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
      {label}：{value}
    </span>
  );
}

function HighValueAnalysisCard({
  analysis,
}: {
  analysis: HighValueAnalysis;
}) {
  const summary =
    analysis.executiveSummary || analysis.conclusion || "暂无摘要";

  return (
    <article className="rounded-3xl border border-white/10 bg-black/15 p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
          高战略价值
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatAnalysisStatus(analysis.status)}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white">{analysis.title}</h3>

      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">
        {summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ScorePill label="战略价值" value={analysis.strategicValueScore} />
        <ScorePill label="业务相关" value={analysis.businessRelevanceScore} />
        <ScorePill label="工程就绪" value={analysis.engineeringReadinessScore} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <div className="text-slate-500">
          <p>所属 Radar：{analysis.radar.name}</p>
          <p>更新：{formatDate(analysis.updatedAt)}</p>
        </div>

        <Link
          className="shrink-0 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-300/20"
          href={`/radars/${analysis.radarId}/workspace`}
        >
          进入 Workspace
        </Link>
      </div>
    </article>
  );
}

function RiskAnalysisCard({ analysis }: { analysis: RiskAnalysis }) {
  return (
    <article className="rounded-3xl border border-rose-300/15 bg-rose-300/[0.05] p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">
          风险提醒
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          采用风险：{analysis.adoptionRiskScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white">{analysis.title}</h3>

      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">
        {analysis.risk ||
          "该技术采用风险较高，建议在 PoC 前补充验证风险点。"}
      </p>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <div className="text-slate-500">
          <p>所属 Radar：{analysis.radar.name}</p>
          <p>更新：{formatDate(analysis.updatedAt)}</p>
        </div>

        <Link
          className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs text-slate-200 hover:bg-white/10"
          href={`/radars/${analysis.radarId}/workspace`}
        >
          查看相关分析
        </Link>
      </div>
    </article>
  );
}

function DailyReportCard({ report }: { report: DailyReport }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/15 p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatReportStatus(report.status)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatDate(report.reportDate || report.createdAt)}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white">{report.title}</h3>

      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">
        {report.summary || "暂无日报摘要"}
      </p>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <p className="text-slate-500">所属 Radar：{report.radar.name}</p>

        <Link
          className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs text-slate-200 hover:bg-white/10"
          href={`/radars/${report.radarId}/daily-reports/${report.id}`}
        >
          查看日报
        </Link>
      </div>
    </article>
  );
}

function RadarWorkspaceCard({ radar }: { radar: RadarCard }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatRadarStatus(radar.status)}
        </span>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
          {formatScanIntensity(radar.scanIntensity)}
        </span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
          {radar.isActive ? "已启用" : "已停用"}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white">{radar.name}</h3>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
        {radar.description || "暂无 Radar 描述"}
      </p>

      <div className="mt-5 grid gap-3 text-sm text-slate-400">
        <p>
          <span className="text-slate-500">业务领域：</span>
          {radar.businessDomain || "未配置"}
        </p>
        <p>
          <span className="text-slate-500">关注问题：</span>
          {radar.focusQuestion || "未配置"}
        </p>
        <p>
          <span className="text-slate-500">上次扫描：</span>
          {formatDate(radar.lastScannedAt)}
        </p>
        <p>
          <span className="text-slate-500">下次扫描：</span>
          {formatDate(radar.nextScanAt)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2">
        <CountBox label="情报" value={radar._count.intelligenceItems} />
        <CountBox label="分析" value={radar._count.technologyAnalyses} />
        <CountBox label="推荐" value={radar._count.recommendations} />
        <CountBox label="PoC" value={radar._count.pocs} />
        <CountBox label="日报" value={radar._count.dailyReports} />
      </div>

      <Link
        className="mt-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-300/20"
        href={`/radars/${radar.id}/workspace`}
      >
        进入 Workspace
      </Link>
    </article>
  );
}

function TopConnectedTechnologyCard({
  technology,
}: {
  technology: TopConnectedTechnology;
}) {
  return (
    <article className="rounded-3xl border border-violet-300/15 bg-violet-300/[0.05] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{technology.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {technology.category ?? "未分类"}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 px-4 py-3 text-center">
          <p className="text-xs text-violet-100/80">连接度</p>
          <p className="text-2xl font-semibold text-white">
            {technology.connectedCount}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        所属 Radar：{technology.radar.name}
      </p>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
        {technology.description || "暂无技术说明。"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
          入向 {technology.incomingCount}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
          出向 {technology.outgoingCount}
        </span>
      </div>
    </article>
  );
}

function CountBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [data, recentDecisions] = await Promise.all([
    getDashboardDecisionData(),
    getRecentDecisionsForDashboard(6),
  ]);

  const decisionSnapshot = [
    {
      label: "Radar 总数",
      value: data.radarOverview.radarTotal,
    },
    {
      label: "高价值分析",
      value: data.analysisOverview.highStrategicValueAnalysisTotal,
    },
    {
      label: "进行中 PoC",
      value: data.pocOverview.inProgressPocTotal,
    },
  ];

  return (
    <RadarAppShell activeKey="dashboard">
      <main className="space-y-10">
        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300/80">
              AI Technology Decision Cockpit
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              AI 技术决策驾驶舱
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
              围绕技术分析、推荐动作与 PoC
              验证，持续判断哪些 AI 技术真正值得投入资源。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                技术分析
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
                快速验证
              </span>
              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm text-violet-100">
                技术图谱
              </span>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
                决策记忆
              </span>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <p className="text-sm font-medium text-cyan-100">
              Decision Snapshot
            </p>
            <div className="mt-6 space-y-4">
              {decisionSnapshot.map((item) => (
                <div
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                  key={item.label}
                >
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-2xl font-semibold text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="space-y-5">
          <SectionHeader
            eyebrow="Overview"
            title="核心指标总览"
            description="用真实数据库数据展示 Radar、技术分析、推荐动作与 PoC 的整体状态。"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Radar 总数"
              value={data.radarOverview.radarTotal}
              description="当前正在维护的业务场景观察器数量。"
            />
            <MetricCard
              label="启用 Radar"
              value={data.radarOverview.activeRadarTotal}
              description="仍在持续跟踪的 Radar 数量。"
            />
            <MetricCard
              label="高强度跟踪"
              value={data.radarOverview.highIntensityRadarTotal}
              description="扫描强度为 HIGH 的重点跟踪 Radar。"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="技术分析总数"
              value={data.analysisOverview.analysisTotal}
              description="已沉淀的 TechnologyAnalysis 数量。"
            />
            <MetricCard
              label="高 Strategic Value"
              value={data.analysisOverview.highStrategicValueAnalysisTotal}
              description="strategicValueScore 大于等于 4 的高价值分析。"
            />
            <MetricCard
              label="待审核分析"
              value={data.analysisOverview.pendingReviewAnalysisTotal}
              description="状态为 GENERATED 或 REVIEWED 的分析。"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="建议 PoC"
              value={
                data.recommendationOverview.validateByPocRecommendationTotal
              }
              description="推荐动作 actionType 为 VALIDATE_BY_POC。"
            />
            <MetricCard
              label="持续观察"
              value={data.recommendationOverview.watchRecommendationTotal}
              description="推荐动作 actionType 为 WATCH。"
            />
            <MetricCard
              label="暂不推荐"
              value={
                data.recommendationOverview.rejectForNowRecommendationTotal
              }
              description="推荐动作 actionType 为 REJECT_FOR_NOW。"
            />
            <MetricCard
              label="需要更多信息"
              value={
                data.recommendationOverview.needMoreInfoRecommendationTotal
              }
              description="推荐动作 actionType 为 NEED_MORE_INFO。"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="计划中 PoC"
              value={data.pocOverview.plannedPocTotal}
              description="PoC 状态为 PLANNED。"
            />
            <MetricCard
              label="进行中 PoC"
              value={data.pocOverview.inProgressPocTotal}
              description="PoC 状态为 IN_PROGRESS。"
            />
            <MetricCard
              label="已完成 PoC"
              value={data.pocOverview.donePocTotal}
              description="PoC 状态为 DONE。"
            />
            <MetricCard
              label="已取消 PoC"
              value={data.pocOverview.cancelledPocTotal}
              description="PoC 状态为 CANCELLED。"
            />
          </div>
        </section>

        <DecisionHistory
          decisions={recentDecisions}
          title="Recent Decisions"
          emptyText="当前暂无近期技术决策。"
          showRadar
        />

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <SectionHeader
              eyebrow="High Value"
              title="最近高价值技术"
              description="优先查看 Strategic Value 较高、值得进入决策讨论或 PoC 验证的技术分析。"
            />

            {data.recentHighValueAnalyses.length === 0 ? (
              <EmptyState text="暂无高价值技术分析。" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.recentHighValueAnalyses.map((analysis: HighValueAnalysis) => (
                  <HighValueAnalysisCard
                    analysis={analysis}
                    key={analysis.id}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <SectionHeader
              eyebrow="Risk"
              title="最近风险提醒"
              description="基于 adoptionRiskScore 较高的技术分析生成风险关注入口。"
            />

            {data.recentRiskAnalyses.length === 0 ? (
              <EmptyState text="暂无高风险技术提醒。" />
            ) : (
              <div className="space-y-4">
                {data.recentRiskAnalyses.map((analysis: RiskAnalysis) => (
                  <RiskAnalysisCard analysis={analysis} key={analysis.id} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeader
            eyebrow="Technology Graph"
            title="Top Connected Technologies"
            description="按技术节点的入向关系与出向关系数量计算连接度，展示当前数据库中关系最密集的技术。"
          />

          {data.topConnectedTechnologies.length === 0 ? (
            <EmptyState text="暂无技术图谱数据。完成 Technology Graph seed 后会在这里显示连接度最高的技术。" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.topConnectedTechnologies.map(
                (technology: TopConnectedTechnology) => (
                <TopConnectedTechnologyCard
                  key={technology.id}
                  technology={technology}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <SectionHeader
            eyebrow="Reports"
            title="最近日报入口"
            description="查看最近生成的日报，快速回顾技术判断、推荐动作与后续关注重点。"
          />

          {data.recentDailyReports.length === 0 ? (
            <EmptyState text="暂无日报沉淀。" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {data.recentDailyReports.map((report: DailyReport) => (
                <DailyReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <SectionHeader
            eyebrow="Radars"
            title="Radar 工作区"
            description="每个 Radar 代表一个业务场景观察器，可进入 Workspace 查看情报、分析、推荐动作、PoC 与日报。"
          />

          {data.radars.length === 0 ? (
            <EmptyState text="暂无 Radar。请先通过 seed 或后续创建流程添加 Radar 数据。" />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {data.radars.map((radar: RadarCard) => (
                <RadarWorkspaceCard key={radar.id} radar={radar} />
              ))}
            </div>
          )}
        </section>
      </main>
    </RadarAppShell>
  );
}