/**
 * 범용 API 엔드포인트 레이트 리밋 (AI-21).
 *
 * Anthropic 과금 폭탄은 `enforceAiRateLimit`가 막지만,
 * SMS 발송·외부 플랫폼 게시·초대 이메일 등 과금/남용 위험이 있는 비 AI 라우트는
 * 이 모듈의 `enforceApiRateLimit`로 버킷별 고정 한도를 적용한다.
 *
 * - 메모리 기반 슬라이딩 윈도우 (AI 레이트 리미터와 동일 전략)
 * - 버킷 네임스페이스를 붙여 다른 도메인끼리 한도를 분리한다
 * - 서버리스/멀티 리전 배포에서는 인스턴스별 한도라는 한계가 있음 → TODO(AI-XX):
 *   Upstash Redis 또는 Vercel Edge Config 기반 공유 버킷으로 승격
 */

import { NextResponse } from "next/server";

/** 버킷별 슬라이딩 윈도우 로그. 키는 `${bucket}:${userId}`. */
const requestLog = new Map<string, number[]>();

export interface ApiRateLimitOptions {
  /** 버킷 이름 (예: "sms-outreach", "marketing-publish"). */
  bucket: string;
  /** 허용 요청 수 */
  max: number;
  /** 윈도우 길이 (ms). 기본 60초 */
  windowMs?: number;
}

export interface ApiRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs?: number;
}

export function checkApiRateLimit(
  userId: string,
  options: ApiRateLimitOptions,
): ApiRateLimitResult {
  const { bucket, max } = options;
  const windowMs = options.windowMs ?? 60_000;
  const key = `${bucket}:${userId}`;
  const now = Date.now();
  const log = requestLog.get(key) ?? [];
  const recent = log.filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      retryAfterMs: windowMs - (now - recent[0]),
    };
  }

  recent.push(now);
  requestLog.set(key, recent);
  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - recent.length),
  };
}

/** 테스트에서 버킷 상태 초기화 */
export function __resetApiRateLimit(): void {
  requestLog.clear();
}

export type ApiRateLimitGate =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; response: NextResponse };

/**
 * 유저별 + 버킷별 API 레이트 리밋을 강제하고, 초과 시 표준 429 응답을 반환한다.
 *
 * 응답 포맷은 `enforceAiRateLimit`와 호환되도록 맞췄다:
 * `{ success: false, error, rateLimit: { bucket, limit, remaining, retryAfterSec } }`
 */
export function enforceApiRateLimit(
  userId: string,
  options: ApiRateLimitOptions,
): ApiRateLimitGate {
  const result = checkApiRateLimit(userId, options);
  if (result.allowed) {
    return { ok: true, remaining: result.remaining, limit: result.limit };
  }

  const retryAfterSec = Math.max(1, Math.ceil((result.retryAfterMs ?? 60_000) / 1000));
  const response = NextResponse.json(
    {
      success: false,
      error: `요청이 너무 많습니다. 분당 ${result.limit}회까지 허용됩니다. 약 ${retryAfterSec}초 후 다시 시도해주세요.`,
      rateLimit: {
        bucket: options.bucket,
        limit: result.limit,
        remaining: 0,
        retryAfterSec,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
  return { ok: false, response };
}
