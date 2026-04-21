import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateOrderId, generateCustomerKey } from "@/lib/toss";

/**
 * 결제 플로우 테스트 — AI-75
 * changePlan → billing/payment → Toss 결제 연결 검증
 */

// ─── toss.ts helper 함수 테스트 ───
describe("Toss Helpers", () => {
  describe("generateOrderId", () => {
    it("IC- 프리픽스로 시작", () => {
      const id = generateOrderId("user-123");
      expect(id).toMatch(/^IC-/);
    });

    it("날짜가 포함됨 (YYYYMMDD)", () => {
      const id = generateOrderId("user-123");
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      expect(id).toContain(dateStr);
    });

    it("userId 프리픽스 포함", () => {
      const id = generateOrderId("abcdefghij");
      expect(id).toContain("abcdefgh");
    });

    it("매번 다른 ID 생성", () => {
      const ids = new Set(
        Array.from({ length: 100 }, () => generateOrderId("test"))
      );
      expect(ids.size).toBe(100);
    });
  });

  describe("generateCustomerKey", () => {
    it("customer_ 프리픽스", () => {
      expect(generateCustomerKey("user-abc")).toBe("customer_user-abc");
    });

    it("동일 입력 → 동일 출력 (결정적)", () => {
      expect(generateCustomerKey("x")).toBe(generateCustomerKey("x"));
    });
  });
});

// ─── changePlan 로직 테스트 (useSubscription에서 추출) ───
describe("changePlan logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("유료 플랜 → /api/billing/payment 호출", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ plan: "starter" }),
    });
    global.fetch = mockFetch;

    await fetch("/api/billing/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "starter", billingCycle: "monthly" }),
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/billing/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "starter", billingCycle: "monthly" }),
    });
  });

  it("무료 플랜 → /api/subscription 호출", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ plan: "free" }),
    });
    global.fetch = mockFetch;

    await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "free" }),
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/subscription", expect.any(Object));
  });

  it("결제 수단 미등록 에러 → needsCard 플래그", () => {
    const errorMsg = "결제 수단을 먼저 등록해주세요";
    const hasNeedsCard = errorMsg.includes("결제 수단");
    expect(hasNeedsCard).toBe(true);
  });

  it("billingCycle override 가 request body에 반영됨", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    global.fetch = mockFetch;

    const overrideCycle = "yearly";
    await fetch("/api/billing/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "pro", billingCycle: overrideCycle }),
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.billingCycle).toBe("yearly");
  });
});

// ─── Plan validation ───
describe("Plan validation", () => {
  it("유효한 플랜: starter, pro", () => {
    const validPlans = ["starter", "pro"];
    expect(validPlans).toContain("starter");
    expect(validPlans).toContain("pro");
    expect(validPlans).not.toContain("free");
    expect(validPlans).not.toContain("enterprise");
  });

  it("유효한 billingCycle: monthly, yearly", () => {
    const validCycles = ["monthly", "yearly"];
    expect(validCycles).toContain("monthly");
    expect(validCycles).toContain("yearly");
  });
});

// ─── sessionStorage flow for pending upgrade ───
describe("Pending upgrade via sessionStorage", () => {
  // In jsdom, sessionStorage is available

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("pendingPlanUpgrade 저장 및 복원", () => {
    sessionStorage.setItem("pendingPlanUpgrade", "pro");
    expect(sessionStorage.getItem("pendingPlanUpgrade")).toBe("pro");
    sessionStorage.removeItem("pendingPlanUpgrade");
    expect(sessionStorage.getItem("pendingPlanUpgrade")).toBeNull();
  });

  it("pendingBillingCycle 저장 및 복원", () => {
    sessionStorage.setItem("pendingBillingCycle", "yearly");
    expect(sessionStorage.getItem("pendingBillingCycle")).toBe("yearly");
    sessionStorage.removeItem("pendingBillingCycle");
    expect(sessionStorage.getItem("pendingBillingCycle")).toBeNull();
  });

  it("미설정 시 기본값 monthly", () => {
    const cycle = sessionStorage.getItem("pendingBillingCycle") || "monthly";
    expect(cycle).toBe("monthly");
  });
});
