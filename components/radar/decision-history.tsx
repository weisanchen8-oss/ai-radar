/**
 * 文件作用：
 * 展示 Radar Memory 中的技术决策历史。
 *
 * 当前兼容：
 * - 旧版 DecisionType：ANALYZED / RECOMMENDED / REJECTED / VALIDATED / INTEGRATED / ARCHIVED
 * - 新版 Recommendation 工作流事件：RECOMMENDATION_ACCEPTED / RECOMMENDATION_REJECTED / RECOMMENDATION_DONE 等
 */

import Link from "next/link";
import type { DecisionTimeline, DecisionType, PocStatus } from "@prisma/client";

type DecisionDisplayType =
  | DecisionType
  | "RECOMMENDATION_OPENED"
  | "RECOMMENDATION_ACCEPTED"
  | "RECOMMENDATION_REJECTED"
  | "RECOMMENDATION_POC_CREATED"
  | "RECOMMENDATION_DONE"
  | "POC_STARTED"
  | "POC_DONE"
  | "NOTE";

type DecisionWithSource = DecisionTimeline & {
  decisionType?: DecisionType | null;
  type?: DecisionType | null;
  eventType?: DecisionDisplayType | null;
  technologyName?: string | null;
  summary?: string | null;
  reason?: string | null;
  title?: string | null;
  description?: string | null;
  sourceAnalysis?: {
    id: string;
    title: string;
  } | null;
  sourcePoc?: {
    id: string;
    title: string;
    status: PocStatus;
  } | null;
  radar?: {
    id: string;
    name: string;
  } | null;
};

type DecisionHistoryProps = {
  decisions: DecisionWithSource[];
  title?: string;
  emptyText?: string;
  showRadar?: boolean;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(value);
}

function getDecisionTypeValue(decision: DecisionWithSource): DecisionDisplayType {
  return decision.decisionType ?? decision.type ?? decision.eventType ?? "NOTE";
}

function formatDecisionType(value: DecisionDisplayType) {
  const map: Partial<Record<DecisionDisplayType, string>> = {
    ANALYZED: "已分析",
    RECOMMENDED: "已推荐",
    REJECTED: "已拒绝",
    VALIDATED: "已验证",
    INTEGRATED: "已集成",
    ARCHIVED: "已归档",

    RECOMMENDATION_OPENED: "推荐已创建",
    RECOMMENDATION_ACCEPTED: "推荐已接受",
    RECOMMENDATION_REJECTED: "推荐已拒绝",
    RECOMMENDATION_POC_CREATED: "已创建 PoC",
    RECOMMENDATION_DONE: "推荐已完成",
    POC_STARTED: "PoC 已开始",
    POC_DONE: "PoC 已完成",
    NOTE: "记录",
  };

  return map[value] ?? value;
}

function decisionTone(value: DecisionDisplayType) {
  switch (value) {
    case "VALIDATED":
    case "INTEGRATED":
    case "RECOMMENDATION_ACCEPTED":
    case "RECOMMENDATION_DONE":
    case "POC_DONE":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";

    case "RECOMMENDED":
    case "ANALYZED":
    case "RECOMMENDATION_OPENED":
      return "border-cyan-300/30 bg-cyan-300/15 text-cyan-100";

    case "RECOMMENDATION_POC_CREATED":
    case "POC_STARTED":
      return "border-indigo-300/30 bg-indigo-300/15 text-indigo-100";

    case "REJECTED":
    case "RECOMMENDATION_REJECTED":
    case "ARCHIVED":
      return "border-rose-300/30 bg-rose-300/15 text-rose-100";

    case "NOTE":
    default:
      return "border-white/15 bg-white/10 text-slate-100";
  }
}

function getDecisionTitle(decision: DecisionWithSource) {
  return (
    decision.summary ??
    decision.title ??
    formatDecisionType(getDecisionTypeValue(decision))
  );
}

function getDecisionDescription(decision: DecisionWithSource) {
  return decision.reason ?? decision.description ?? "暂无决策说明。";
}

function getTechnologyName(decision: DecisionWithSource) {
  return decision.technologyName ?? "Decision";
}

export function DecisionHistory({
  decisions,
  title = "Decision History",
  emptyText = "当前暂无技术决策记录。",
  showRadar = false,
}: DecisionHistoryProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
          Radar Memory
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          记录什么时候、为什么、做出了什么技术判断，方便未来复盘和引用历史结论。
        </p>
      </div>

      {decisions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((decision) => {
            const decisionType = getDecisionTypeValue(decision);

            return (
              <article
                className="rounded-2xl border border-white/10 bg-black/15 p-4"
                key={decision.id}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${decisionTone(
                          decisionType,
                        )}`}
                      >
                        {formatDecisionType(decisionType)}
                      </span>

                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-200">
                        {getTechnologyName(decision)}
                      </span>

                      {showRadar && decision.radar ? (
                        <Link
                          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                          href={`/radars/${decision.radar.id}/workspace`}
                        >
                          {decision.radar.name}
                        </Link>
                      ) : null}
                    </div>

                    <h3 className="text-sm font-semibold text-white">
                      {getDecisionTitle(decision)}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {getDecisionDescription(decision)}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    {formatDate(decision.createdAt)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {decision.sourceAnalysis ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
                      Analysis：{decision.sourceAnalysis.title}
                    </span>
                  ) : null}

                  {decision.sourcePoc ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
                      PoC：{decision.sourcePoc.title}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}