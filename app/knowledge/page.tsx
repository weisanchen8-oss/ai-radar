/**
 * 文件作用：
 * Knowledge Center 列表页。
 * 负责读取真实 Prisma 数据，并把数据交给独立 UI 组件展示。
 */

import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { KnowledgeCenterView } from "@/components/knowledge/knowledge-center-view";
import { getKnowledgeCenterData } from "@/lib/data/knowledge";

type KnowledgePageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    tag?: string;
  }>;
};

export const dynamic = "force-dynamic";

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
      <KnowledgeCenterView data={data} hasActiveFilter={hasActiveFilter} />
    </RadarAppShell>
  );
}