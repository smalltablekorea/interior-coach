/**
 * AI API 호출 유틸: 재시도 로직 + 요청 제한(rate limiting)
 */

import Anthropic from "@anthropic-ai/sdk";
import type { PlanId } from "@/lib/plans";

// ─── Rate Limiter (메모리 기반, 유저별 분당 요청 제한) ───
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1분

/**
 * 플랜별 AI 엔드포인트 분당 최대 요청 수.
 * Free는 체험 용도, Pro는 넉넉하게 허용해 과금 폭탄을 방지한다.
 */
export const AI_RATE_LIMITS: Record<PlanId, number> = {
  free: 5,
  starter: 20,
  pro: 60,
};

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  limit: number;
  remaining: number;
  plan: PlanId;
}

export function checkRateLimit(userId: string, plan: PlanId = "free"): RateLimitResult {
  const max = AI_RATE_LIMITS[plan] ?? AI_RATE_LIMITS.free;
  const now = Date.now();
  const log = requestLog.get(userId) ?? [];
  // 윈도우 밖 기록 제거
  const recent = log.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= max) {
    const oldest = recent[0];
    return {
      allowed: false,
      retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - oldest),
      limit: max,
      remaining: 0,
      plan,
    };
  }
  recent.push(now);
  requestLog.set(userId, recent);
  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - recent.length),
    plan,
  };
}

// ─── 재시도 로직 ───
interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

export async function callAnthropicWithRetry<T>(
  fn: (client: Anthropic) => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const client = new Anthropic({ apiKey });
  const maxRetries = opts.maxRetries ?? 2;
  const baseDelay = opts.baseDelayMs ?? 1000;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(client);
    } catch (error: unknown) {
      lastError = error;
      // API 에러 중 재시도 가능한 경우만 retry
      const isRetryable =
        error instanceof Anthropic.APIError &&
        (error.status === 429 || error.status === 500 || error.status === 529);

      if (!isRetryable || attempt === maxRetries) break;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

/**
 * Claude 응답에서 텍스트 추출
 */
export function extractText(response: Anthropic.Messages.Message): string {
  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}

/**
 * Claude 응답에서 JSON 추출 (마크다운 코드블록 제거 포함)
 */
export function extractJson<T = unknown>(response: Anthropic.Messages.Message): T {
  const text = extractText(response);
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
