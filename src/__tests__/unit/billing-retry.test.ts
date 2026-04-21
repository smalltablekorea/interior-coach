import { describe, it, expect } from "vitest";
import {
  getRetryDelayHours,
  calculateNextRetryTime,
  isRetryableError,
} from "@/lib/billing-retry";

describe("getRetryDelayHours — 재시도 딜레이 계산", () => {
  it("attempt 1 → 72시간 (3일)", () => expect(getRetryDelayHours(1)).toBe(72));
  it("attempt 2 → 72시간 (3일)", () => expect(getRetryDelayHours(2)).toBe(72));
  it("attempt 3 → 72시간 (3일)", () => expect(getRetryDelayHours(3)).toBe(72));
  it("attempt 4+ → 0 (재시도 불가)", () => {
    expect(getRetryDelayHours(4)).toBe(0);
    expect(getRetryDelayHours(100)).toBe(0);
  });
  it("attempt 0 → 0", () => expect(getRetryDelayHours(0)).toBe(0));
});

describe("calculateNextRetryTime — 다음 재시도 시각", () => {
  it("attempt 1 → 72시간(3일) 후", () => {
    const before = Date.now();
    const result = calculateNextRetryTime(1);
    expect(result).not.toBeNull();
    const diff = result!.getTime() - before;
    // 72시간 ± 1초 범위
    expect(diff).toBeGreaterThan(72 * 3600 * 1000 - 1000);
    expect(diff).toBeLessThan(72 * 3600 * 1000 + 1000);
  });

  it("attempt 4 → null (재시도 불가)", () => {
    expect(calculateNextRetryTime(4)).toBeNull();
  });
});

describe("isRetryableError — 에러 재시도 판단", () => {
  // 재시도 가능한 에러
  it("시스템 에러 → 재시도 가능", () => {
    expect(isRetryableError("COMMON_SYSTEM_ERROR", "System error")).toBe(true);
  });
  it("카드 일시 불가 → 재시도 가능", () => {
    expect(isRetryableError("CARD_TEMPORARILY_UNAVAILABLE", "")).toBe(true);
  });
  it("결제사 에러 → 재시도 가능", () => {
    expect(isRetryableError("PAYMENT_PROVIDER_ERROR", "")).toBe(true);
  });

  // 재시도 불가능한 에러
  it("카드 만료 → 재시도 불가", () => {
    expect(isRetryableError("INVALID_CARD_EXPIRATION", "Card expired")).toBe(false);
  });
  it("잘못된 카드번호 → 재시도 불가", () => {
    expect(isRetryableError("INVALID_CARD_NUMBER", "")).toBe(false);
  });
  it("빌링키 미존재 → 재시도 불가", () => {
    expect(isRetryableError("BILLING_KEY_NOT_FOUND", "")).toBe(false);
  });
  it("결제 취소 → 재시도 불가", () => {
    expect(isRetryableError("CANCELED_PAYMENT", "")).toBe(false);
  });

  // 메시지 기반 fallback
  it("network 메시지 → 재시도 가능", () => {
    expect(isRetryableError("UNKNOWN_CODE", "network error occurred")).toBe(true);
  });
  it("timeout 메시지 → 재시도 가능", () => {
    expect(isRetryableError("UNKNOWN_CODE", "request timeout")).toBe(true);
  });
  it("서버 오류 메시지 → 재시도 가능", () => {
    expect(isRetryableError("UNKNOWN_CODE", "서버 오류가 발생했습니다")).toBe(true);
  });
  it("invalid 메시지 → 재시도 불가", () => {
    expect(isRetryableError("UNKNOWN_CODE", "invalid card info")).toBe(false);
  });
  it("만료된 메시지 → 재시도 불가", () => {
    expect(isRetryableError("UNKNOWN_CODE", "만료된 카드입니다")).toBe(false);
  });

  // 알 수 없는 에러 → 기본 재시도
  it("완전히 알 수 없는 에러 → 재시도 가능 (기본값)", () => {
    expect(isRetryableError("COMPLETELY_UNKNOWN", "something happened")).toBe(true);
  });
});
