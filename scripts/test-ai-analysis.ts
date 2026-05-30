/**
 * 文件作用：
 * 测试 AI 分析模块是否可以完成：
 * 1. suggestRadarConfig
 * 2. analyzeTechnology
 * 3. generateRadarSummary
 * 4. generateDailyReport
 *
 * 运行方式：
 * npx tsx scripts/test-ai-analysis.ts
 */

import {
  analyzeTechnology,
  generateDailyReport,
  generateRadarSummary,
  suggestRadarConfig,
} from "../lib/ai/radar-ai-service";
import { prisma } from "../lib/prisma";

async function main() {
  const radar = await prisma.radar.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!radar) {
    throw new Error("未找到 Radar。请先运行 prisma seed 或创建一个 Radar。");
  }

  let item = await prisma.intelligenceItem.findFirst({
    where: { radarId: radar.id },
    orderBy: { createdAt: "desc" },
  });

  if (!item) {
    item = await prisma.intelligenceItem.create({
      data: {
        ownerId: radar.ownerId,
        radarId: radar.id,
        organizationId: radar.organizationId,
        visibility: radar.visibility,
        title: "LangGraph 发布新的 Agent Workflow 能力",
        summary:
          "该情报用于测试 AI Radar 的技术分析链路，模拟一个与 Agent Workflow 相关的新技术动态。",
        rawContent:
          "LangGraph 强调可控 workflow、状态管理、多步骤 agent 执行和生产可观测性，适合复杂 AI Agent 应用。",
        sourceType: "GITHUB",
        sourceUrl: `https://example.com/test-langgraph-${Date.now()}`,
        sourceName: "Mock Source",
        technologyName: "LangGraph",
        vendor: "LangChain",
        topic: "AI Agent Workflow",
        capturedAt: new Date(),
      },
    });
  }

  console.log("Radar:", radar.id, radar.name);
  console.log("IntelligenceItem:", item.id, item.title);

  const suggestedConfig = await suggestRadarConfig({
    businessGoal: "为 AI Sales Agent 项目持续跟踪值得验证的新技术",
    businessDomain: "AI Agent / B2B Sales",
    existingTechStack: "Next.js, Prisma, PostgreSQL, Tailwind, OpenAI-compatible API",
    targetAudience: "AI 产品经理、AI Agent 工程师",
    optimizationGoal: "降低试错成本，优先发现可 PoC 的 Agent 技术",
  });

  console.log("\n[suggestRadarConfig]");
  console.log(suggestedConfig);

  const analysisResult = await analyzeTechnology(item.id);

  console.log("\n[analyzeTechnology]");
  console.log({
    analysisId: analysisResult.analysis.id,
    recommendationId: analysisResult.recommendation.id,
    usedFallback: analysisResult.usedFallback,
    errorMessage: analysisResult.errorMessage,
  });

  const summaryResult = await generateRadarSummary(radar.id);

  console.log("\n[generateRadarSummary]");
  console.log({
    radarId: summaryResult.radar.id,
    usedFallback: summaryResult.usedFallback,
    errorMessage: summaryResult.errorMessage,
    summary: summaryResult.summary.summary,
  });

  const reportResult = await generateDailyReport(radar.id, new Date());

  console.log("\n[generateDailyReport]");
  console.log({
    dailyReportId: reportResult.dailyReport.id,
    usedFallback: reportResult.usedFallback,
    errorMessage: reportResult.errorMessage,
    title: reportResult.dailyReport.title,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });