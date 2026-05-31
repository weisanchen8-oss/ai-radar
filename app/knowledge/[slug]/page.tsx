/**
 * 文件作用：
 * Knowledge Center 文章详情页。
 * 当前阶段展示知识文章正文、分类、标签、来源和关联 Radar。
 */

import Link from "next/link";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { getKnowledgeArticleBySlug } from "@/lib/data/knowledge";

type KnowledgeArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

export default async function KnowledgeArticlePage({
  params,
}: KnowledgeArticlePageProps) {
  const { slug } = await params;
  const article = await getKnowledgeArticleBySlug(slug);

  return (
    <RadarAppShell activeKey="knowledge">
      <main className="space-y-6">
        <Link
          href="/knowledge"
          className="inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
        >
          ← 返回 Knowledge Center
        </Link>

        <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              {formatArticleStatus(article.status)}
            </span>

            {article.category ? (
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                {article.category}
              </span>
            ) : null}

            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
              创建：{formatDate(article.createdAt)}
            </span>

            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
              更新：{formatDate(article.updatedAt)}
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {article.title}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            {article.summary || "暂无文章摘要。"}
          </p>

          {article.tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/knowledge?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs text-slate-500">关联 Radar</p>
              <p className="mt-2 text-sm font-medium text-white">
                {article.radar?.name || "未关联"}
              </p>
              {article.radar ? (
                <Link
                  href={`/radars/${article.radar.id}/workspace`}
                  className="mt-3 inline-flex text-xs text-cyan-200 hover:text-cyan-100"
                >
                  进入 Workspace →
                </Link>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs text-slate-500">来源分析</p>
              <p className="mt-2 text-sm font-medium text-white">
                {article.sourceAnalysis?.title || "无"}
              </p>
              {article.sourceAnalysis ? (
                <Link
                  href={`/radars/${article.sourceAnalysis.radarId}/workspace`}
                  className="mt-3 inline-flex text-xs text-cyan-200 hover:text-cyan-100"
                >
                  查看来源 →
                </Link>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs text-slate-500">来源 PoC</p>
              <p className="mt-2 text-sm font-medium text-white">
                {article.sourcePoc?.title || "无"}
              </p>
              {article.sourcePoc ? (
                <Link
                  href={`/radars/${article.sourcePoc.radarId}/workspace`}
                  className="mt-3 inline-flex text-xs text-cyan-200 hover:text-cyan-100"
                >
                  查看来源 →
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap break-words bg-transparent p-0 font-sans text-sm leading-7 text-slate-300">
                {article.content}
              </pre>
            </div>
          </div>
        </article>
      </main>
    </RadarAppShell>
  );
}