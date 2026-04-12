import { describe, it, expect } from "vitest";
import { estimateSchema, estimateItemSchema, customerSchema } from "@/lib/api/validate";

describe("estimateSchema", () => {
  it("기본값으로 파싱 가능", () => {
    const result = estimateSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profitRate).toBe(0);
      expect(result.data.overheadRate).toBe(0);
      expect(result.data.vatEnabled).toBe(true);
      expect(result.data.status).toBe("작성중");
    }
  });

  it("profitRate 0~100 범위 허용", () => {
    const valid = estimateSchema.safeParse({ profitRate: 15 });
    expect(valid.success).toBe(true);

    const tooHigh = estimateSchema.safeParse({ profitRate: 101 });
    expect(tooHigh.success).toBe(false);

    const negative = estimateSchema.safeParse({ profitRate: -1 });
    expect(negative.success).toBe(false);
  });

  it("overheadRate 0~100 범위 허용", () => {
    const valid = estimateSchema.safeParse({ overheadRate: 5 });
    expect(valid.success).toBe(true);

    const tooHigh = estimateSchema.safeParse({ overheadRate: 200 });
    expect(tooHigh.success).toBe(false);
  });

  it("유효한 상태값만 허용", () => {
    const valid = estimateSchema.safeParse({ status: "발송" });
    expect(valid.success).toBe(true);

    const invalid = estimateSchema.safeParse({ status: "삭제됨" });
    expect(invalid.success).toBe(false);
  });
});

describe("estimateItemSchema sanitization", () => {
  it("HTML 태그를 제거한다", () => {
    const result = estimateItemSchema.safeParse({
      category: '<script>alert("xss")</script>목공',
      itemName: "합판<img onerror=hack>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).not.toContain("<script>");
      expect(result.data.category).toContain("목공");
      expect(result.data.itemName).not.toContain("<img");
      expect(result.data.itemName).toContain("합판");
    }
  });

  it("정상 텍스트는 유지한다", () => {
    const result = estimateItemSchema.safeParse({
      category: "철거공사",
      itemName: "철거 인건비 (2인×2일)",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("철거공사");
      expect(result.data.itemName).toBe("철거 인건비 (2인×2일)");
    }
  });
});

describe("customerSchema sanitization", () => {
  it("이름에서 HTML 태그를 제거한다", () => {
    const result = customerSchema.safeParse({
      name: "<b>홍길동</b>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("홍길동");
    }
  });
});
