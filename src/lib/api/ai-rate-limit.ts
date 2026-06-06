/**
 * AI 엔드포인트 플랜별 레이트 리밋 가드.
 *
 * - `getUserSubscription`으로 유저의 플랜을 조회하고
 * - `checkRateLimit`으로 메모리 기반 창(window) 카운트를 확인한 뒤
 * - 초과 시 사용자 안내 메시지와 `Retry-After` 헤더를 담은 429 응답을 돌려준다.
 *
 * 사용 예:
 * ```ts
 * const gate = await enforceAiRateLimit(auth.userId);
 * if (!gate.ok) return gate.response;
 * ```
 */

import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/subscription";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import {
  checkRateLimit,
  checkDailyLimit,
  AI_RATE_LIMITS,
  AI_DAILY_LIMITS,
  type RateLimitResult,
} from "./ai-helpers";

type LimitWindow = "minute" | "day";

export function rateLimitExceededResponse(
  result: RateLimitResult,
  window: LimitWindow = "minute",
): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((result.retryAfterMs ?? 60_000) / 1000));
  const planName = PLANS[result.plan].nameKo;
  const windowLabel = window === "day" ? "일일" : "분당";
  const upgradeHint =
    result.plan === "pro"
      ? ""
      : " 더 많은 호출이 필요하면 상위 플랜으로 업그레이드해주세요.";
  const message = `요청이 너무 많습니다. ${planName} 플랜은 ${windowLabel} ${result.limit}회까지 허용됩니다. 약 ${retryAfterSec}초 후 다시 시도해주세요.${upgradeHint}`;

  return NextResponse.json(
    {
      success: false,
      error: message,
      rateLimit: {
        plan: result.plan,
        window,
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
        "X-RateLimit-Window": window,
      },
    }
  );
}

export type RateLimitGate =
  | { ok: true; plan: PlanId; remaining: number; limit: number }
  | { ok: false; response: NextResponse };

/**
 * 유저의 플랜을 조회해 AI 엔드포인트 레이트 리밋을 강제한다.
 * 통과 시 호출자는 `gate.plan`으로 현재 플랜을 활용할 수 있다.
 *
 * 호출부가 이미 플랜을 알고 있다면 `options.plan`으로 전달해 불필요한 DB 조회를 생략할 수 있다.
 */
export async function enforceAiRateLimit(
  userId: string,
  options?: { plan?: PlanId }
): Promise<RateLimitGate> {
  const plan = options?.plan ?? (await getUserSubscription(userId)).plan;

  // 1) 일일 한도 먼저 검사 (DB-backed, cold-start 안전).
  //    하루 누적 폭주를 우선 차단해 봇/루프 비용 방어.
  const daily = await checkDailyLimit(userId, plan);
  if (!daily.allowed) {
    return { ok: false, response: rateLimitExceededResponse(daily, "day") };
  }

  // 2) 분당 한도 검사 (메모리, 인스턴스별).
  //    단기 burst 차단.
  const minute = checkRateLimit(userId, plan);
  if (!minute.allowed) {
    return { ok: false, response: rateLimitExceededResponse(minute, "minute") };
  }

  return { ok: true, plan, remaining: minute.remaining, limit: minute.limit };
}

export { AI_RATE_LIMITS, AI_DAILY_LIMITS };
