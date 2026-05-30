/**
 * 文件作用：
 * 提供 AI JSON 输出的解析、兜底、分数规范化工具。
 * 目标是保证 AI 即使输出不稳定，也不会影响主业务写库。
 */

export function safeParseJson<T>(rawText: string): T | null {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace < 0 || lastBrace <= firstBrace) {
      return null;
    }

    const possibleJson = cleaned.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(possibleJson) as T;
    } catch {
      return null;
    }
  }
}

export function clampScore(value: unknown, fallback = 50) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function clampText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const result = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return result.length > 0 ? result : fallback;
}

export function calculateTeraTotalScore(input: {
  sourceTrustScore: number;
  technicalValueScore: number;
  engineeringReadinessScore: number;
  businessRelevanceScore: number;
  adoptionRiskScore: number;
}) {
  /**
   * 规则优先：
   * 这里采用设计中确认的权重：
   * 来源可信度 15%
   * 技术价值 20%
   * 工程可行性 25%
   * 业务适配性 30%
   * 风险可控性 10%
   *
   * adoptionRiskScore 表示“采用风险”，分数越高风险越高；
   * 因此进入总分时转换为 riskControlScore。
   */
  const riskControlScore = 100 - input.adoptionRiskScore;

  return Math.round(
    input.sourceTrustScore * 0.15 +
      input.technicalValueScore * 0.2 +
      input.engineeringReadinessScore * 0.25 +
      input.businessRelevanceScore * 0.3 +
      riskControlScore * 0.1,
  );
}