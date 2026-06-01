import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { prisma } from "@/lib/prisma";
import {
  acceptRecommendationAction,
  completeRecommendationAction,
  rejectRecommendationAction,
} from "./actions";

export const dynamic = "force-dynamic";

type RecommendationListItem = NonNullable<
  Awaited<ReturnType<typeof getRecommendationPageData>>
>["recommendations"][number];

function formatActionType(value: string) {
  const map: Record<string, string> = {
    WATCH: "持续观察",
    VALIDATE_BY_POC: "建议 PoC",
    ADOPT_INCREMENTALLY: "逐步采用",
    REJECT_FOR_NOW: "暂不推荐",
    NEED_MORE_INFO: "需要更多信息",
  };

  return map[value] ?? value;
}

function formatStatus(value: string) {
  const map: Record<string, string> = {
    OPEN: "待处理",
    ACCEPTED: "已接受",
    REJECTED: "已拒绝",
    DONE: "已完成",
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

function statusTone(value: string) {
  switch (value) {
    case "OPEN":
      return "border-amber-300/30 bg-amber-300/10 text-amber-100";
    case "ACCEPTED":
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
    case "DONE":
      return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
    case "REJECTED":
      return "border-rose-300/30 bg-rose-300/10 text-rose-100";
    case "VALIDATE_BY_POC":
      return "border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
    case "ADOPT_INCREMENTALLY":
      return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
    case "WATCH":
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
    case "REJECT_FOR_NOW":
      return "border-rose-300/30 bg-rose-300/10 text-rose-100";
    case "NEED_MORE_INFO":
      return "border-violet-300/30 bg-violet-300/10 text-violet-100";
    default:
      return "border-white/15 bg-white/10 text-slate-200";
  }
}

function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

function TextPanel({
  title,
  text,
}: {
  title: string;
  text?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-200">
        {text || "暂无内容。"}
      </p>
    </div>
  );
}

function FormButton({
  action,
  radarId,
  itemId,
  children,
  variant = "default",
}: {
  action: (formData: FormData) => void | Promise<void>;
  radarId: string;
  itemId: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger";
}) {
  const className =
    variant === "primary"
      ? "rounded-full border border-emerald-300/40 bg-emerald-300/15 px-4 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/25"
      : variant === "danger"
        ? "rounded-full border border-rose-300/40 bg-rose-300/15 px-4 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-300/25"
        : "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10";

  return (
    <form action={action}>
      <input type="hidden" name="radarId" value={radarId} />
      <input type="hidden" name="itemId" value={itemId} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

async function getRecommendationPageData(radarId: string) {
  const radar = await prisma.radar.findUnique({
    where: {
      id: radarId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
    },
  });

  if (!radar) {
    return null;
  }

  const recommendations = await prisma.recommendation.findMany({
    where: {
      radarId,
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      summary: true,
      rationale: true,
      expectedOutcome: true,
      riskNote: true,
      actionType: true,
      status: true,
      priority: true,
      dueDate: true,
      decisionMemo: true,
      createdAt: true,
      updatedAt: true,
      analysis: {
        select: {
          id: true,
          title: true,
          executiveSummary: true,
          conclusion: true,
        },
      },
      pocs: {
        select: {
          id: true,
          title: true,
          status: true,
          outcome: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  return {
    radar,
    recommendations,
  };
}

function RecommendationCard({
  radarId,
  recommendation,
}: {
  radarId: string;
  recommendation: RecommendationListItem;
}) {
  const hasPoc = recommendation.pocs.length > 0;

  return (
    <article className="rounded-3xl border border-white/10 bg-black/15 p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        <Pill tone={statusTone(recommendation.actionType)}>
          {formatActionType(recommendation.actionType)}
        </Pill>
        <Pill tone={statusTone(recommendation.status)}>
          {formatStatus(recommendation.status)}
        </Pill>
        <Pill tone={statusTone("default")}>
          优先级 {formatPriority(recommendation.priority)}
        </Pill>
        {hasPoc ? (
          <Pill tone="border-violet-300/30 bg-violet-300/10 text-violet-100">
            已关联 PoC
          </Pill>
        ) : null}
      </div>

      <h2 className="text-xl font-semibold text-white">
        {recommendation.title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        {recommendation.summary || "暂无推荐摘要。"}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <TextPanel title="推荐理由" text={recommendation.rationale} />
        <TextPanel title="预期结果" text={recommendation.expectedOutcome} />
        <TextPanel title="风险提示" text={recommendation.riskNote} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          Source Analysis
        </p>
        <p className="mt-2 text-sm font-medium text-white">
          {recommendation.analysis.title}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
          {recommendation.analysis.executiveSummary ||
            recommendation.analysis.conclusion ||
            "暂无分析摘要。"}
        </p>
      </div>

      {hasPoc ? (
        <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-200">
            Linked PoC
          </p>
          <div className="mt-3 grid gap-3">
            {recommendation.pocs.map((poc) => (
              <Link
                className="rounded-2xl border border-white/10 bg-black/15 p-4 transition hover:bg-white/[0.08]"
                href={`/radars/${radarId}/pocs/${poc.id}`}
                key={poc.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">
                    {poc.title}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                    {poc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        {recommendation.status === "OPEN" ? (
          <>
            <FormButton
              action={acceptRecommendationAction}
              radarId={radarId}
              itemId={recommendation.id}
              variant="primary"
            >
              接受
            </FormButton>

            <FormButton
              action={rejectRecommendationAction}
              radarId={radarId}
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
            radarId={radarId}
            itemId={recommendation.id}
            variant="primary"
          >
            标记完成
          </FormButton>
        ) : null}

        {recommendation.status !== "REJECTED" &&
        recommendation.status !== "DONE" ? (
          <Link
            className="rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/25"
            href={`/radars/${radarId}/pocs/new?recommendationId=${recommendation.id}`}
          >
            创建 PoC
          </Link>
        ) : null}

        <Link
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
          href={`/radars/${radarId}/workspace`}
        >
          返回 Workspace
        </Link>
      </div>
    </article>
  );
}

export default async function RadarRecommendationsPage({
  params,
}: {
  params: Promise<{ radarId: string }>;
}) {
  const { radarId } = await params;
  const data = await getRecommendationPageData(radarId);

  if (!data) {
    notFound();
  }

  const { radar, recommendations } = data;

  return (
    <RadarAppShell activeKey="workspace">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href={`/radars/${radar.id}/workspace`}
              className="text-sm text-slate-300 hover:text-white"
            >
              ← 返回 Workspace
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-cyan-200">
              Recommendation Workflow
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Recommendation 决策工作流
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              当前页面用于处理推荐动作的接受、拒绝、创建 PoC 与完成闭环，不执行自动 Benchmark 或自动实验。
            </p>
          </div>

          <Link
            className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-300/20"
            href={`/radars/${radar.id}/pocs/new`}
          >
            新建 PoC
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Current Radar
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{radar.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {radar.description}
          </p>
        </section>

        {recommendations.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-sm text-slate-400">
            当前 Radar 暂无 Recommendation。
          </section>
        ) : (
          <div className="grid gap-5">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                radarId={radar.id}
                recommendation={recommendation}
              />
            ))}
          </div>
        )}
      </main>
    </RadarAppShell>
  );
}