import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/api/ai-helpers";

describe("checkRateLimit", () => {
  it("첫 요청은 허용된다", () => {
    const result = checkRateLimit("test-user-unique-1");
    expect(result.allowed).toBe(true);
  });

  it("10회 이내 요청은 허용된다", () => {
    const userId = "test-user-unique-2";
    for (let i = 0; i < 9; i++) {
      checkRateLimit(userId);
    }
    const result = checkRateLimit(userId);
    expect(result.allowed).toBe(true);
  });

  it("11회째 요청은 거부된다", () => {
    const userId = "test-user-unique-3";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(userId);
    }
    const result = checkRateLimit(userId);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("다른 유저는 별도 제한을 받는다", () => {
    const userId1 = "test-user-unique-4";
    const userId2 = "test-user-unique-5";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(userId1);
    }
    const result = checkRateLimit(userId2);
    expect(result.allowed).toBe(true);
  });
});
