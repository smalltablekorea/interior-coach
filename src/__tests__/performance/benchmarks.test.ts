import { describe, it, expect } from "vitest";
import { measureTime } from "../helpers";

/**
 * Performance baseline tests.
 * Ensures core modules load within acceptable time.
 */
describe("Performance — Module load times", () => {
  it("estimate-engine loads < 100ms", async () => {
    const { ms } = await measureTime(async () => {
      return await import("@/lib/estimate-engine");
    });
    expect(ms).toBeLessThan(100);
  });

  it("plans loads < 50ms", async () => {
    const { ms } = await measureTime(async () => {
      return await import("@/lib/plans");
    });
    expect(ms).toBeLessThan(50);
  });

  it("permissions loads < 50ms", async () => {
    const { ms } = await measureTime(async () => {
      return await import("@/lib/workspace/permissions");
    });
    expect(ms).toBeLessThan(50);
  });
});

describe("Performance — Computation benchmarks", () => {
  it("calcCatTotal runs 1000 iterations < 50ms", async () => {
    const { calcCatTotal, CATS } = await import("@/lib/estimate-engine");
    const cat = CATS[0];
    if (!cat) return;

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      calcCatTotal(cat, 30, "standard");
    }
    const ms = performance.now() - start;
    expect(ms).toBeLessThan(50);
  });

  it("parsePagination handles rapid requests", async () => {
    const { parsePagination } = await import("@/lib/api/query-helpers");
    const { NextRequest } = await import("next/server");

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const req = new NextRequest(
        new URL(`/api/test?page=${i}&limit=20`, "http://localhost:3000")
      );
      parsePagination(req);
    }
    const ms = performance.now() - start;
    expect(ms).toBeLessThan(100);
  });
});
