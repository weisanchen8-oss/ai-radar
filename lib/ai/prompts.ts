/**
 * 文件作用：
 * 集中管理 AI 分析模块的 Prompt。
 * 业务服务只负责读写数据库，Prompt 单独维护，方便后续迭代。
 */

import type {
  AnalyzeTechnologyInput,
  DailyReportInput,
  RadarSummaryInput,
  SuggestRadarConfigInput,
} from "./types";

export const AI_RADAR_PROMPT_VERSION = "ai-radar-analysis-v1";

const systemPrompt = `
你是 AI Radar 的技术分析引擎。

系统原则：
1. 规则优先，AI 补充。
2. 规则负责状态、时间、分数门槛和写库逻辑。
3. AI 只负责摘要、TERA 初评、风险分析、推荐动作、Radar Summary 和 DailyReport 内容生成。
4. 必须输出严格 JSON，不要输出 Markdown，不要输出解释文字。
5. 分数统一使用 0-100 整数。
6. adoptionRiskScore 表示采用风险，分数越高代表风险越高。
7. 推荐动作只能使用：
WATCH
VALIDATE_BY_POC
ADOPT_INCREMENTALLY
REJECT_FOR_NOW
NEED_MORE_INFO
8. priority 只能使用：
LOW
MEDIUM
HIGH
CRITICAL
`;

export function buildAnalyzeTechnologyMessages(input: AnalyzeTechnologyInput) {
  return [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          task: "analyzeTechnology",
          promptVersion: AI_RADAR_PROMPT_VERSION,
          outputSchema: {
            title: "string",
            analysisInputSummary: "string",
            executiveSummary: "string",
            opportunity: "string",
            risk: "string",
            adoptionSignals: "string",
            uncertainties: "string",
            conclusion: "string",
            sourceTrustScore: "number 0-100",
            technicalValueScore: "number 0-100",
            engineeringReadinessScore: "number 0-100",
            businessRelevanceScore: "number 0-100",
            adoptionRiskScore: "number 0-100",
            strategicValueScore: "number 0-100",
            communityHeatScore: "number 0-100",
            recommendation: {
              title: "string",
              actionType:
                "WATCH | VALIDATE_BY_POC | ADOPT_INCREMENTALLY | REJECT_FOR_NOW | NEED_MORE_INFO",
              summary: "string",
              rationale: "string",
              expectedOutcome: "string",
              riskNote: "string",
              priority: "LOW | MEDIUM | HIGH | CRITICAL",
            },
            metadata: {
              provider: "llm",
              promptVersion: AI_RADAR_PROMPT_VERSION,
              tera: {
                totalScore: "number 0-100",
                sourceTrustLevel: "LOW | MEDIUM | HIGH",
                businessMatchLevel: "LOW | MEDIUM | HIGH",
                engineeringDifficulty: "LOW | MEDIUM | HIGH",
                roiJudgement: "VALIDATE | WATCH | RESERVE | REJECT",
              },
              notes: ["string"],
            },
          },
          radar: input.radar,
          intelligenceItem: input.item,
          analysisGuidance: {
            sourceTrust:
              "判断来源是否可靠，关注官方、论文、GitHub、文档、多来源验证。",
            technicalValue:
              "判断技术是否有新方法、能力提升、成本优化、速度提升或路线意义。",
            engineeringReadiness:
              "判断是否有代码/API/文档、部署复杂度、维护活跃度、生产风险。",
            businessRelevance:
              "必须结合 Radar 的业务场景、目标用户、技术栈和优化目标判断。",
            adoptionRisk:
              "判断供应商锁定、合规风险、迁移成本、维护风险和团队学习成本。",
          },
        },
        null,
        2,
      ),
    },
  ];
}

export function buildRadarSummaryMessages(input: RadarSummaryInput) {
  return [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          task: "generateRadarSummary",
          promptVersion: AI_RADAR_PROMPT_VERSION,
          outputSchema: {
            summary: "string",
            decisionContext: "string",
            keyOpportunities: ["string"],
            keyRisks: ["string"],
            suggestedFocus: ["string"],
            metadata: {
              provider: "llm",
              promptVersion: AI_RADAR_PROMPT_VERSION,
            },
          },
          radar: input.radar,
          recentAnalyses: input.recentAnalyses,
          recentRecommendations: input.recentRecommendations,
        },
        null,
        2,
      ),
    },
  ];
}

export function buildDailyReportMessages(input: DailyReportInput, data: unknown) {
  return [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          task: "generateDailyReport",
          promptVersion: AI_RADAR_PROMPT_VERSION,
          reportDate: input.reportDate.toISOString().slice(0, 10),
          outputSchema: {
            title: "string",
            summary: "string",
            highlights: "string",
            decisions: "string",
            risks: "string",
            nextActions: "string",
            metadata: {
              provider: "llm",
              promptVersion: AI_RADAR_PROMPT_VERSION,
              includedItemCount: "number",
            },
          },
          data,
        },
        null,
        2,
      ),
    },
  ];
}

export function buildSuggestRadarConfigMessages(input: SuggestRadarConfigInput) {
  return [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          task: "suggestRadarConfig",
          promptVersion: AI_RADAR_PROMPT_VERSION,
          outputSchema: {
            name: "string",
            description: "string",
            businessDomain: "string",
            focusQuestion: "string",
            observationScope: "string",
            targetAudience: "string",
            decisionContext: "string",
            scanIntensity: "LOW | MEDIUM | HIGH",
            keywords: ["string"],
            excludedTopics: ["string"],
            metadata: {
              provider: "llm",
              promptVersion: AI_RADAR_PROMPT_VERSION,
              reason: "string",
            },
          },
          userInput: input,
        },
        null,
        2,
      ),
    },
  ];
}