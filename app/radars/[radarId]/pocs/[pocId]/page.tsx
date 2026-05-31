import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getRadarPocDetailData } from "@/lib/data/radar-pocs";
import { updatePocAction } from "../actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "暂无记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(value);
}

function formatDateInputValue(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
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

function ExternalLink({
  label,
  href,
}: {
  label: string;
  href: string | null;
}) {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-300/10"
    >
      {label}
    </a>
  );
}

export default async function RadarPocDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ radarId: string; pocId: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { radarId, pocId } = await params;
  const { action } = await searchParams;

  const poc = await getRadarPocDetailData(radarId, pocId);

  if (!poc) {
    notFound();
  }

  return (
    <RadarAppShell activeKey="workspace">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={`/radars/${poc.radar.id}/pocs`}
              className="text-sm text-slate-300 hover:text-white"
            >
              ← 返回 PoC 列表
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-cyan-200">
              PoC Detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {poc.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
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
          </div>

          <Link
            href={`/radars/${poc.radar.id}/workspace`}
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

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">验证记录</h2>

            <div className="mt-5 grid gap-5">
              <div>
                <p className="text-sm text-slate-500">验证目标</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {poc.objective}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">验证假设</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {poc.hypothesis}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">成功标准</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {poc.successCriteria}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">验证计划</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {poc.plan || "暂无验证计划"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">发现与证据</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {poc.findings || "暂无发现记录"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">回写建议</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {poc.recommendationBack || "暂无回写建议"}
                </p>
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
              <h2 className="text-lg font-semibold text-white">关联推荐</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  {formatRecommendationAction(poc.recommendation.actionType)}
                </span>
                <h3 className="mt-3 text-base font-semibold text-white">
                  {poc.recommendation.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {poc.recommendation.summary ||
                    poc.recommendation.rationale ||
                    "暂无推荐摘要"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
              <h2 className="text-lg font-semibold text-white">时间与产物</h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <p>创建时间：{formatDate(poc.createdAt)}</p>
                <p>更新时间：{formatDate(poc.updatedAt)}</p>
                <p>开始日期：{formatDate(poc.startDate)}</p>
                <p>结束日期：{formatDate(poc.endDate)}</p>
                <p>
                  投入小时数：
                  {poc.timeSpentHours ? poc.timeSpentHours.toString() : "未记录"}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <ExternalLink label="代码仓库" href={poc.repoUrl} />
                <ExternalLink label="Demo" href={poc.demoUrl} />
                <ExternalLink label="交付物" href={poc.artifactUrl} />
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">更新状态与结论</h2>
          <p className="mt-1 text-sm text-slate-400">
            这里用于手动沉淀验证结果，不触发自动实验。
          </p>

          <form action={updatePocAction} className="mt-6 grid gap-5">
            <input type="hidden" name="radarId" value={poc.radar.id} />
            <input type="hidden" name="pocId" value={poc.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  状态
                </span>
                <select
                  name="status"
                  defaultValue={poc.status}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                >
                  <option value="PLANNED">计划中</option>
                  <option value="IN_PROGRESS">验证中</option>
                  <option value="DONE">已完成</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  验证结论
                </span>
                <select
                  name="outcome"
                  defaultValue={poc.outcome ?? ""}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                >
                  <option value="">暂无结论</option>
                  <option value="SUCCESS">成功</option>
                  <option value="PARTIAL">部分成立</option>
                  <option value="FAILED">失败</option>
                  <option value="INCONCLUSIVE">结论不明确</option>
                </select>
              </label>
            </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  发现与证据
                </span>
                <textarea
                  name="findings"
                  rows={5}
                  defaultValue={poc.findings ?? ""}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  风险记录
                </span>
                <textarea
                  name="risks"
                  rows={4}
                  defaultValue={poc.risks ?? ""}
                  placeholder="记录验证过程中发现的工程风险、成本风险、数据风险或落地风险。"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50"
                />
              </label>
            
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  回写建议
                </span>
                <textarea
                  name="recommendationBack"
                  rows={4}
                  defaultValue={poc.recommendationBack ?? ""}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50"
                />
              </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  开始日期
                </span>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={formatDateInputValue(poc.startDate)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  结束日期
                </span>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={formatDateInputValue(poc.endDate)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  投入小时数
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name="timeSpentHours"
                  defaultValue={
                    poc.timeSpentHours ? poc.timeSpentHours.toString() : ""
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  代码仓库 URL
                </span>
                <input
                  name="repoUrl"
                  defaultValue={poc.repoUrl ?? ""}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Demo URL
                </span>
                <input
                  name="demoUrl"
                  defaultValue={poc.demoUrl ?? ""}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  交付物 URL
                </span>
                <input
                  name="artifactUrl"
                  defaultValue={poc.artifactUrl ?? ""}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
              >
                保存更新
              </button>
            </div>
          </form>
        </section>
      </main>
    </RadarAppShell>
  );
}