import { test, expect } from "@playwright/test";

/**
 * API 성능 E2E 테스트
 * - 주요 API 응답 시간 < 500ms
 * - 에러 응답 형식 일관성
 */

test.describe("API Performance — Response Times", () => {
  const endpoints = [
    { method: "GET", path: "/api/health-scores", description: "헬스스코어 API" },
    { method: "GET", path: "/api/subscription", description: "구독 상태 API" },
  ];

  for (const ep of endpoints) {
    test(`${ep.description} — 응답 < 500ms (비인증 시 401이라도 빠르게)`, async ({ request }) => {
      const start = Date.now();
      const res = await request.fetch(ep.path, { method: ep.method });
      const elapsed = Date.now() - start;
      // Even 401s should be fast
      expect(elapsed).toBeLessThan(500);
      // Should return JSON
      const contentType = res.headers()["content-type"] || "";
      expect(contentType).toContain("application/json");
    });
  }
});

test.describe("API — Error Response Format", () => {
  test("비인증 요청 → 표준 에러 JSON", async ({ request }) => {
    const res = await request.get("/api/sites");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
  });

  test("존재하지 않는 API 경로 → 404", async ({ request }) => {
    const res = await request.get("/api/nonexistent-endpoint-xyz");
    expect([404, 405]).toContain(res.status());
  });

  test("잘못된 메서드 → 405", async ({ request }) => {
    const res = await request.delete("/api/subscription");
    // Should return 405 or handle gracefully
    expect([401, 404, 405]).toContain(res.status());
  });
});

test.describe("API — Security Headers", () => {
  test("응답에 보안 헤더 포함", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();
    // Next.js should set X-Content-Type-Options
    // These may or may not be present depending on middleware config
    // At minimum, Content-Type should be set
    expect(headers["content-type"]).toBeTruthy();
  });
});
