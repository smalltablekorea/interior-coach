import { describe, it, expect } from "vitest";
import { checkRateLimit, AI_RATE_LIMITS } from "@/lib/api/ai-helpers";

describe("checkRateLimit (플랜별 제한)", () => {
  it("플랜 미지정 시 free 한도가 적용된다", () => {
    const userId = "plan-default-user";
    const first = checkRateLimit(userId);
    expect(first.allowed).toBe(true);
    expect(first.limit).toBe(AI_RATE_LIMITS.free);
    expect(first.plan).toBe("free");
  });

  it("첫 요청은 허용된다", () => {
    const result = checkRateLimit("test-user-unique-1", "pro");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it("free 플랜은 한도 내에서 허용된다", () => {
    const userId = "test-user-free-under";
    for (let i = 0; i < AI_RATE_LIMITS.free - 1; i++) {
      checkRateLimit(userId, "free");
    }
    const result = checkRateLimit(userId, "free");
    expect(result.allowed).toBe(true);
  });

  it("free 플랜은 분당 한도 초과 시 거부된다", () => {
    const userId = "test-user-free-over";
    for (let i = 0; i < AI_RATE_LIMITS.free; i++) {
      checkRateLimit(userId, "free");
    }
    const result = checkRateLimit(userId, "free");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.remaining).toBe(0);
    expect(result.plan).toBe("free");
  });

  it("starter 플랜은 free보다 더 많은 요청을 허용한다", () => {
    const userId = "test-user-starter";
    for (let i = 0; i < AI_RATE_LIMITS.free; i++) {
      checkRateLimit(userId, "starter");
    }
    // free 한도를 넘겼지만 starter 한도 안이면 여전히 허용
    const result = checkRateLimit(userId, "starter");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(AI_RATE_LIMITS.starter);
  });

  it("pro 플랜은 starter보다 더 많은 요청을 허용한다", () => {
    const userId = "test-user-pro";
    for (let i = 0; i < AI_RATE_LIMITS.starter; i++) {
      checkRateLimit(userId, "pro");
    }
    const result = checkRateLimit(userId, "pro");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(AI_RATE_LIMITS.pro);
  });

  it("다른 유저는 별도 제한을 받는다", () => {
    const userId1 = "test-user-isolated-1";
    const userId2 = "test-user-isolated-2";
    for (let i = 0; i < AI_RATE_LIMITS.free; i++) {
      checkRateLimit(userId1, "free");
    }
    const result = checkRateLimit(userId2, "free");
    expect(result.allowed).toBe(true);
  });

  it("한도 구성은 free < starter < pro 순서로 증가한다", () => {
    expect(AI_RATE_LIMITS.free).toBeLessThan(AI_RATE_LIMITS.starter);
    expect(AI_RATE_LIMITS.starter).toBeLessThan(AI_RATE_LIMITS.pro);
  });
});
