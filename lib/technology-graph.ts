/**
 * 文件作用：
 * 定义 AI Radar 轻量技术图谱 Graph Lite 的数据结构与解析方法。
 * 当前版本不新增数据库表，优先从 TechnologyAnalysis.metadata.graphLite 中读取。
 */

export type TechnologyGraphLite = {
  relatedTechnologies: string[];
  alternativeTechnologies: string[];
  dependencyTechnologies: string[];
  technologyRoute: string;
  graphNote: string;
};

export const emptyTechnologyGraphLite: TechnologyGraphLite = {
  relatedTechnologies: [],
  alternativeTechnologies: [],
  dependencyTechnologies: [],
  technologyRoute: "",
  graphNote: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * 从 TechnologyAnalysis.metadata 中解析 Graph Lite。
 *
 * 预期 metadata 结构：
 * {
 *   graphLite: {
 *     relatedTechnologies: string[],
 *     alternativeTechnologies: string[],
 *     dependencyTechnologies: string[],
 *     technologyRoute: string,
 *     graphNote: string
 *   }
 * }
 */
export function parseTechnologyGraphLite(
  metadata: unknown,
): TechnologyGraphLite {
  if (!isRecord(metadata)) {
    return emptyTechnologyGraphLite;
  }

  const graphLite = metadata.graphLite;

  if (!isRecord(graphLite)) {
    return emptyTechnologyGraphLite;
  }

  return {
    relatedTechnologies: normalizeStringArray(graphLite.relatedTechnologies),
    alternativeTechnologies: normalizeStringArray(
      graphLite.alternativeTechnologies,
    ),
    dependencyTechnologies: normalizeStringArray(
      graphLite.dependencyTechnologies,
    ),
    technologyRoute: normalizeString(graphLite.technologyRoute),
    graphNote: normalizeString(graphLite.graphNote),
  };
}

export function hasTechnologyGraphLite(graph: TechnologyGraphLite) {
  return (
    graph.relatedTechnologies.length > 0 ||
    graph.alternativeTechnologies.length > 0 ||
    graph.dependencyTechnologies.length > 0 ||
    Boolean(graph.technologyRoute) ||
    Boolean(graph.graphNote)
  );
}