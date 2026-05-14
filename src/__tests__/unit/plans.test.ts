import { describe, it, expect } from "vitest";
import { PLANS, type PlanId } from "@/lib/plans";

describe("Plans — 요금제 설정", () => {
  const planIds: PlanId[] = ["free", "starter", "pro"];

  it("has all 3 plans defined", () => {
    for (const id of planIds) {
      expect(PLANS[id]).toBeDefined();
    }
  });

  it("free plan is actually free", () => {
    expect(PLANS.free.monthlyPrice).toBe(0);
    expect(PLANS.free.yearlyMonthlyPrice).toBe(0);
  });

  it("paid plans cost more than free", () => {
    expect(PLANS.starter.monthlyPrice).toBeGreaterThan(0);
    expect(PLANS.pro.monthlyPrice).toBeGreaterThan(0);
  });

  it("yearly price is discounted vs monthly", () => {
    expect(PLANS.starter.yearlyMonthlyPrice).toBeLessThan(PLANS.starter.monthlyPrice);
    expect(PLANS.pro.yearlyMonthlyPrice).toBeLessThan(PLANS.pro.monthlyPrice);
  });

  it("pro has unlimited or higher limits than starter", () => {
    // Pro maxSites is -1 (unlimited) 
    const proSites = PLANS.pro.limits.maxSites;
    expect(proSites === -1 || proSites >= PLANS.starter.limits.maxSites).toBe(true);
    const proCust = PLANS.pro.limits.maxCustomers;
    expect(proCust === -1 || proCust >= PLANS.starter.limits.maxCustomers).toBe(true);
  });

  it("free plan has restricted features", () => {
    expect(PLANS.free.limits.hasMarketingAutomation).toBe(false);
    expect(PLANS.free.limits.hasTaxFull).toBe(false);
    expect(PLANS.free.limits.hasElectronicContracts).toBe(false);
  });

  it("pro plan has all features", () => {
    expect(PLANS.pro.limits.hasMarketingAutomation).toBe(true);
    expect(PLANS.pro.limits.hasTaxFull).toBe(true);
    expect(PLANS.pro.limits.hasElectronicContracts).toBe(true);
  });

  it("all plans have highlights", () => {
    for (const id of planIds) {
      expect(PLANS[id].highlights.length).toBeGreaterThan(0);
    }
  });

  it("all plans have Korean names", () => {
    for (const id of planIds) {
      expect(PLANS[id].nameKo).toBeTruthy();
    }
  });

  it("exactly one plan is marked popular", () => {
    const popular = planIds.filter((id) => PLANS[id].popular);
    expect(popular.length).toBe(1);
  });
});
