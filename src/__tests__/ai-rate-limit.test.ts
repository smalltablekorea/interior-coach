import { describe, it, expect } from "vitest";
import { enforceAiRateLimit } from "@/lib/api/ai-rate-limit";
import { AI_RATE_LIMITS } from "@/lib/api/ai-helpers";

describe("enforceAiRateLimit", () => {
  it("첫 호출은 통과하며 현재 플랜/남은 호출 수를 반환한다", async () => {
    const gate = await enforceAiRateLimit("enforce-user-first", { plan: "pro" });
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.plan).toBe("pro");
      expect(gate.limit).toBe(AI_RATE_LIMITS.pro);
      expect(gate.remaining).toBeGreaterThan(0);
    }
  });

  it("한도 초과 시 429 응답을 반환한다", async () => {
    const userId = "enforce-user-over";
    for (let i = 0; i < AI_RATE_LIMITS.free; i++) {
      await enforceAiRateLimit(userId, { plan: "free" });
    }

    const gate = await enforceAiRateLimit(userId, { plan: "free" });
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.response.status).toBe(429);
      const retryAfter = gate.response.headers.get("Retry-After");
      expect(retryAfter).not.toBeNull();
      expect(Number(retryAfter)).toBeGreaterThan(0);
      const payload = await gate.response.json();
      expect(payload.success).toBe(false);
      expect(payload.rateLimit.plan).toBe("free");
      expect(payload.rateLimit.limit).toBe(AI_RATE_LIMITS.free);
      expect(payload.rateLimit.remaining).toBe(0);
    }
  });

  it("플랜이 다르면 한도도 다르다 (starter > free)", async () => {
    const userId = "enforce-user-plan-diff";
    // free 한도만큼 호출
    for (let i = 0; i < AI_RATE_LIMITS.free; i++) {
      await enforceAiRateLimit(userId, { plan: "starter" });
    }
    // free였다면 막혀야 하지만 starter라 여전히 허용
    const gate = await enforceAiRateLimit(userId, { plan: "starter" });
    expect(gate.ok).toBe(true);
    if (gate.ok) expect(gate.limit).toBe(AI_RATE_LIMITS.starter);
  });
});

describe("AI 엔드포인트 레이트 리밋 커버리지 (AI-21)", () => {
  const ENDPOINTS = [
    "src/app/api/estimate-coach/route.ts",
    "src/app/api/estimate-coach/generate-subs/route.ts",
    "src/app/api/estimate-coach/parse-receipt/route.ts",
    "src/app/api/analyze-receipt/route.ts",
    "src/app/api/tax/ai-advisor/route.ts",
    "src/app/api/marketing/content/generate/route.ts",
    "src/app/api/marketing/threads/generate/route.ts",
    "src/app/api/marketing/threads/comments/route.ts",
  ] as const;

  it("Anthropic를 호출하는 모든 사용자 트리거 엔드포인트에 enforceAiRateLimit가 적용되어 있다", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    for (const rel of ENDPOINTS) {
      const src = await readFile(resolve(process.cwd(), rel), "utf8");
      expect(src, `${rel}에 enforceAiRateLimit import가 없습니다`).toMatch(
        /from\s+["']@\/lib\/api\/ai-rate-limit["']/
      );
      expect(src, `${rel}에 enforceAiRateLimit 호출이 없습니다`).toMatch(/enforceAiRateLimit\(/);
    }
  });

  // site-chat/upload 테스트는 톡방 기능 철거와 함께 제거됨.
});
