import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getRadarPocListData } from "@/lib/data/radar-pocs";
import { createPocFromRecommendationAction } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "暂无记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(value);
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
    return "暂无结论";
  }

  const map: Record<string, string> = {
    SUCCESS: "成功",
    PARTIAL: "部分成立",
    FAILED: "失败",
    INCONCLUSIVE: "结论不明确",
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

function formatPriority(value: string | null) {
  if (!value) {
    return "未设置";
  }

  const map: Record<string, string> = {
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高",
    CRITICAL: "关键",
  };

  return map[value] ?? value;
}

function getStatusTone(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-cyan-300/30 bg-cyan-300/15 text-cyan-100";
    case "DONE":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
    case "CANCELLED":
      return "border-slate-300/20 bg-slate-300/10 text-slate-200";
    default:
      return "border-indigo-300/30 bg-indigo-300/15 text-indigo-100";
  }
}

export default async function RadarPocListPage({
  params,
  searchParams,
}: {
  params: Promise<{ radarId: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { radarId } = await params;
  const { action } = await searchParams;

  const data = await getRadarPocListData(radarId);

  if (!data) {
    notFound();
  }

  const { radar, pocs, recommendations } = data;

  const plannedCount = pocs.filter((item) => item.status === "PLANNED").length;
  const runningCount = pocs.filter(
    (item) => item.status === "IN_PROGRESS",
  ).length;
  const doneCount = pocs.filter((item) => item.status === "DONE").length;
  const cancelledCount = pocs.filter(
    (item) => item.status === "CANCELLED",
  ).length;

  return (
    <RadarAppShell activeKey="workspace">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/radars/${radar.id}/workspace`}
              className="text-sm text-slate-300 hover:text-white"
            >
              ← 返回 Radar Workspace
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-cyan-200">
              PoC Validation
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {radar.name} · PoC 验证
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              第一版只做验证记录和管理，不做自动 Benchmark、自动部署或自动实验。
            </p>
          </div>

          <Link
            href={`/radars/${radar.id}/pocs/new`}
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 hover:bg-cyan-200"
          >
            新建 PoC
          </Link>
        </div>

        {action ? (
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            操作已完成：{action}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["计划中", plannedCount, "等待排期"],
            ["验证中", runningCount, "正在推进"],
            ["已完成", doneCount, "形成结论"],
            ["已取消", cancelledCount, "终止验证"],
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">PoC 列表</h2>
              <p className="mt-1 text-sm text-slate-400">
                记录每一次技术验证的目标、状态、结论和沉淀结果。
              </p>
            </div>
          </div>

          {pocs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-6 text-sm text-slate-400">
              当前 Radar 暂无 PoC。可以从下方 Recommendation 快速创建，也可以手动新建。
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {pocs.map((poc) => (
                <Link
                  key={poc.id}
                  href={`/radars/${radar.id}/pocs/${poc.id}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/20 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {poc.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {poc.objective || "暂无验证目标"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${getStatusTone(
                        poc.status,
                      )}`}
                    >
                      {formatPocStatus(poc.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-3">
                    <div>
                      <span className="text-slate-500">验证结论：</span>
                      {formatPocOutcome(poc.outcome)}
                    </div>
                    <div>
                      <span className="text-slate-500">关联推荐：</span>
                      {poc.recommendation.title}
                    </div>
                    <div>
                      <span className="text-slate-500">更新时间：</span>
                      {formatDate(poc.updatedAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">
            从 Recommendation 创建 PoC
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            推荐动作不只是展示结论，而是可以直接转入验证记录。
          </p>

          {recommendations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-6 text-sm text-slate-400">
              当前暂无 Recommendation，暂时无法从推荐创建 PoC。
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/20 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                          {formatRecommendationAction(
                            recommendation.actionType,
                          )}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          优先级：{formatPriority(recommendation.priority)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-white">
                        {recommendation.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {recommendation.summary || recommendation.rationale}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <form action={createPocFromRecommendationAction}>
                        <input type="hidden" name="radarId" value={radar.id} />
                        <input
                          type="hidden"
                          name="recommendationId"
                          value={recommendation.id}
                        />
                        <button
                          type="submit"
                          className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-300/20"
                        >
                          快速创建 PoC
                        </button>
                      </form>

                      <Link
                        href={`/radars/${radar.id}/pocs/new?recommendationId=${recommendation.id}`}
                        className="rounded-xl border border-white/10 px-4 py-2 text-center text-sm text-slate-300 hover:bg-white/10"
                      >
                        填写详细 PoC
                      </Link>
                    </div>
                  </div>

                  {recommendation.pocs.length > 0 ? (
                    <p className="mt-4 text-xs text-slate-500">
                      已有关联 PoC：{recommendation.pocs.length} 个
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </RadarAppShell>
  );
}