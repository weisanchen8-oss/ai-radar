import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import {
  formatReportDateInputValue,
  getRadarDailyReportListData,
} from "@/lib/data/radar-daily-reports";
import { generateDailyReportAction } from "./actions";

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

function getTodayInputValue() {
  return formatReportDateInputValue(new Date());
}

export default async function RadarDailyReportListPage({
  params,
  searchParams,
}: {
  params: Promise<{ radarId: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { radarId } = await params;
  const { action } = await searchParams;

  const data = await getRadarDailyReportListData(radarId);

  if (!data) {
    notFound();
  }

  const { radar, reports, latestAnalyses, latestRecommendations, activePocs } =
    data;

  return (
    <RadarAppShell activeKey="workspace">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={`/radars/${radar.id}/workspace`}
              className="text-sm text-slate-300 hover:text-white"
            >
              ← 返回 Radar Workspace
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-cyan-200">
              Daily Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {radar.name} · 日报
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              日报用于把 Radar、技术分析、推荐动作和 PoC 验证记录整理成每日沉淀。
              第一版只做手动生成和记录管理，不做自动定时任务。
            </p>
          </div>
        </div>

        {action ? (
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            操作已完成：{action}
          </div>
        ) : null}

        <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-xl shadow-slate-950/20">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="text-xl font-semibold text-white">手动生成日报</h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/85">
                选择日期后，系统会汇总该日期内新增或更新的情报、分析、推荐和
                PoC；如果当天没有更新，会引用最近的分析、推荐和活跃 PoC 作为背景沉淀。
              </p>
            </div>

            <form
              action={generateDailyReportAction}
              className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
            >
              <input type="hidden" name="radarId" value={radar.id} />

              <label className="grid gap-2">
                <span className="text-sm font-medium text-cyan-50">
                  报告日期
                </span>
                <input
                  type="date"
                  name="reportDate"
                  defaultValue={getTodayInputValue()}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  required
                />
              </label>

              <button
                type="submit"
                className="mt-4 w-full rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
              >
                生成日报
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["日报总数", reports.length, "DailyReport"],
            ["最近分析", latestAnalyses.length, "Analysis"],
            ["最近推荐", latestRecommendations.length, "Recommendation"],
            ["活跃 PoC", activePocs.length, "PoC"],
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
          <h2 className="text-xl font-semibold text-white">日报列表</h2>
          <p className="mt-1 text-sm text-slate-400">
            每份日报会保留生成时的摘要、重点分析、推荐动作、风险和下一步计划。
          </p>

          {reports.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-6 text-sm text-slate-400">
              当前暂无日报。请先在上方选择日期并点击“生成日报”。
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/radars/${radar.id}/daily-reports/${report.id}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/20 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                        {formatDate(report.reportDate)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {report.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {report.summary}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {formatReportStatus(report.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-4">
                    <div>情报：{report.newIntelligenceCount}</div>
                    <div>分析：{report.newAnalysisCount}</div>
                    <div>推荐：{report.newRecommendationCount}</div>
                    <div>活跃 PoC：{report.activePocCount}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-lg font-semibold text-white">最近分析</h2>
            <div className="mt-4 grid gap-3">
              {latestAnalyses.length === 0 ? (
                <p className="text-sm text-slate-500">暂无分析记录。</p>
              ) : (
                latestAnalyses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                  >
                    <h3 className="text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                      {item.executiveSummary || item.conclusion || "暂无摘要"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-lg font-semibold text-white">最近推荐</h2>
            <div className="mt-4 grid gap-3">
              {latestRecommendations.length === 0 ? (
                <p className="text-sm text-slate-500">暂无推荐记录。</p>
              ) : (
                latestRecommendations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                  >
                    <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                      {formatRecommendationAction(item.actionType)}
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                      {item.summary || item.rationale}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-lg font-semibold text-white">活跃 PoC</h2>
            <div className="mt-4 grid gap-3">
              {activePocs.length === 0 ? (
                <p className="text-sm text-slate-500">暂无活跃 PoC。</p>
              ) : (
                activePocs.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                  >
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                      {formatPocStatus(item.status)}
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                      {item.objective}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </RadarAppShell>
  );
}