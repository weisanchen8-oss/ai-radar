/**
 * 文件作用：
 * 定义 Knowledge Center 的服务端写入动作。
 * 当前阶段支持从 TechnologyAnalysis 和 PoC 创建知识文章，
 * 不接入 AI 自动写作，不接入向量数据库。
 */

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function normalizeSlug(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || `knowledge-${Date.now()}`;
}

async function getUniqueSlug(ownerId: string, title: string) {
  const baseSlug = normalizeSlug(title);
  let slug = baseSlug;
  let index = 1;

  while (true) {
    const existing = await prisma.knowledgeArticle.findUnique({
      where: {
        ownerId_slug: {
          ownerId,
          slug,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return slug;
    }

    index += 1;
    slug = `${baseSlug}-${index}`;
  }
}

function formatAnalysisContent(analysis: {
  title: string;
  executiveSummary: string;
  opportunity: string | null;
  risk: string | null;
  adoptionSignals: string | null;
  uncertainties: string | null;
  conclusion: string | null;
  sourceTrustScore: number;
  technicalValueScore: number;
  engineeringReadinessScore: number;
  businessRelevanceScore: number;
  adoptionRiskScore: number;
  strategicValueScore: number;
  communityHeatScore: number;
}) {
  return [
    `# ${analysis.title}`,
    "",
    "## 执行摘要",
    analysis.executiveSummary,
    "",
    "## 机会",
    analysis.opportunity || "暂无机会描述。",
    "",
    "## 风险",
    analysis.risk || "暂无风险描述。",
    "",
    "## 采用信号",
    analysis.adoptionSignals || "暂无采用信号。",
    "",
    "## 不确定性",
    analysis.uncertainties || "暂无不确定性描述。",
    "",
    "## 结论",
    analysis.conclusion || "暂无结论。",
    "",
    "## TERA 评分",
    `- 来源可信度：${analysis.sourceTrustScore}`,
    `- 技术价值：${analysis.technicalValueScore}`,
    `- 工程成熟度：${analysis.engineeringReadinessScore}`,
    `- 业务相关性：${analysis.businessRelevanceScore}`,
    `- 采用风险：${analysis.adoptionRiskScore}`,
    `- 战略价值：${analysis.strategicValueScore}`,
    `- 社区热度：${analysis.communityHeatScore}`,
  ].join("\n");
}

function formatPocContent(poc: {
  title: string;
  objective: string;
  hypothesis: string;
  successCriteria: string;
  outcome: string | null;
  plan: string | null;
  findings: string | null;
  risks: string | null;
  recommendationBack: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  artifactUrl: string | null;
}) {
  return [
    `# ${poc.title}`,
    "",
    "## 验证目标",
    poc.objective,
    "",
    "## 验证假设",
    poc.hypothesis,
    "",
    "## 成功标准",
    poc.successCriteria,
    "",
    "## 验证计划",
    poc.plan || "暂无验证计划。",
    "",
    "## 验证结论",
    poc.outcome || "暂无验证结论。",
    "",
    "## 关键发现",
    poc.findings || "暂无关键发现。",
    "",
    "## 风险记录",
    poc.risks || "暂无风险记录。",
    "",
    "## 反向建议",
    poc.recommendationBack || "暂无反向建议。",
    "",
    "## 相关链接",
    `- 代码仓库：${poc.repoUrl || "暂无"}`,
    `- Demo：${poc.demoUrl || "暂无"}`,
    `- 交付物：${poc.artifactUrl || "暂无"}`,
  ].join("\n");
}

export async function createKnowledgeArticleFromAnalysisAction(
  formData: FormData
) {
  const analysisId = String(formData.get("analysisId") || "");

  if (!analysisId) {
    redirect("/knowledge");
  }

  const existing = await prisma.knowledgeArticle.findUnique({
    where: {
      sourceAnalysisId: analysisId,
    },
    select: {
      slug: true,
    },
  });

  if (existing) {
    redirect(`/knowledge/${existing.slug}`);
  }

  const analysis = await prisma.technologyAnalysis.findUnique({
    where: {
      id: analysisId,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      organizationId: true,
      visibility: true,
      title: true,
      status: true,
      executiveSummary: true,
      opportunity: true,
      risk: true,
      adoptionSignals: true,
      uncertainties: true,
      conclusion: true,
      sourceTrustScore: true,
      technicalValueScore: true,
      engineeringReadinessScore: true,
      businessRelevanceScore: true,
      adoptionRiskScore: true,
      strategicValueScore: true,
      communityHeatScore: true,
      radar: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!analysis) {
    redirect("/knowledge");
  }

  const slug = await getUniqueSlug(analysis.ownerId, analysis.title);

  const article = await prisma.knowledgeArticle.create({
    data: {
      ownerId: analysis.ownerId,
      radarId: analysis.radarId,
      organizationId: analysis.organizationId,
      visibility: analysis.visibility,
      title: analysis.title,
      slug,
      summary: analysis.executiveSummary,
      content: formatAnalysisContent(analysis),
      category: "技术分析",
      tags: [
        "TechnologyAnalysis",
        analysis.status,
        analysis.radar.name,
        `战略价值${analysis.strategicValueScore}`,
      ],
      sourceAnalysisId: analysis.id,
      status: "DRAFT",
    },
    select: {
      slug: true,
    },
  });

  redirect(`/knowledge/${article.slug}`);
}

export async function createKnowledgeArticleFromPocAction(formData: FormData) {
  const pocId = String(formData.get("pocId") || "");

  if (!pocId) {
    redirect("/knowledge");
  }

  const existing = await prisma.knowledgeArticle.findUnique({
    where: {
      sourcePocId: pocId,
    },
    select: {
      slug: true,
    },
  });

  if (existing) {
    redirect(`/knowledge/${existing.slug}`);
  }

  const poc = await prisma.poC.findUnique({
    where: {
      id: pocId,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      organizationId: true,
      visibility: true,
      title: true,
      status: true,
      objective: true,
      hypothesis: true,
      successCriteria: true,
      outcome: true,
      plan: true,
      findings: true,
      risks: true,
      recommendationBack: true,
      repoUrl: true,
      demoUrl: true,
      artifactUrl: true,
      radar: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!poc) {
    redirect("/knowledge");
  }

  const slug = await getUniqueSlug(poc.ownerId, poc.title);

  const article = await prisma.knowledgeArticle.create({
    data: {
      ownerId: poc.ownerId,
      radarId: poc.radarId,
      organizationId: poc.organizationId,
      visibility: poc.visibility,
      title: poc.title,
      slug,
      summary: poc.objective,
      content: formatPocContent(poc),
      category: "PoC 验证",
      tags: ["PoC", poc.status, poc.radar.name],
      sourcePocId: poc.id,
      status: "DRAFT",
    },
    select: {
      slug: true,
    },
  });

  redirect(`/knowledge/${article.slug}`);
}