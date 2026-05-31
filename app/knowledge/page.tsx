/**
 * 文件作用：
 * Knowledge Center 列表页。
 * 当前阶段支持知识文章列表、搜索、分类过滤、标签过滤，
 * 并支持从 TechnologyAnalysis / PoC 创建草稿知识文章。
 */

import Link from "next/link";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getKnowledgeCenterData } from "@/lib/data/knowledge";
import {
  createKnowledgeArticleFromAnalysisAction,
  createKnowledgeArticleFromPocAction,
} from "@/app/knowledge/actions";

type KnowledgePageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    tag?: string;
  }>;
};

type KnowledgeData = Awaited<ReturnType<typeof getKnowledgeCenterData>>;
type KnowledgeArticle = KnowledgeData["articles"][number];
type SourceAnalysis = KnowledgeData["sourceAnalyses"][number];
type SourcePoc = KnowledgeData["sourcePocs"][number];

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

function formatArticleStatus(status: string) {
  const statusMap: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
    ARCHIVED: "已归档",
  };

  return statusMap[status] ?? status;
}

function formatAnalysisStatus(status: string) {
  const statusMap: Record<string, string> = {
    DRAFT: "草稿",
    GENERATED: "已生成",
    REVIEWED: "已复核",
    APPROVED: "已通过",
    SUPERSEDED: "已替代",
  };

  return statusMap[status] ?? status;
}

function formatPocStatus(status: string) {
  const statusMap: Record<string, string> = {
    PLANNED: "计划中",
    IN_PROGRESS: "进行中",
    DONE: "已完成",
    CANCELLED: "已取消",
  };

  return statusMap[status] ?? status;
}

function buildKnowledgeHref(params: {
  q?: string;
  category?: string;
  tag?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.tag) {
    searchParams.set("tag", params.tag);
  }

  const query = searchParams.toString();

  return query ? `/knowledge?${query}` : "/knowledge";
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function ArticleCard({ article }: { article: KnowledgeArticle }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/[0.06]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
          {formatArticleStatus(article.status)}
        </span>

        {article.category ? (
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
            {article.category}
          </span>
        ) : null}

        {article.sourceAnalysisId ? (
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            来自技术分析
          </span>
        ) : null}

        {article.sourcePocId ? (
          <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs text-violet-200">
            来自 PoC
          </span>
        ) : null}
      </div>

      <h2 className="mt-5 text-lg font-semibold leading-7 text-white">
        {article.title}
      </h2>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
        {article.summary || "暂无文章摘要。"}
      </p>

      {article.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {article.tags.slice(0, 6).map((tag) => (
            <Link
              key={tag}
              href={buildKnowledgeHref({ tag })}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>所属 Radar：{article.radar?.name || "未关联"}</span>
        <span>更新：{formatDate(article.updatedAt)}</span>
      </div>

      <Link
        href={`/knowledge/${article.slug}`}
        className="mt-5 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
      >
        阅读文章 →
      </Link>
    </article>
  );
}

function SourceAnalysisCard({ analysis }: { analysis: SourceAnalysis }) {
  return (
    <article className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
          技术分析
        </span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatAnalysisStatus(analysis.status)}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold leading-6 text-white">
        {analysis.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
        {analysis.executiveSummary || "暂无摘要。"}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        所属 Radar：{analysis.radar.name}
      </p>

      <form action={createKnowledgeArticleFromAnalysisAction} className="mt-4">
        <input type="hidden" name="analysisId" value={analysis.id} />
        <button
          type="submit"
          className="w-full rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
        >
          创建知识文章
        </button>
      </form>
    </article>
  );
}

function SourcePocCard({ poc }: { poc: SourcePoc }) {
  return (
    <article className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.05] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
          PoC 验证
        </span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
          {formatPocStatus(poc.status)}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold leading-6 text-white">
        {poc.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
        {poc.objective || "暂无验证目标。"}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        所属 Radar：{poc.radar.name}
      </p>

      <form action={createKnowledgeArticleFromPocAction} className="mt-4">
        <input type="hidden" name="pocId" value={poc.id} />
        <button
          type="submit"
          className="w-full rounded-2xl bg-violet-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-200"
        >
          创建知识文章
        </button>
      </form>
    </article>
  );
}

export default async function KnowledgePage({
  searchParams,
}: KnowledgePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getKnowledgeCenterData({
    q: resolvedSearchParams.q,
    category: resolvedSearchParams.category,
    tag: resolvedSearchParams.tag,
  });

  const hasActiveFilter = Boolean(
    data.filters.q || data.filters.category || data.filters.tag
  );

  return (
    <RadarAppShell activeKey="knowledge">
      <main className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300/80">
            Knowledge Center
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            技术知识中心
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            将技术分析和 PoC
            验证结果沉淀为可检索、可复盘、可持续积累的知识文章。
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <form className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
                <input
                  name="q"
                  defaultValue={data.filters.q || ""}
                  placeholder="搜索标题、摘要或正文"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
                />

                <select
                  name="category"
                  defaultValue={data.filters.category || ""}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                >
                  <option value="">全部分类</option>
                  {data.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  name="tag"
                  defaultValue={data.filters.tag || ""}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                >
                  <option value="">全部标签</option>
                  {data.tags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  筛选
                </button>
              </form>

              {hasActiveFilter ? (
                <Link
                  href="/knowledge"
                  className="mt-4 inline-flex text-sm text-slate-400 hover:text-cyan-100"
                >
                  清除筛选
                </Link>
              ) : null}
            </div>

            {data.articles.length === 0 ? (
              <EmptyState
                title="暂无知识文章"
                text="当前筛选条件下暂无文章。你可以先从右侧技术分析或 PoC 验证结果创建草稿知识文章。"
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {data.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold text-white">
                从技术分析创建
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                将已有 TechnologyAnalysis 沉淀为草稿知识文章。
              </p>

              <div className="mt-5 space-y-4">
                {data.sourceAnalyses.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    暂无可创建的技术分析。
                  </p>
                ) : (
                  data.sourceAnalyses.map((analysis) => (
                    <SourceAnalysisCard key={analysis.id} analysis={analysis} />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold text-white">
                从 PoC 创建
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                将已有 PoC 验证结果沉淀为草稿知识文章。
              </p>

              <div className="mt-5 space-y-4">
                {data.sourcePocs.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    暂无可创建的 PoC。
                  </p>
                ) : (
                  data.sourcePocs.map((poc) => (
                    <SourcePocCard key={poc.id} poc={poc} />
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </RadarAppShell>
  );
}