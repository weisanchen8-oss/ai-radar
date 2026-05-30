import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getRadarPocCreateData } from "@/lib/data/radar-pocs";
import { createPocAction } from "../actions";

export const dynamic = "force-dynamic";

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

export default async function NewRadarPocPage({
  params,
  searchParams,
}: {
  params: Promise<{ radarId: string }>;
  searchParams: Promise<{ recommendationId?: string }>;
}) {
  const { radarId } = await params;
  const { recommendationId } = await searchParams;

  const data = await getRadarPocCreateData(radarId);

  if (!data) {
    notFound();
  }

  const { radar, recommendations } = data;
  const selectedRecommendation =
    recommendations.find((item) => item.id === recommendationId) ??
    recommendations[0];

  return (
    <RadarAppShell activeKey="workspace">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <div>
          <Link
            href={`/radars/${radar.id}/pocs`}
            className="text-sm text-slate-300 hover:text-white"
          >
            ← 返回 PoC 列表
          </Link>
          <p className="mt-4 text-sm uppercase tracking-[0.24em] text-cyan-200">
            Create PoC
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            新建 PoC 验证
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            PoC 第一版只记录验证目标、假设、成功标准、计划和风险，不执行自动实验。
          </p>
        </div>

        {recommendations.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.06] p-6 text-sm text-slate-400">
            当前 Radar 暂无 Recommendation。由于当前数据库模型中 PoC 必须关联
            Recommendation，请先生成或创建推荐动作，再创建 PoC。
          </section>
        ) : (
          <form
            action={createPocAction}
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/20"
          >
            <input type="hidden" name="radarId" value={radar.id} />

            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  关联 Recommendation
                </span>
                <select
                  name="recommendationId"
                  defaultValue={selectedRecommendation?.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  required
                >
                  {recommendations.map((recommendation) => (
                    <option key={recommendation.id} value={recommendation.id}>
                      {recommendation.title} ·{" "}
                      {formatRecommendationAction(recommendation.actionType)} ·
                      优先级 {formatPriority(recommendation.priority)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedRecommendation ? (
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">
                  <p className="font-medium">当前推荐参考</p>
                  <p className="mt-2 text-cyan-100/85">
                    {selectedRecommendation.summary ||
                      selectedRecommendation.rationale}
                  </p>
                </div>
              ) : null}

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  PoC 标题
                </span>
                <input
                  name="title"
                  defaultValue={
                    selectedRecommendation
                      ? `PoC：${selectedRecommendation.title}`
                      : ""
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  验证目标
                </span>
                <textarea
                  name="objective"
                  rows={3}
                  defaultValue={
                    selectedRecommendation?.summary ||
                    "验证该推荐技术是否适合当前 Radar 业务场景。"
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  验证假设
                </span>
                <textarea
                  name="hypothesis"
                  rows={3}
                  defaultValue={
                    selectedRecommendation?.rationale ||
                    "如果该技术具备业务匹配度和工程可行性，则能在最小验证中体现明确收益。"
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  成功标准
                </span>
                <textarea
                  name="successCriteria"
                  rows={3}
                  defaultValue={
                    selectedRecommendation?.expectedOutcome ||
                    "完成最小 Demo 或验证记录，并明确效果、成本、接入难度和主要风险。"
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  验证计划
                </span>
                <textarea
                  name="plan"
                  rows={5}
                  defaultValue={
                    "1. 明确验证场景；\n2. 准备最小测试数据；\n3. 完成最小验证记录；\n4. 记录问题、指标和结论。"
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  主要风险
                </span>
                <textarea
                  name="risks"
                  rows={3}
                  defaultValue={selectedRecommendation?.riskNote || ""}
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
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">
                    Demo URL
                  </span>
                  <input
                    name="demoUrl"
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">
                    交付物 URL
                  </span>
                  <input
                    name="artifactUrl"
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Link
                  href={`/radars/${radar.id}/pocs`}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-white/10"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  创建 PoC
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </RadarAppShell>
  );
}