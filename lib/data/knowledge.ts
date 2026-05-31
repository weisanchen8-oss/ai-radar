/**
 * 文件作用：
 * 读取 Knowledge Center 页面所需的数据。
 * 包括知识文章列表、详情、分类、标签，以及可沉淀为知识文章的来源数据。
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type KnowledgeListSearchParams = {
  q?: string;
  category?: string;
  tag?: string;
};

function getKnowledgeWhere(params: KnowledgeListSearchParams) {
  const q = params.q?.trim();
  const category = params.category?.trim();
  const tag = params.tag?.trim();

  return {
    ...(q
      ? {
          OR: [
            {
              title: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              summary: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              content: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(category
      ? {
          category,
        }
      : {}),
    ...(tag
      ? {
          tags: {
            has: tag,
          },
        }
      : {}),
  };
}

export async function getKnowledgeCenterData(
  params: KnowledgeListSearchParams
) {
  const where = getKnowledgeWhere(params);

  const [articles, allCategories, allArticlesForTags, sourceAnalyses, sourcePocs] =
    await prisma.$transaction([
      prisma.knowledgeArticle.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          category: true,
          tags: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          radar: {
            select: {
              id: true,
              name: true,
            },
          },
          sourceAnalysisId: true,
          sourcePocId: true,
        },
      }),
      prisma.knowledgeArticle.findMany({
        where: {
          category: {
            not: null,
          },
        },
        distinct: ["category"],
        orderBy: {
          category: "asc",
        },
        select: {
          category: true,
        },
      }),
      prisma.knowledgeArticle.findMany({
        select: {
          tags: true,
        },
      }),
      prisma.technologyAnalysis.findMany({
        where: {
          knowledgeArticles: {
            none: {},
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          executiveSummary: true,
          updatedAt: true,
          radar: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.poC.findMany({
        where: {
          knowledgeArticles: {
            none: {},
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          objective: true,
          updatedAt: true,
          radar: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

  const categories = allCategories
    .map((item) => item.category)
    .filter((item): item is string => Boolean(item));

  const tags = Array.from(
    new Set(allArticlesForTags.flatMap((article) => article.tags))
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));

  return {
    articles,
    categories,
    tags,
    sourceAnalyses,
    sourcePocs,
    filters: params,
  };
}

export async function getKnowledgeArticleBySlug(slug: string) {
  const decodedSlug = decodeURIComponent(slug);
  const article = await prisma.knowledgeArticle.findFirst({
    where: {
      slug: decodedSlug,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      content: true,
      category: true,
      tags: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      radar: {
        select: {
          id: true,
          name: true,
        },
      },
      sourceAnalysis: {
        select: {
          id: true,
          title: true,
          radarId: true,
        },
      },
      sourcePoc: {
        select: {
          id: true,
          title: true,
          radarId: true,
        },
      },
    },
  });

  if (!article) {
    notFound();
  }

  return article;
}