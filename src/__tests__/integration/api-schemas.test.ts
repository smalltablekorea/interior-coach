import { describe, it, expect } from "vitest";
import {
  customerSchema,
  siteSchema,
  estimateItemSchema,
  estimateSchema,
  contractSchema,
  workerSchema,
  expenseSchema,
  materialSchema,
  portalChatMessageSchema,
  stripHtml,
} from "@/lib/api/validate";

/**
 * 전체 Zod 스키마 검증 테스트 — 모든 API 엔드포인트 입력 스키마
 * XSS sanitization, 필수 필드, 범위 제한, 엣지 케이스
 */

describe("customerSchema", () => {
  it("유효 입력 통과", () => {
    const r = customerSchema.safeParse({ name: "홍길동", phone: "010-1234-5678" });
    expect(r.success).toBe(true);
  });

  it("이름 없으면 실패", () => {
    const r = customerSchema.safeParse({ phone: "010-1234-5678" });
    expect(r.success).toBe(false);
  });

  it("이름에 XSS 삽입 → 정제", () => {
    const r = customerSchema.safeParse({ name: '<script>alert(1)</script>홍길동' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).not.toContain("<script");
      expect(r.data.name).toContain("홍길동");
    }
  });

  it("빈 이름 → 실패", () => {
    const r = customerSchema.safeParse({ name: "" });
    expect(r.success).toBe(false);
  });

  it("잘못된 이메일 → 실패", () => {
    const r = customerSchema.safeParse({ name: "홍길동", email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("유효 이메일 통과", () => {
    const r = customerSchema.safeParse({ name: "홍길동", email: "test@example.com" });
    expect(r.success).toBe(true);
  });

  it("status 기본값 상담중", () => {
    const r = customerSchema.safeParse({ name: "홍길동" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("상담중");
  });
});

describe("siteSchema", () => {
  it("유효 입력 통과", () => {
    const r = siteSchema.safeParse({ name: "잠실 현장", areaPyeong: 32 });
    expect(r.success).toBe(true);
  });

  it("현장명 없으면 실패", () => {
    const r = siteSchema.safeParse({ areaPyeong: 32 });
    expect(r.success).toBe(false);
  });

  it("유효하지 않은 UUID → 실패", () => {
    const r = siteSchema.safeParse({ name: "현장", customerId: "not-a-uuid" });
    expect(r.success).toBe(false);
  });

  it("건물타입 enum 검증", () => {
    const r = siteSchema.safeParse({ name: "현장", buildingType: "호텔" });
    expect(r.success).toBe(false);
  });

  it("XSS in name → sanitized", () => {
    const r = siteSchema.safeParse({ name: '<img src=x onerror=alert(1)>현장' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).not.toContain("<img");
  });
});

describe("contractSchema", () => {
  it("유효 입력 통과", () => {
    const r = contractSchema.safeParse({ contractAmount: 50000000 });
    expect(r.success).toBe(true);
  });

  it("음수 계약금액 → 실패", () => {
    const r = contractSchema.safeParse({ contractAmount: -1 });
    expect(r.success).toBe(false);
  });

  it("계약금액 필수", () => {
    const r = contractSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("유효하지 않은 status → 실패", () => {
    const r = contractSchema.safeParse({ contractAmount: 1000, status: "invalid" });
    expect(r.success).toBe(false);
  });

  it("status 기본값 계약대기", () => {
    const r = contractSchema.safeParse({ contractAmount: 1000 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("계약대기");
  });
});

describe("workerSchema", () => {
  it("유효 입력 통과", () => {
    const r = workerSchema.safeParse({ name: "김목수", trade: "목공" });
    expect(r.success).toBe(true);
  });

  it("이름 없으면 실패", () => {
    const r = workerSchema.safeParse({ trade: "목공" });
    expect(r.success).toBe(false);
  });

  it("직종 없으면 실패", () => {
    const r = workerSchema.safeParse({ name: "김목수" });
    expect(r.success).toBe(false);
  });

  it("음수 일당 허용 (nullable)", () => {
    // dailyWage min(0) — negative should fail
    const r = workerSchema.safeParse({ name: "김목수", trade: "목공", dailyWage: -100 });
    expect(r.success).toBe(false);
  });
});

describe("expenseSchema", () => {
  it("유효 입력 통과", () => {
    const r = expenseSchema.safeParse({ category: "자재비", amount: 100000 });
    expect(r.success).toBe(true);
  });

  it("잘못된 카테고리 → 실패", () => {
    const r = expenseSchema.safeParse({ category: "식비", amount: 1000 });
    expect(r.success).toBe(false);
  });

  it("음수 금액 → 실패", () => {
    const r = expenseSchema.safeParse({ category: "자재비", amount: -1 });
    expect(r.success).toBe(false);
  });

  it("잘못된 receiptUrl → 실패", () => {
    const r = expenseSchema.safeParse({
      category: "자재비",
      amount: 1000,
      receiptUrl: "not-a-url",
    });
    expect(r.success).toBe(false);
  });
});

describe("materialSchema", () => {
  it("유효 입력 통과", () => {
    const r = materialSchema.safeParse({ name: "타일" });
    expect(r.success).toBe(true);
  });

  it("이름 없으면 실패", () => {
    const r = materialSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("XSS in brand → sanitized", () => {
    const r = materialSchema.safeParse({
      name: "타일",
      brand: '<script>alert("xss")</script>삼화',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.brand).not.toContain("<script");
  });
});

describe("portalChatMessageSchema", () => {
  it("유효 메시지 통과", () => {
    const r = portalChatMessageSchema.safeParse({
      content: "안녕하세요, 공사 일정 문의합니다",
      displayName: "홍길동",
    });
    expect(r.success).toBe(true);
  });

  it("빈 content → 실패", () => {
    const r = portalChatMessageSchema.safeParse({
      content: "",
      displayName: "홍길동",
    });
    expect(r.success).toBe(false);
  });

  it("빈 displayName → 실패", () => {
    const r = portalChatMessageSchema.safeParse({
      content: "내용",
      displayName: "",
    });
    expect(r.success).toBe(false);
  });

  it("content에 XSS → 정제", () => {
    const r = portalChatMessageSchema.safeParse({
      content: '<script>alert(1)</script>질문입니다',
      displayName: "홍길동",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.content).not.toContain("<script");
      expect(r.data.content).toContain("질문입니다");
    }
  });

  it("content 4000자 초과 → 잘림", () => {
    const longContent = "가".repeat(5000);
    const r = portalChatMessageSchema.safeParse({
      content: longContent,
      displayName: "홍길동",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.content.length).toBeLessThanOrEqual(4000);
  });

  it("displayName 120자 초과 → 잘림", () => {
    const longName = "가".repeat(200);
    const r = portalChatMessageSchema.safeParse({
      content: "내용",
      displayName: longName,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.displayName.length).toBeLessThanOrEqual(120);
  });
});

describe("estimateSchema — 추가 엣지 케이스", () => {
  it("유효한 전체 견적 통과", () => {
    const r = estimateSchema.safeParse({
      totalAmount: 50000000,
      profitRate: 15,
      overheadRate: 10,
      vatEnabled: true,
      items: [{ category: "목공", itemName: "걸레받이", quantity: 1, unitPrice: 50000, amount: 50000 }],
    });
    expect(r.success).toBe(true);
  });

  it("profitRate 100 초과 → 실패", () => {
    const r = estimateSchema.safeParse({ profitRate: 101 });
    expect(r.success).toBe(false);
  });

  it("overheadRate 음수 → 실패", () => {
    const r = estimateSchema.safeParse({ overheadRate: -1 });
    expect(r.success).toBe(false);
  });

  it("유효하지 않은 status → 실패", () => {
    const r = estimateSchema.safeParse({ status: "삭제됨" });
    expect(r.success).toBe(false);
  });

  it("빈 items 배열 허용", () => {
    const r = estimateSchema.safeParse({ items: [] });
    expect(r.success).toBe(true);
  });
});
