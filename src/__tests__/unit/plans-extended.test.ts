import { describe, it, expect } from "vitest";
import {
  PLANS,
  FEATURE_REQUIRED_PLAN,
  getPlanLevel,
  isPlanAtLeast,
  formatPrice,
  formatLimit,
  type PlanId,
  type FeatureKey,
} from "@/lib/plans";

describe("PLANS — 요금제 구조 무결성", () => {
  const planIds: PlanId[] = ["free", "starter", "pro"];

  it("3개 플랜 존재", () => {
    expect(Object.keys(PLANS)).toHaveLength(3);
  });

  it.each(planIds)("%s 플랜 필수 필드 존재", (planId) => {
    const plan = PLANS[planId];
    expect(plan.id).toBe(planId);
    expect(plan.name).toBeTruthy();
    expect(plan.nameKo).toBeTruthy();
    expect(typeof plan.monthlyPrice).toBe("number");
    expect(typeof plan.yearlyMonthlyPrice).toBe("number");
    expect(plan.description).toBeTruthy();
    expect(plan.limits).toBeDefined();
    expect(plan.highlights.length).toBeGreaterThan(0);
  });

  it("가격 순서: free < starter < pro", () => {
    expect(PLANS.free.monthlyPrice).toBe(0);
    expect(PLANS.starter.monthlyPrice).toBeGreaterThan(0);
    expect(PLANS.pro.monthlyPrice).toBeGreaterThan(PLANS.starter.monthlyPrice);
  });

  it("연간 결제가 월간보다 저렴하거나 같음", () => {
    for (const plan of planIds) {
      expect(PLANS[plan].yearlyMonthlyPrice).toBeLessThanOrEqual(PLANS[plan].monthlyPrice);
    }
  });

  it("상위 플랜은 하위 플랜보다 제한이 넓음", () => {
    expect(PLANS.pro.limits.maxSites).toBeGreaterThanOrEqual(-1); // -1 = unlimited
    expect(PLANS.starter.limits.maxSites).toBeGreaterThan(PLANS.free.limits.maxSites);
  });

  it("pro는 popular 마크", () => {
    expect(PLANS.pro.popular).toBe(true);
    expect(PLANS.free.popular).toBeFalsy();
  });
});

describe("getPlanLevel / isPlanAtLeast", () => {
  it("free=0, starter=1, pro=2", () => {
    expect(getPlanLevel("free")).toBe(0);
    expect(getPlanLevel("starter")).toBe(1);
    expect(getPlanLevel("pro")).toBe(2);
  });

  it("같은 플랜은 충족", () => {
    expect(isPlanAtLeast("free", "free")).toBe(true);
    expect(isPlanAtLeast("pro", "pro")).toBe(true);
  });

  it("상위 플랜은 하위를 충족", () => {
    expect(isPlanAtLeast("pro", "free")).toBe(true);
    expect(isPlanAtLeast("pro", "starter")).toBe(true);
    expect(isPlanAtLeast("starter", "free")).toBe(true);
  });

  it("하위 플랜은 상위를 미충족", () => {
    expect(isPlanAtLeast("free", "starter")).toBe(false);
    expect(isPlanAtLeast("free", "pro")).toBe(false);
    expect(isPlanAtLeast("starter", "pro")).toBe(false);
  });
});

describe("FEATURE_REQUIRED_PLAN — 기능별 최소 플랜", () => {
  const allFeatures = Object.keys(FEATURE_REQUIRED_PLAN) as FeatureKey[];

  it("모든 기능에 유효한 플랜 매핑 존재", () => {
    const validPlans = ["free", "starter", "pro"];
    for (const feature of allFeatures) {
      expect(validPlans).toContain(FEATURE_REQUIRED_PLAN[feature]);
    }
  });

  it("무료 기능: sites, photos, customers", () => {
    expect(FEATURE_REQUIRED_PLAN.sites).toBe("free");
    expect(FEATURE_REQUIRED_PLAN.photos).toBe("free");
    expect(FEATURE_REQUIRED_PLAN.customers).toBe("free");
  });

  it("프로 전용 기능 그룹", () => {
    const proOnlyFeatures: FeatureKey[] = [
      "marketingAutomation", "taxFull", "electronicContracts",
      "workersManagement", "materialsManagement", "customerPortal", "ocrReceiptScan"
    ];
    for (const f of proOnlyFeatures) {
      expect(FEATURE_REQUIRED_PLAN[f]).toBe("pro");
    }
  });
});

describe("formatPrice / formatLimit", () => {
  it("0원 → '무료'", () => expect(formatPrice(0)).toBe("무료"));
  it("유료 → ₩ + 콤마", () => {
    expect(formatPrice(149000)).toMatch(/₩.*149/);
  });
  it("-1 → '무제한'", () => expect(formatLimit(-1)).toBe("무제한"));
  it("양수 → 문자열", () => expect(formatLimit(15)).toBe("15"));
});
