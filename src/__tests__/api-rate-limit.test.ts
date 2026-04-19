import { describe, it, expect, beforeEach } from "vitest";
import {
  checkApiRateLimit,
  enforceApiRateLimit,
  __resetApiRateLimit,
} from "@/lib/api/rate-limit";

describe("checkApiRateLimit (범용 API 레이트 리밋)", () => {
  beforeEach(() => __resetApiRateLimit());

  it("한도 내 요청은 allowed=true", () => {
    const r = checkApiRateLimit("u1", { bucket: "sms-outreach", max: 3 });
    expect(r.allowed).toBe(true);
    expect(r.limit).toBe(3);
    expect(r.remaining).toBeGreaterThanOrEqual(0);
  });

  it("한도 초과 시 allowed=false + retryAfterMs", () => {
    for (let i = 0; i < 3; i++) checkApiRateLimit("u2", { bucket: "sms-outreach", max: 3 });
    const r = checkApiRateLimit("u2", { bucket: "sms-outreach", max: 3 });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it("버킷이 다르면 한도가 분리된다", () => {
    for (let i = 0; i < 3; i++) checkApiRateLimit("u3", { bucket: "sms-outreach", max: 3 });
    const cross = checkApiRateLimit("u3", { bucket: "marketing-publish", max: 3 });
    expect(cross.allowed).toBe(true);
  });

  it("유저가 다르면 한도가 분리된다", () => {
    for (let i = 0; i < 3; i++) checkApiRateLimit("u4", { bucket: "sms-outreach", max: 3 });
    const other = checkApiRateLimit("u5", { bucket: "sms-outreach", max: 3 });
    expect(other.allowed).toBe(true);
  });
});

describe("enforceApiRateLimit", () => {
  beforeEach(() => __resetApiRateLimit());

  it("통과 시 ok=true + 남은 수 반환", () => {
    const gate = enforceApiRateLimit("u6", { bucket: "t1", max: 2 });
    expect(gate.ok).toBe(true);
    if (gate.ok) expect(gate.limit).toBe(2);
  });

  it("한도 초과 시 429 + Retry-After 헤더 + JSON 페이로드", async () => {
    for (let i = 0; i < 2; i++) enforceApiRateLimit("u7", { bucket: "t2", max: 2 });
    const gate = enforceApiRateLimit("u7", { bucket: "t2", max: 2 });
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.response.status).toBe(429);
      expect(gate.response.headers.get("Retry-After")).not.toBeNull();
      expect(gate.response.headers.get("X-RateLimit-Limit")).toBe("2");
      const body = await gate.response.json();
      expect(body.success).toBe(false);
      expect(body.rateLimit.bucket).toBe("t2");
      expect(body.rateLimit.limit).toBe(2);
      expect(body.rateLimit.remaining).toBe(0);
    }
  });
});

describe("비 AI 고비용/외부 호출 엔드포인트 커버리지 (AI-21)", () => {
  const ENDPOINTS = [
    "src/app/api/marketing/sms/outreach/route.ts",
    "src/app/api/marketing/publish/[channel]/route.ts",
    "src/app/api/workspace/invite/route.ts",
    "src/app/api/workspaces/[id]/members/invite/route.ts",
  ] as const;

  it("SMS/외부 게시/초대 이메일 엔드포인트가 enforceApiRateLimit을 사용한다", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    for (const rel of ENDPOINTS) {
      const src = await readFile(resolve(process.cwd(), rel), "utf8");
      expect(src, `${rel}에 enforceApiRateLimit import 없음`).toMatch(
        /from\s+["']@\/lib\/api\/rate-limit["']/
      );
      expect(src, `${rel}에 enforceApiRateLimit 호출 없음`).toMatch(/enforceApiRateLimit\(/);
    }
  });
});
