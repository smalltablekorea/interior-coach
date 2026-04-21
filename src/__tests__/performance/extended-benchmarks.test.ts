import { describe, it, expect } from "vitest";
import { measureTime } from "../helpers";

/**
 * 성능 벤치마크 확장 — API 응답 시간 < 500ms 목표
 * (모듈 로드 + 순수 연산 성능 테스트)
 */
describe("Performance — Extended module loads", () => {
  const modules = [
    { name: "utils", path: "@/lib/utils", maxMs: 50 },
    { name: "constants", path: "@/lib/constants", maxMs: 50 },
    { name: "plans", path: "@/lib/plans", maxMs: 50 },
    { name: "attendance-utils", path: "@/lib/attendance-utils", maxMs: 50 },
    { name: "billing-retry", path: "@/lib/billing-retry", maxMs: 500 },
    { name: "materials-catalog", path: "@/lib/materials-catalog", maxMs: 200 },
    { name: "schedule-planner/trades", path: "@/lib/schedule-planner/trades", maxMs: 100 },
    { name: "notifications/templates", path: "@/lib/notifications/templates", maxMs: 50 },
    { name: "site-chat/utils", path: "@/lib/site-chat/utils", maxMs: 100 },
    { name: "api/validate", path: "@/lib/api/validate", maxMs: 80 },
    { name: "api/query-helpers", path: "@/lib/api/query-helpers", maxMs: 50 },
    { name: "api/response", path: "@/lib/api/response", maxMs: 50 },
  ];

  it.each(modules)("$name loads < $maxMs ms", async ({ path, maxMs }) => {
    const { ms } = await measureTime(async () => {
      return await import(/* @vite-ignore */ path);
    });
    expect(ms).toBeLessThan(maxMs);
  });
});

describe("Performance — Computation throughput", () => {
  it("utils fmt 10,000 calls < 50ms", async () => {
    const { fmt } = await import("@/lib/utils");
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      fmt(i * 12345);
    }
    expect(performance.now() - start).toBeLessThan(50);
  });

  it("isPlanAtLeast 10,000 calls < 10ms", async () => {
    const { isPlanAtLeast } = await import("@/lib/plans");
    const plans = ["free", "starter", "pro"] as const;
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      isPlanAtLeast(plans[i % 3], plans[(i + 1) % 3]);
    }
    expect(performance.now() - start).toBeLessThan(10);
  });

  it("parseTime 10,000 calls < 20ms", async () => {
    const { parseTime } = await import("@/lib/attendance-utils");
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      parseTime(`${i % 24}:${String(i % 60).padStart(2, "0")}`);
    }
    expect(performance.now() - start).toBeLessThan(20);
  });

  it("stripHtml 1,000 calls with payloads < 100ms", async () => {
    const { stripHtml } = await import("@/lib/api/validate");
    const payloads = [
      '<script>alert("xss")</script>',
      "normal text",
      '<img src=x onerror=alert(1)>',
      "a".repeat(1000),
    ];
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      stripHtml(payloads[i % payloads.length]);
    }
    expect(performance.now() - start).toBeLessThan(100);
  });

  it("isSpam 5,000 calls < 30ms", async () => {
    const { isSpam } = await import("@/lib/site-chat/utils");
    const messages = [
      "안녕하세요",
      "ab",
      "http://a.com http://b.com http://c.com test",
      "정상 메시지입니다",
      "a".repeat(2001),
    ];
    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      isSpam(messages[i % messages.length]);
    }
    expect(performance.now() - start).toBeLessThan(30);
  });
});

describe("Performance — Memory efficiency", () => {
  it("materials catalog does not exceed reasonable size", async () => {
    const { materialsCatalog } = await import("@/lib/materials-catalog");
    // Rough JSON size check (should be manageable)
    const jsonSize = JSON.stringify(materialsCatalog).length;
    // Under 5MB in JSON string form
    expect(jsonSize).toBeLessThan(5 * 1024 * 1024);
  });
});
