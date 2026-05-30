import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getRadarDailyReportDetailData } from "@/lib/data/radar-daily-reports";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined, withTime = false) {
  if (!value) {
    return "暂无记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short", hour12: false } : {}),
  }).format(value);
}

function formatReportStatus(value: string) {
  const map: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
  };

  return map[value] ?? value;
}

function formatRecommendationAction(value: string) {
  const map: Record<string, string> = {
    WATCH: "持续观察",
    VALIDATE_BY_POC: "建议 PoC",
    ADOPT_INCREMENTALLY: "逐步采用",
    REJECT_FOR_NOW: "暂不推荐",
    NEED_MORE_INFO: "需要更多信息",
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

function ReportTextBlock({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {content || "暂无内容"}
      </p>
    </section>
  );
}

export default async function RadarDailyReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ radarId: string; reportId: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { radarId, reportId } = await params;
  const { action } = await searchParams;

  const data = await getRadarDailyReportDetailData(radarId, reportId);

  if (!data) {
    notFound();
  }

  const { report, intelligenceItems, analyses, recommendations, pocs } = data;

  return (
    <RadarAppShell activeKey="workspace">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={`/radars/${report.radar.id}/daily-reports`}
              className="text-sm text-slate-300 hover:text-white"
            >
              ← 返回日报列表
            </Link>

            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-cyan-200">
              Daily Report Detail
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-white">
              {report.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                {formatDate(report.reportDate)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                {formatReportStatus(report.status)}
              </span>
            </div>
          </div>

          <Link
            href={`/radars/${report.radar.id}/workspace`}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            查看 Workspace
          </Link>
        </div>

        {action ? (
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            操作已完成：{action}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["新增情报", report.newIntelligenceCount, "Intelligence"],
            ["更新分析", report.newAnalysisCount, "Analysis"],
            ["更新推荐", report.newRecommendationCount, "Recommendation"],
            ["活跃 PoC", report.activePocCount, "PoC"],
          ].map(([label, value, hint]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/20"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">Radar 上下文</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <p className="text-sm text-slate-500">业务领域</p>
              <p className="mt-2 text-sm text-slate-200">
                {report.radar.businessDomain || "未配置"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <p className="text-sm text-slate-500">关注问题</p>
              <p className="mt-2 text-sm text-slate-200">
                {report.radar.focusQuestion || "未配置"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 md:col-span-2">
              <p className="text-sm text-slate-500">观察范围</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {report.radar.observationScope || "未配置"}
              </p>
            </div>
          </div>
        </section>

        <ReportTextBlock title="日报摘要" content={report.summary} />
        <ReportTextBlock title="重点内容" content={report.highlights} />
        <ReportTextBlock title="推荐与决策" content={report.decisions} />
        <ReportTextBlock title="风险提示" content={report.risks} />
        <ReportTextBlock title="下一步动作" content={report.nextActions} />

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">引用内容明细</h2>
          <p className="mt-1 text-sm text-slate-400">
            下方展示该日报日期范围内关联的情报、分析、推荐和 PoC，便于回溯日报来源。
          </p>

          <div className="mt-6 grid gap-5">
            <div>
              <h3 className="text-base font-semibold text-white">情报</h3>
              {intelligenceItems.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">暂无当日新增情报。</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {intelligenceItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                    >
                      <h4 className="text-sm font-semibold text-white">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {item.summary || "暂无摘要"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">技术分析</h3>
              {analyses.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">暂无当日更新分析。</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {analyses.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                    >
                      <h4 className="text-sm font-semibold text-white">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {item.executiveSummary || item.conclusion || "暂无摘要"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">推荐动作</h3>
              {recommendations.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">暂无当日更新推荐。</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {recommendations.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                    >
                      <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                        {formatRecommendationAction(item.actionType)}
                      </span>
                      <h4 className="mt-2 text-sm font-semibold text-white">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {item.summary || item.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">PoC</h3>
              {pocs.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">暂无当日更新 PoC。</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {pocs.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                    >
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                        {formatPocStatus(item.status)}
                      </span>
                      <h4 className="mt-2 text-sm font-semibold text-white">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {item.objective}
                      </p>
                      {item.findings ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          发现：{item.findings}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </RadarAppShell>
  );
}