import { describe, it, expect } from "vitest";
import { getCurrentMonthConfig, weightedPick, type MonthlyConfig } from "@/lib/qna/monthly-config";

describe("QnA Monthly Config — 월별 설정", () => {
  it("getCurrentMonthConfig returns valid config for current month", () => {
    const config = getCurrentMonthConfig();
    expect(config).toBeDefined();
    expect(config.month).toBeGreaterThanOrEqual(1);
    expect(config.month).toBeLessThanOrEqual(12);
    expect(config.season).toBeTruthy();
    expect(config.context).toBeTruthy();
    expect(config.mood).toBeTruthy();
  });

  it("categoryWeights sum to 100", () => {
    const config = getCurrentMonthConfig();
    const w = config.categoryWeights;
    const total = w.estimate + w.contractor + w.process + w.quality + w.materials + w.design + w.other;
    expect(total).toBe(100);
  });

  it("all categoryWeights >= 0", () => {
    const config = getCurrentMonthConfig();
    for (const val of Object.values(config.categoryWeights)) {
      expect(val).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("weightedPick — 가중치 기반 선택", () => {
  it("returns one of the given keys", () => {
    const weights = { a: 50, b: 30, c: 20 };
    const result = weightedPick(weights);
    expect(["a", "b", "c"]).toContain(result);
  });

  it("returns the only option with 100% weight", () => {
    // When one option has all weight
    const weights = { only: 100, never: 0 };
    // Run multiple times to be confident
    for (let i = 0; i < 10; i++) {
      expect(weightedPick(weights)).toBe("only");
    }
  });
});
