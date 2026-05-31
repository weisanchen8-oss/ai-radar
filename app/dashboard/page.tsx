/**
 * 文件作用：
 * 定义 AI Radar Dashboard 首页。
 * 当前页面定位为 AI 技术分析与验证平台的决策驾驶舱，
 * 展示 Radar、技术分析、推荐动作、PoC、风险提醒与日报入口。
 */

import Link from "next/link";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getDashboardDecisionData } from "@/lib/data/dashboard";

type DashboardData = Awaited<ReturnType<typeof getDashboardDecisionData>>;
type RadarCard = DashboardData["radars"][number];
type HighValueAnalysis = DashboardData["recentHighValueAnalyses"][number];
type RiskAnalysis = DashboardData["recentRiskAnalyses"][number];
type DailyReport = DashboardData["recentDailyReports"][number];
type TopConnectedTechnology = DashboardData["topConnectedTechnologies"][number];

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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
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
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
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
    <article className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
          高战略价值
        </span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatAnalysisStatus(analysis.status)}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-6 text-white">
        {analysis.title}
      </h3>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
        {summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ScorePill label="战略价值" value={analysis.strategicValueScore} />
        <ScorePill label="业务相关" value={analysis.businessRelevanceScore} />
        <ScorePill
          label="工程成熟"
          value={analysis.engineeringReadinessScore}
        />
        <ScorePill label="采用风险" value={analysis.adoptionRiskScore} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>所属 Radar：{analysis.radar.name}</span>
        <span>更新：{formatDate(analysis.updatedAt)}</span>
      </div>

      <Link
        href={`/radars/${analysis.radar.id}/workspace`}
        className="mt-4 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
      >
        进入 Workspace →
      </Link>
    </article>
  );
}

function RiskAnalysisCard({ analysis }: { analysis: RiskAnalysis }) {
  return (
    <article className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
          风险提醒
        </span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          采用风险：{analysis.adoptionRiskScore}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-6 text-white">
        {analysis.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {analysis.risk ||
          "该技术采用风险较高，建议在 PoC 前补充验证风险点。"}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>所属 Radar：{analysis.radar.name}</span>
        <span>更新：{formatDate(analysis.updatedAt)}</span>
      </div>

      <Link
        href={`/radars/${analysis.radar.id}/workspace`}
        className="mt-4 inline-flex text-sm font-medium text-amber-200 hover:text-amber-100"
      >
        查看相关分析 →
      </Link>
    </article>
  );
}

function DailyReportCard({ report }: { report: DailyReport }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
          {formatReportStatus(report.status)}
        </span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatDate(report.reportDate || report.createdAt)}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-6 text-white">
        {report.title}
      </h3>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
        {report.summary || "暂无日报摘要"}
      </p>

      <p className="mt-4 text-xs text-slate-500">
        所属 Radar：{report.radar.name}
      </p>

      <Link
        href={`/radars/${report.radar.id}/daily-reports`}
        className="mt-4 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
      >
        查看日报 →
      </Link>
    </article>
  );
}

function RadarWorkspaceCard({ radar }: { radar: RadarCard }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            {formatRadarStatus(radar.status)}
          </span>
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
            {formatScanIntensity(radar.scanIntensity)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              radar.isActive
                ? "bg-emerald-400/10 text-emerald-200"
                : "bg-slate-400/10 text-slate-300"
            }`}
          >
            {radar.isActive ? "已启用" : "已停用"}
          </span>
        </div>
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">{radar.name}</h3>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
        {radar.description || "暂无 Radar 描述"}
      </p>

      <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
        <div>
          <span className="text-slate-500">业务领域：</span>
          {radar.businessDomain || "未配置"}
        </div>
        <div>
          <span className="text-slate-500">关注问题：</span>
          {radar.focusQuestion || "未配置"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2 text-center">
        <CountBox label="情报" value={radar._count.intelligenceItems} />
        <CountBox label="分析" value={radar._count.technologyAnalyses} />
        <CountBox label="推荐" value={radar._count.recommendations} />
        <CountBox label="PoC" value={radar._count.pocs} />
        <CountBox label="日报" value={radar._count.dailyReports} />
      </div>

      <div className="mt-5 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        <p>上次扫描：{formatDate(radar.lastScannedAt)}</p>
        <p>下次扫描：{formatDate(radar.nextScanAt)}</p>
      </div>

      <Link
        href={`/radars/${radar.id}/workspace`}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
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
    <Link
      href={`/radars/${technology.radar.id}/workspace`}
      className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-100">
            {technology.name}
          </h3>
          <p className="mt-1 text-xs text-cyan-200/80">
            {technology.category ?? "未分类"}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-right">
          <p className="text-xs text-cyan-100/80">连接度</p>
          <p className="text-xl font-semibold text-cyan-100">
            {technology.connectedCount}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-300">
        所属 Radar：{technology.radar.name}
      </p>

      {technology.description ? (
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {technology.description}
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">暂无技术说明。</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
          入向 {technology.incomingCount}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
          出向 {technology.outgoingCount}
        </span>
      </div>
    </Link>
  );
}

function CountBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3">
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardDecisionData();

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
            </div>
          </div>

          <aside className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <p className="text-sm font-medium text-cyan-100">
              Decision Snapshot
            </p>
            <div className="mt-6 space-y-4">
              {decisionSnapshot.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
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
            title="核心决策指标"
            description="从 Radar 覆盖、技术分析、推荐动作与 PoC 进展四个维度观察当前技术决策状态。"
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
                data.recommendationOverview
                  .validateByPocRecommendationTotal
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
                {data.recentHighValueAnalyses.map((analysis) => (
                  <HighValueAnalysisCard
                    key={analysis.id}
                    analysis={analysis}
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
                {data.recentRiskAnalyses.map((analysis) => (
                  <RiskAnalysisCard key={analysis.id} analysis={analysis} />
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
              {data.topConnectedTechnologies.map((technology) => (
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
              {data.recentDailyReports.map((report) => (
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
              {data.radars.map((radar) => (
                <RadarWorkspaceCard key={radar.id} radar={radar} />
              ))}
            </div>
          )}
        </section>
      </main>
    </RadarAppShell>
  );
}