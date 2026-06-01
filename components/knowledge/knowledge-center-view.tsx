/**
 * 文件作用：
 * Knowledge Center 页面 UI 组件。
 * 只负责页面展示、筛选表单、文章卡片和创建入口样式。
 * 数据读取仍由 app/knowledge/page.tsx 完成。
 */

import Link from "next/link";
import type { getKnowledgeCenterData } from "@/lib/data/knowledge";
import {
  createKnowledgeArticleFromAnalysisAction,
  createKnowledgeArticleFromPocAction,
} from "@/app/knowledge/actions";

type KnowledgeData = Awaited<ReturnType<typeof getKnowledgeCenterData>>;
type KnowledgeArticle = KnowledgeData["articles"][number];
type SourceAnalysis = KnowledgeData["sourceAnalyses"][number];
type SourcePoc = KnowledgeData["sourcePocs"][number];

type KnowledgeCenterViewProps = {
  data: KnowledgeData;
  hasActiveFilter: boolean;
};

const pageSection =
  "rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-8";
const softSection =
  "rounded-[2rem] border border-gray-200 bg-[#F8F8F4] p-6 shadow-sm";
const cardBase =
  "rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";
const compactCard =
  "rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";
const inputBase =
  "h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#3E8257]/50 focus:ring-4 focus:ring-[#3E8257]/10";
const buttonPrimary =
  "inline-flex items-center justify-center rounded-2xl border border-[#3E8257] bg-[#3E8257] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4E8F38] hover:shadow-md";
const buttonSecondary =
  "inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3E8257]/30 hover:bg-[#3E8257]/5 hover:text-[#3E8257] hover:shadow-md";

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
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 shadow-sm">
      <p className="text-base font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
    </div>
  );
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "yellow" | "gray";
}) {
  const className =
    tone === "green"
      ? "border-[#3E8257]/20 bg-[#3E8257]/10 text-[#3E8257]"
      : tone === "yellow"
        ? "border-[#FFC64A]/40 bg-[#FFC64A]/20 text-gray-900"
        : tone === "gray"
          ? "border-gray-200 bg-gray-100 text-gray-600"
          : "border-gray-200 bg-white text-gray-600";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function ArticleCard({ article }: { article: KnowledgeArticle }) {
  return (
    <article className={cardBase}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={article.status === "PUBLISHED" ? "green" : "yellow"}>
          {formatArticleStatus(article.status)}
        </Pill>

        {article.category ? <Pill>{article.category}</Pill> : null}

        {article.sourceAnalysisId ? <Pill tone="green">来自技术分析</Pill> : null}

        {article.sourcePocId ? <Pill tone="yellow">来自 PoC</Pill> : null}
      </div>

      <h2 className="mt-5 text-lg font-semibold leading-7 text-gray-950">
        {article.title}
      </h2>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
        {article.summary || "暂无文章摘要。"}
      </p>

      {article.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {article.tags.slice(0, 6).map((tag) => (
            <Link
              key={tag}
              href={buildKnowledgeHref({ tag })}
              className="rounded-full border border-gray-200 bg-[#F8F8F4] px-3 py-1 text-xs text-gray-600 transition hover:border-[#3E8257]/30 hover:bg-[#3E8257]/5 hover:text-[#3E8257]"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <span>所属 Radar：{article.radar?.name || "未关联"}</span>
        <span>更新：{formatDate(article.updatedAt)}</span>
      </div>

      <Link href={`/knowledge/${article.slug}`} className={`mt-5 ${buttonSecondary}`}>
        阅读文章 →
      </Link>
    </article>
  );
}

function SourceAnalysisCard({ analysis }: { analysis: SourceAnalysis }) {
  return (
    <article className={compactCard}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="green">技术分析</Pill>
        <Pill tone="gray">{formatAnalysisStatus(analysis.status)}</Pill>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-6 text-gray-950">
        {analysis.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
        {analysis.executiveSummary || "暂无摘要。"}
      </p>

      <p className="mt-4 text-xs text-gray-500">
        所属 Radar：{analysis.radar.name}
      </p>

      <form action={createKnowledgeArticleFromAnalysisAction} className="mt-4">
        <input type="hidden" name="analysisId" value={analysis.id} />
        <button type="submit" className={`w-full ${buttonPrimary}`}>
          创建知识文章
        </button>
      </form>
    </article>
  );
}

function SourcePocCard({ poc }: { poc: SourcePoc }) {
  return (
    <article className={compactCard}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="yellow">PoC 验证</Pill>
        <Pill tone="gray">{formatPocStatus(poc.status)}</Pill>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-6 text-gray-950">
        {poc.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
        {poc.objective || "暂无验证目标。"}
      </p>

      <p className="mt-4 text-xs text-gray-500">所属 Radar：{poc.radar.name}</p>

      <form action={createKnowledgeArticleFromPocAction} className="mt-4">
        <input type="hidden" name="pocId" value={poc.id} />
        <button type="submit" className={`w-full ${buttonPrimary}`}>
          创建知识文章
        </button>
      </form>
    </article>
  );
}

function SourcePanel({
  title,
  description,
  emptyText,
  children,
}: {
  title: string;
  description: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className={softSection}>
      <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>

      <div className="mt-5 space-y-4">
        {children || (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}

export function KnowledgeCenterView({
  data,
  hasActiveFilter,
}: KnowledgeCenterViewProps) {
  return (
    <main className="space-y-10">
      <section className="rounded-[2rem] border border-gray-200 bg-[#F8F8F4] p-8 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#3E8257]">
          Knowledge Center
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
          技术知识中心
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-gray-600">
          将技术分析和 PoC 验证结果沉淀为可检索、可复盘、可持续积累的知识文章。
        </p>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-6">
          <div className={pageSection}>
            <form className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
              <input
                name="q"
                defaultValue={data.filters.q || ""}
                placeholder="搜索标题、摘要或正文"
                className={inputBase}
              />

              <select
                name="category"
                defaultValue={data.filters.category || ""}
                className={inputBase}
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
                className={inputBase}
              >
                <option value="">全部标签</option>
                {data.tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              <button type="submit" className={buttonPrimary}>
                筛选
              </button>
            </form>

            {hasActiveFilter ? (
              <Link href="/knowledge" className={`mt-4 ${buttonSecondary}`}>
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
          <SourcePanel
            title="从技术分析创建"
            description="将已有 TechnologyAnalysis 沉淀为草稿知识文章。"
            emptyText="暂无可创建的技术分析。"
          >
            {data.sourceAnalyses.length === 0
              ? null
              : data.sourceAnalyses.map((analysis) => (
                  <SourceAnalysisCard key={analysis.id} analysis={analysis} />
                ))}
          </SourcePanel>

          <SourcePanel
            title="从 PoC 创建"
            description="将已有 PoC 验证结果沉淀为草稿知识文章。"
            emptyText="暂无可创建的 PoC。"
          >
            {data.sourcePocs.length === 0
              ? null
              : data.sourcePocs.map((poc) => (
                  <SourcePocCard key={poc.id} poc={poc} />
                ))}
          </SourcePanel>
        </aside>
      </section>
    </main>
  );
}