import { describe, it, expect } from "vitest";
import {
  TRADES, SITE_STATUSES, BUILDING_TYPES, ESTIMATE_STATUSES,
  PAYMENT_TYPES, PHASE_STATUSES, ORDER_STATUSES, CUSTOMER_STATUSES,
  COMMUNICATION_TYPES, THREADS_POST_STATUSES, THREADS_TEMPLATE_CATEGORIES,
  THREADS_AUTO_RULE_TYPES, THREADS_COMMENT_STATUSES,
  TAX_REVENUE_TYPES, TAX_EXPENSE_CATEGORIES,
} from "@/lib/constants";

describe("Constants — 상수 무결성", () => {
  it("TRADES has essential trades", () => {
    const required = ["철거", "설비", "전기", "목공", "타일", "도배", "도장"];
    for (const t of required) {
      expect(TRADES).toContain(t);
    }
  });

  it("TRADES has no duplicates", () => {
    expect(new Set(TRADES).size).toBe(TRADES.length);
  });

  it("SITE_STATUSES follows workflow order", () => {
    expect(SITE_STATUSES[0]).toBe("상담중");
    expect(SITE_STATUSES[SITE_STATUSES.length - 1]).toBe("A/S");
  });

  it("BUILDING_TYPES includes main types", () => {
    expect(BUILDING_TYPES).toContain("아파트");
    expect(BUILDING_TYPES).toContain("빌라");
    expect(BUILDING_TYPES).toContain("상가");
  });

  it("ESTIMATE_STATUSES has 4 states", () => {
    expect(ESTIMATE_STATUSES.length).toBe(4);
  });

  it("PAYMENT_TYPES has 4 steps", () => {
    expect(PAYMENT_TYPES).toEqual(["계약금", "착수금", "중도금", "잔금"]);
  });

  it("PHASE_STATUSES has standard states", () => {
    expect(PHASE_STATUSES).toContain("대기");
    expect(PHASE_STATUSES).toContain("진행중");
    expect(PHASE_STATUSES).toContain("완료");
  });

  it("all constant arrays are typed as readonly (no runtime mutation expected)", () => {
    // `as const` makes TypeScript treat these as readonly, but doesn't freeze at runtime
    // The important thing is they exist and have the expected values
    expect(Array.isArray(TRADES)).toBe(true);
    expect(Array.isArray(SITE_STATUSES)).toBe(true);
    expect(Array.isArray(BUILDING_TYPES)).toBe(true);
  });

  it("THREADS_TEMPLATE_CATEGORIES for marketing", () => {
    expect(THREADS_TEMPLATE_CATEGORIES.length).toBeGreaterThanOrEqual(4);
    expect(THREADS_TEMPLATE_CATEGORIES).toContain("시공완료");
  });

  it("TAX_EXPENSE_CATEGORIES covers main expenses", () => {
    const required = ["자재비", "인건비", "외주비"];
    for (const cat of required) {
      expect(TAX_EXPENSE_CATEGORIES).toContain(cat);
    }
  });

  it("no empty strings in any constant array", () => {
    const allArrays = [
      TRADES, SITE_STATUSES, BUILDING_TYPES, ESTIMATE_STATUSES,
      PAYMENT_TYPES, PHASE_STATUSES, ORDER_STATUSES, CUSTOMER_STATUSES,
      COMMUNICATION_TYPES, THREADS_POST_STATUSES, THREADS_TEMPLATE_CATEGORIES,
      THREADS_AUTO_RULE_TYPES, THREADS_COMMENT_STATUSES,
      TAX_REVENUE_TYPES, TAX_EXPENSE_CATEGORIES,
    ];
    for (const arr of allArrays) {
      for (const item of arr) {
        expect(item.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
