/**
 * 文件作用：
 * 定义 AI 技术分析模块的输入、输出和结构化 JSON 类型。
 * 本文件只放类型，不放业务逻辑，避免 AI 分析代码堆在一个文件中。
 */

import type {
  RecommendationActionType,
  ScanIntensity,
} from "@prisma/client";

export type AiJsonValue =
  | string
  | number
  | boolean
  | null
  | AiJsonValue[]
  | { [key: string]: AiJsonValue };

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiJsonRequestOptions<T> = {
  taskName: string;
  messages: AiChatMessage[];
  fallback: () => T;
  temperature?: number;
};

export type RadarContextInput = {
  id: string;
  name: string;
  description: string;
  businessDomain?: string | null;
  focusQuestion?: string | null;
  observationScope?: string | null;
  targetAudience?: string | null;
  decisionContext?: string | null;
  scanIntensity?: ScanIntensity;
};

export type IntelligenceItemInput = {
  id: string;
  title: string;
  summary?: string | null;
  rawContent?: string | null;
  sourceType: string;
  sourceUrl: string;
  sourceName?: string | null;
  sourceAuthor?: string | null;
  sourcePublishedAt?: Date | string | null;
  technologyName?: string | null;
  vendor?: string | null;
  topic?: string | null;
};

export type AnalyzeTechnologyInput = {
  radar: RadarContextInput;
  item: IntelligenceItemInput;
};

export type TechnologyAnalysisJson = {
  title: string;
  analysisInputSummary: string;
  executiveSummary: string;
  opportunity: string;
  risk: string;
  adoptionSignals: string;
  uncertainties: string;
  conclusion: string;

  sourceTrustScore: number;
  technicalValueScore: number;
  engineeringReadinessScore: number;
  businessRelevanceScore: number;
  adoptionRiskScore: number;
  strategicValueScore: number;
  communityHeatScore: number;

  recommendation: {
    title: string;
    actionType: RecommendationActionType;
    summary: string;
    rationale: string;
    expectedOutcome: string;
    riskNote: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };

  metadata: {
    provider: "llm" | "mock";
    promptVersion: string;
    tera: {
      totalScore: number;
      sourceTrustLevel: "LOW" | "MEDIUM" | "HIGH";
      businessMatchLevel: "LOW" | "MEDIUM" | "HIGH";
      engineeringDifficulty: "LOW" | "MEDIUM" | "HIGH";
      roiJudgement: "VALIDATE" | "WATCH" | "RESERVE" | "REJECT";
    };
    notes: string[];
  };
};

export type RadarSummaryInput = {
  radar: RadarContextInput;
  recentAnalyses: Array<{
    title: string;
    executiveSummary: string;
    conclusion?: string | null;
    businessRelevanceScore: number;
    engineeringReadinessScore: number;
    adoptionRiskScore: number;
  }>;
  recentRecommendations: Array<{
    title: string;
    actionType: string;
    summary: string;
    priority?: string | null;
  }>;
};

export type RadarSummaryJson = {
  summary: string;
  decisionContext: string;
  keyOpportunities: string[];
  keyRisks: string[];
  suggestedFocus: string[];
  metadata: {
    provider: "llm" | "mock";
    promptVersion: string;
  };
};

export type DailyReportInput = {
  radar: RadarContextInput;
  reportDate: Date;
};

export type DailyReportJson = {
  title: string;
  summary: string;
  highlights: string;
  decisions: string;
  risks: string;
  nextActions: string;
  metadata: {
    provider: "llm" | "mock";
    promptVersion: string;
    includedItemCount: number;
  };
};

export type SuggestRadarConfigInput = {
  businessGoal: string;
  businessDomain?: string;
  existingTechStack?: string;
  targetAudience?: string;
  optimizationGoal?: string;
};

export type SuggestedRadarConfigJson = {
  name: string;
  description: string;
  businessDomain: string;
  focusQuestion: string;
  observationScope: string;
  targetAudience: string;
  decisionContext: string;
  scanIntensity: ScanIntensity;
  keywords: string[];
  excludedTopics: string[];
  metadata: {
    provider: "llm" | "mock";
    promptVersion: string;
    reason: string;
  };
};