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

function getGroupTone(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-cyan-300/20 bg-cyan-300/10";
    case "DONE":
      return "border-emerald-300/20 bg-emerald-300/10";
    case "CANCELLED":
      return "border-slate-300/15 bg-slate-300/5";
    default:
      return "border-indigo-300/20 bg-indigo-300/10";
  }
}

function TextBlock({
  title,
  text,
}: {
  title: string;
  text: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
        {text || "暂无记录"}
      </p>
    </div>
  );
}

function PocCard({
  radarId,
  poc,
}: {
  radarId: string;
  poc: {
    id: string;
    title: string;
    status: string;
    objective: string;
    hypothesis: string;
    successCriteria: string;
    risks: string | null;
    outcome: string | null;
    findings: string | null;
    recommendationBack: string | null;
    updatedAt: Date;
    recommendation: {
      id: string;
      title: string;
      actionType: string;
      status: string;
      priority: string | null;
    };
  };
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/20 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs ${getStatusTone(
                poc.status,
              )}`}
            >
              {formatPocStatus(poc.status)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              结论：{formatPocOutcome(poc.outcome)}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">
            {poc.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            关联推荐：{poc.recommendation.title}
          </p>
        </div>

        <Link
          href={`/radars/${radarId}/pocs/${poc.id}`}
          className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-300/20"
        >
          查看详情
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextBlock title="验证目标" text={poc.objective} />
        <TextBlock title="验证假设" text={poc.hypothesis} />
        <TextBlock title="成功标准" text={poc.successCriteria} />
        <TextBlock title="主要风险" text={poc.risks} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextBlock title="发现与证据" text={poc.findings} />
        <TextBlock title="回写建议" text={poc.recommendationBack} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-500">
        <span>更新时间：{formatDate(poc.updatedAt)}</span>
        <span>
          推荐动作：{formatRecommendationAction(poc.recommendation.actionType)}
        </span>
      </div>
    </article>
  );
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

  const groups = [
    {
      status: "PLANNED",
      label: "Planned / 计划中",
      desc: "已经确定验证方向，但尚未开始执行。",
    },
    {
      status: "IN_PROGRESS",
      label: "In Progress / 验证中",
      desc: "正在推进验证，需要持续记录发现和风险。",
    },
    {
      status: "DONE",
      label: "Done / 已完成",
      desc: "已经形成验证结论，可用于后续技术沉淀。",
    },
    {
      status: "CANCELLED",
      label: "Cancelled / 已取消",
      desc: "验证已终止，需要保留取消原因和风险判断。",
    },
  ];

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
              Rapid Validation
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {radar.name} · PoC 验证闭环
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              将 Recommendation 转化为可追踪的验证记录，沉淀验证目标、假设、成功标准、风险、发现和最终结论。
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
            ["计划中", plannedCount, "Planned"],
            ["验证中", runningCount, "In Progress"],
            ["已完成", doneCount, "Done"],
            ["已取消", cancelledCount, "Cancelled"],
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                PoC 状态看板
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                按 planned / in_progress / done / cancelled 分组查看验证进展。
              </p>
            </div>
          </div>

          {pocs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-6 text-sm text-slate-400">
              当前 Radar 暂无 PoC。可以从下方 Recommendation 快速创建，也可以手动新建。
            </div>
          ) : (
            <div className="mt-6 grid gap-6">
              {groups.map((group) => {
                const groupPocs = pocs.filter(
                  (poc) => poc.status === group.status,
                );

                return (
                  <section
                    key={group.status}
                    className={`rounded-3xl border p-5 ${getGroupTone(
                      group.status,
                    )}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {group.label}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {group.desc}
                        </p>
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {groupPocs.length} 个
                      </span>
                    </div>

                    {groupPocs.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-5 text-sm text-slate-500">
                        当前分组暂无 PoC。
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-4">
                        {groupPocs.map((poc) => (
                          <PocCard key={poc.id} radarId={radar.id} poc={poc} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">
            从 Recommendation 创建 PoC
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            推荐动作不只是展示结论，而是可以直接进入验证记录。
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
                          状态：{recommendation.status}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          优先级：{formatPriority(recommendation.priority)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-white">
                        {recommendation.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {recommendation.summary ||
                          recommendation.rationale ||
                          "暂无推荐摘要"}
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