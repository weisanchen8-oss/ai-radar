/**
 * 文件作用：
 * 封装 OpenAI-compatible Chat Completions API。
 * 不绑定某一个模型供应商，只依赖 baseUrl、apiKey、model 三个环境变量。
 */

import { safeParseJson } from "./json";
import type { AiJsonRequestOptions } from "./types";

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getAiConfig() {
  return {
    baseUrl:
      process.env.AI_PROVIDER_BASE_URL?.replace(/\/$/, "") ??
      "https://api.openai.com/v1",
    apiKey: process.env.AI_PROVIDER_API_KEY,
    model: process.env.AI_PROVIDER_MODEL ?? "gpt-4o-mini",
    timeoutMs: Number(process.env.AI_PROVIDER_TIMEOUT_MS ?? 30000),
    mockMode: process.env.AI_MOCK_MODE === "true",
  };
}

export async function requestAiJson<T>({
  taskName,
  messages,
  fallback,
  temperature = 0.2,
}: AiJsonRequestOptions<T>): Promise<{
  data: T;
  usedFallback: boolean;
  errorMessage?: string;
}> {
  const config = getAiConfig();

  if (config.mockMode || !config.apiKey) {
    return {
      data: fallback(),
      usedFallback: true,
      errorMessage: config.mockMode
        ? "AI_MOCK_MODE is enabled."
        : "AI_PROVIDER_API_KEY is missing.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        response_format: { type: "json_object" },
      }),
    });

    const result = (await response.json()) as OpenAICompatibleResponse;

    if (!response.ok) {
      return {
        data: fallback(),
        usedFallback: true,
        errorMessage:
          result.error?.message ??
          `${taskName} failed with HTTP ${response.status}.`,
      };
    }

    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return {
        data: fallback(),
        usedFallback: true,
        errorMessage: `${taskName} returned empty content.`,
      };
    }

    const parsed = safeParseJson<T>(content);

    if (!parsed) {
      return {
        data: fallback(),
        usedFallback: true,
        errorMessage: `${taskName} returned invalid JSON.`,
      };
    }

    return {
      data: parsed,
      usedFallback: false,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown AI request error.";

    return {
      data: fallback(),
      usedFallback: true,
      errorMessage,
    };
  } finally {
    clearTimeout(timeout);
  }
}