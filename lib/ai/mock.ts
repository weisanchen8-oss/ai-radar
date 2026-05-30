/**
 * 文件作用：
 * 提供 AI 分析模块的 fallback mock。
 * 当 API Key 缺失、网络失败、供应商报错、JSON 解析失败时使用。
 */

import type {
  AnalyzeTechnologyInput,
  DailyReportJson,
  RadarSummaryInput,
  RadarSummaryJson,
  SuggestedRadarConfigJson,
  SuggestRadarConfigInput,
  TechnologyAnalysisJson,
} from "./types";
import { calculateTeraTotalScore } from "./json";

const PROMPT_VERSION = "ai-radar-analysis-v1";

export function createMockTechnologyAnalysis(
  input: AnalyzeTechnologyInput,
): TechnologyAnalysisJson {
  const sourceTrustScore = input.item.sourceUrl ? 70 : 45;
  const technicalValueScore = 65;
  const engineeringReadinessScore =
    input.item.sourceType === "GITHUB" || input.item.sourceType === "DOCUMENTATION"
      ? 72
      : 58;
  const businessRelevanceScore = input.radar.focusQuestion ? 76 : 62;
  const adoptionRiskScore = 42;
  const strategicValueScore = 66;
  const communityHeatScore = input.item.sourceType === "GITHUB" ? 70 : 55;

  const totalScore = calculateTeraTotalScore({
    sourceTrustScore,
    technicalValueScore,
    engineeringReadinessScore,
    businessRelevanceScore,
    adoptionRiskScore,
  });

  return {
    title: `${input.item.technologyName ?? input.item.title} 技术分析`,
    analysisInputSummary:
      input.item.summary ??
      `基于情报「${input.item.title}」生成的 fallback 技术分析。`,
    executiveSummary:
      "该技术具备一定关注价值，但当前结果来自 fallback mock，建议后续接入真实 LLM 后重新生成正式分析。",
    opportunity:
      "可能带来能力增强、工程效率提升或成本优化机会，适合进入轻量观察或小范围验证。",
    risk:
      "当前缺少充分上下文和多来源交叉验证，存在技术成熟度、维护成本和业务适配性不确定性。",
    adoptionSignals:
      "可重点观察官方文档、开源活跃度、真实案例、Benchmark 与社区反馈。",
    uncertainties:
      "尚不确定该技术在当前业务场景中的稳定性、成本收益和长期维护投入。",
    conclusion:
      "建议先持续观察；如果与当前 Radar 目标高度相关，可设计低成本 PoC 验证关键假设。",
    sourceTrustScore,
    technicalValueScore,
    engineeringReadinessScore,
    businessRelevanceScore,
    adoptionRiskScore,
    strategicValueScore,
    communityHeatScore,
    recommendation: {
      title: `观察 ${input.item.technologyName ?? input.item.title}`,
      actionType: totalScore >= 75 ? "VALIDATE_BY_POC" : "WATCH",
      summary:
        totalScore >= 75
          ? "建议进入小范围 PoC，验证其对当前业务目标的真实收益。"
          : "建议先持续观察，补充更多来源与工程可行性信息。",
      rationale:
        "当前分析基于 fallback mock，适合作为占位结果，不应直接作为最终技术决策。",
      expectedOutcome:
        "明确该技术是否值得进入后续验证，并沉淀初步判断依据。",
      riskNote:
        "mock 分析不代表真实模型判断，正式使用前应重新调用 LLM 生成。",
      priority: totalScore >= 75 ? "HIGH" : "MEDIUM",
    },
    metadata: {
      provider: "mock",
      promptVersion: PROMPT_VERSION,
      tera: {
        totalScore,
        sourceTrustLevel: sourceTrustScore >= 70 ? "HIGH" : "MEDIUM",
        businessMatchLevel: businessRelevanceScore >= 70 ? "HIGH" : "MEDIUM",
        engineeringDifficulty:
          engineeringReadinessScore >= 70 ? "LOW" : "MEDIUM",
        roiJudgement: totalScore >= 75 ? "VALIDATE" : "WATCH",
      },
      notes: ["fallback mock generated because LLM result was unavailable."],
    },
  };
}

export function createMockRadarSummary(
  input: RadarSummaryInput,
): RadarSummaryJson {
  return {
    summary: `${input.radar.name} 当前处于持续跟踪阶段。近期分析显示，需要重点关注与业务目标直接相关、工程接入成本可控、风险可验证的技术机会。`,
    decisionContext:
      input.radar.decisionContext ??
      "优先选择能够通过低成本 PoC 快速验证的技术方向，避免仅因短期热度投入过多资源。",
    keyOpportunities: [
      "筛选与当前业务目标直接相关的技术机会。",
      "优先验证工程接入成本低、收益路径明确的候选技术。",
      "将推荐动作与 PoC 结果沉淀为后续技术决策依据。",
    ],
    keyRisks: [
      "部分技术可能热度较高但工程成熟度不足。",
      "如果缺少多来源验证，推荐结论可能存在偏差。",
    ],
    suggestedFocus: [
      "补充高质量来源。",
      "围绕高优先级 Recommendation 设计 PoC。",
      "关注风险较低且业务匹配度高的技术方向。",
    ],
    metadata: {
      provider: "mock",
      promptVersion: PROMPT_VERSION,
    },
  };
}

export function createMockDailyReport(reportDate: Date): DailyReportJson {
  const dateText = reportDate.toISOString().slice(0, 10);

  return {
    title: `AI Radar 日报 - ${dateText}`,
    summary:
      "今日暂无可用真实 LLM 输出，系统生成 fallback 日报。建议查看新增情报、分析记录和推荐动作，并在配置 API 后重新生成。",
    highlights:
      "重点关注与当前 Radar 业务目标相关的新增技术情报，以及已经形成推荐动作的分析结果。",
    decisions:
      "当前不建议仅凭 fallback 日报做最终技术决策。可先作为测试数据验证日报写库链路。",
    risks:
      "fallback 日报不包含真实模型推理，无法替代正式分析结果。",
    nextActions:
      "配置 AI_PROVIDER_API_KEY 后重新运行日报生成脚本，并检查 DailyReport 表是否写入正式内容。",
    metadata: {
      provider: "mock",
      promptVersion: PROMPT_VERSION,
      includedItemCount: 0,
    },
  };
}

export function createMockSuggestedRadarConfig(
  input: SuggestRadarConfigInput,
): SuggestedRadarConfigJson {
  return {
    name: input.businessGoal.slice(0, 24) || "AI 技术雷达",
    description: `围绕「${input.businessGoal}」持续跟踪相关 AI 技术动态，并输出技术分析、风险判断和推荐动作。`,
    businessDomain: input.businessDomain ?? "AI 应用开发",
    focusQuestion:
      input.optimizationGoal ??
      "哪些 AI 技术真正值得投入资源进行验证？",
    observationScope:
      "重点关注模型能力、Agent 框架、工程工具、成本优化、知识库增强、评测与部署相关技术。",
    targetAudience: input.targetAudience ?? "AI 产品经理、技术负责人、AI 工程师",
    decisionContext:
      "优先验证与业务目标高度相关、工程接入成本可控、可通过 PoC 快速判断价值的技术。",
    scanIntensity: "MEDIUM",
    keywords: ["AI Agent", "RAG", "LLM", "Workflow", "PoC"],
    excludedTopics: ["纯资讯转载", "缺少来源的社区传闻", "与业务目标无关的泛娱乐内容"],
    metadata: {
      provider: "mock",
      promptVersion: PROMPT_VERSION,
      reason: "fallback mock generated because LLM result was unavailable.",
    },
  };
}