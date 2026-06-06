/**
 * AI API 호출 유틸: 싱글톤 클라이언트 + 재시도 + rate limit + 사용량 로깅 + prompt caching.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { PlanId } from "@/lib/plans";
import { db } from "@/lib/db";
import { aiUsage } from "@/lib/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";

// ─── 싱글톤 클라이언트 (서버리스 인스턴스 내 재사용) ───
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  _client = new Anthropic({ apiKey });
  return _client;
}

// ─── 표준 모델 ID (중앙 관리) ───
export const MODELS = {
  /** 비전·고품질 추론 */
  SONNET: "claude-sonnet-4-6",
  /** 단순 OCR·짧은 카피·구조화 변환 */
  HAIKU: "claude-haiku-4-5-20251001",
} as const;

// ─── Rate Limiter (인스턴스별, Vercel 분산 환경에선 불완전) ───
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1분

/**
 * 플랜별 AI 엔드포인트 분당 최대 요청 수.
 * 2026-06-06 프로모 시작 시 Pro 60→30으로 축소: 카드 미등록 trial 사용자의
 * 봇/루프성 폭주 1초 1회 이상 호출 차단. 인간 사용 패턴엔 영향 없음.
 */
export const AI_RATE_LIMITS: Record<PlanId, number> = {
  free: 5,
  starter: 20,
  pro: 30,
};

/**
 * 플랜별 AI 엔드포인트 일일(24h 롤링 윈도우) 최대 요청 수.
 * DB(aiUsage 테이블)를 조회해 인스턴스 cold start에도 누적 정확함.
 * 분당 한도와 별개로 적용되어 봇/루프성 폭주 누적 비용 방어.
 */
export const AI_DAILY_LIMITS: Record<PlanId, number> = {
  free: 30,
  starter: 100,
  pro: 200,
};

const DAILY_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

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

/**
 * 일일 호출 한도 검사 — aiUsage 테이블 COUNT 기반.
 * 분당 한도(checkRateLimit)와 별개 호출. 둘 다 통과해야 AI 호출 허용.
 */
export async function checkDailyLimit(
  userId: string,
  plan: PlanId = "free",
): Promise<RateLimitResult> {
  const max = AI_DAILY_LIMITS[plan] ?? AI_DAILY_LIMITS.free;
  const since = new Date(Date.now() - DAILY_LIMIT_WINDOW_MS);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, since)));

  const used = count ?? 0;
  if (used >= max) {
    // 정확한 retryAfter 계산은 oldest row 조회 필요. 단순화: 1시간 권장.
    return {
      allowed: false,
      retryAfterMs: 60 * 60 * 1000,
      limit: max,
      remaining: 0,
      plan,
    };
  }
  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - used),
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
  opts: RetryOptions = {},
): Promise<T> {
  const client = getClient();
  const maxRetries = opts.maxRetries ?? 2;
  const baseDelay = opts.baseDelayMs ?? 1000;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(client);
    } catch (error: unknown) {
      lastError = error;
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

/** Claude 응답에서 텍스트 추출 */
export function extractText(response: Anthropic.Messages.Message): string {
  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}

/** Claude 응답에서 JSON 추출 (마크다운 코드블록 제거 포함) */
export function extractJson<T = unknown>(response: Anthropic.Messages.Message): T {
  const text = extractText(response);
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

// ─── 캐시 가능한 시스템 프롬프트 헬퍼 ───
/**
 * 시스템 프롬프트를 캐시 가능한 블록으로 래핑.
 * 1024 토큰 이상이고 5분 내 재호출이면 input 90% 절감.
 */
export function cachedSystem(text: string): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: "text",
      text,
      cache_control: { type: "ephemeral" },
    },
  ];
}

// ─── 사용량 로깅 ───
export interface AiUsageLogInput {
  endpoint: string;
  model: string;
  userId?: string | null;
  workspaceId?: string | null;
  usage: Anthropic.Messages.Usage | undefined;
}

/**
 * Claude 응답 usage 객체를 콘솔과 DB에 기록.
 * DB 실패는 swallow — AI 흐름을 막지 않음.
 */
export async function logAiUsage(input: AiUsageLogInput): Promise<void> {
  const u = input.usage;
  const inputTokens = u?.input_tokens ?? 0;
  const outputTokens = u?.output_tokens ?? 0;
  const cacheCreate = u?.cache_creation_input_tokens ?? 0;
  const cacheRead = u?.cache_read_input_tokens ?? 0;

  // eslint-disable-next-line no-console
  console.log(
    `[ai:usage] endpoint=${input.endpoint} model=${input.model} in=${inputTokens} out=${outputTokens} cache_create=${cacheCreate} cache_read=${cacheRead} user=${input.userId ?? "-"}`,
  );

  if (!input.userId) return;
  try {
    await db.insert(aiUsage).values({
      userId: input.userId,
      workspaceId: input.workspaceId ?? null,
      endpoint: input.endpoint,
      model: input.model,
      inputTokens,
      outputTokens,
      cacheCreationTokens: cacheCreate,
      cacheReadTokens: cacheRead,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[ai:usage] DB insert failed", e);
  }
}
