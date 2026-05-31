import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionHistory } from "@/components/radar/decision-history";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import {
  getHistoricalDecisionsForTechnology,
  syncRadarDecisionTimeline,
} from "@/lib/data/radar-memory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "暂无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(value);
}

export default async function TechnologyDetailPage({
  params,
}: {
  params: Promise<{
    radarId: string;
    itemId: string;
  }>;
}) {
  const { radarId, itemId } = await params;

  await syncRadarDecisionTimeline(radarId);

  const item = await prisma.intelligenceItem.findFirst({
    where: {
      id: itemId,
      radarId,
    },
    include: {
      radar: {
        select: {
          id: true,
          name: true,
        },
      },
      analysisSourceRefs: {
        include: {
          analysis: {
            include: {
              recommendations: {
                include: {
                  pocs: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  const technologyName = item.technologyName || item.title;
  const historicalDecisions = await getHistoricalDecisionsForTechnology({
    radarId,
    technologyName,
  });

  const analyses = item.analysisSourceRefs.map((ref) => ref.analysis);
  const recommendations = analyses.flatMap((analysis) => analysis.recommendations);
  const pocs = recommendations.flatMap((recommendation) => recommendation.pocs);

  return (
    <RadarAppShell activeKey="workspace">
      <div className="space-y-6">
        <Link
          className="text-sm text-slate-300 hover:text-white"
          href={`/radars/${radarId}/workspace`}
        >
          ← 返回 Workspace
        </Link>

        <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-8 shadow-2xl shadow-black/30">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
            Technology Detail
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {technologyName}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            {item.summary || "暂无技术摘要。"}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Meta label="所属 Radar" value={item.radar.name} />
            <Meta label="来源" value={item.sourceName || item.sourceType} />
            <Meta label="捕获时间" value={formatDate(item.capturedAt || item.createdAt)} />
          </div>

          <a
            className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            href={item.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            查看来源 →
          </a>
        </header>

        <DecisionHistory
          decisions={historicalDecisions}
          title="Historical Decisions"
          emptyText="当前技术暂无历史决策记录。"
        />

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold text-white">Related Analysis</h2>
          <div className="mt-4 space-y-4">
            {analyses.length === 0 ? (
              <Empty text="当前技术暂无关联分析。" />
            ) : (
              analyses.map((analysis) => (
                <article
                  className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  key={analysis.id}
                >
                  <h3 className="font-semibold text-white">{analysis.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {analysis.executiveSummary}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    结论：{analysis.conclusion || "暂无结论"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold text-white">Recommendations & PoC</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <h3 className="font-semibold text-white">推荐动作</h3>
              {recommendations.length === 0 ? (
                <Empty text="暂无推荐动作。" />
              ) : (
                <div className="mt-3 space-y-3">
                  {recommendations.map((recommendation) => (
                    <div
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                      key={recommendation.id}
                    >
                      <p className="text-sm font-medium text-white">
                        {recommendation.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {recommendation.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <h3 className="font-semibold text-white">PoC 验证</h3>
              {pocs.length === 0 ? (
                <Empty text="暂无 PoC。" />
              ) : (
                <div className="mt-3 space-y-3">
                  {pocs.map((poc) => (
                    <div
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                      key={poc.id}
                    >
                      <p className="text-sm font-medium text-white">{poc.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {poc.objective}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </RadarAppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-4 text-sm text-slate-400">
      {text}
    </p>
  );
}