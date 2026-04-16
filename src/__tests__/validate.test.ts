import { describe, it, expect } from "vitest";
import {
  estimateSchema,
  estimateItemSchema,
  customerSchema,
  portalChatMessageSchema,
  stripHtml,
} from "@/lib/api/validate";

describe("stripHtml", () => {
  it("script 태그를 제거한다 (태그가 실행되지 않도록)", () => {
    const out = stripHtml('<script>alert("x")</script>안녕');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("</script");
    expect(out).toContain("안녕");
  });

  it("img onerror 태그를 제거한다", () => {
    const out = stripHtml('<img src=x onerror="alert(1)">사진');
    expect(out).not.toContain("<img");
    expect(out).not.toContain(">");
    expect(out).toContain("사진");
  });

  it("닫히지 않은 꺾쇠 괄호도 결과에 남지 않는다", () => {
    const out = stripHtml("hello <world");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("HTML이 없는 일반 텍스트는 그대로 둔다", () => {
    expect(stripHtml("공사 현장 13층")).toBe("공사 현장 13층");
  });
});

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

describe("portalChatMessageSchema", () => {
  it("content와 displayName에서 script 페이로드를 제거한다", () => {
    const result = portalChatMessageSchema.safeParse({
      content: '<script>alert("xss")</script>문의드립니다',
      displayName: '<img src=x onerror="alert(1)">홍길동',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).not.toContain("<script");
      expect(result.data.content).not.toContain(">");
      expect(result.data.content).toContain("문의드립니다");
      expect(result.data.displayName).not.toContain("<img");
      expect(result.data.displayName).toContain("홍길동");
    }
  });

  it("content가 빈 문자열이면 거부한다", () => {
    const empty = portalChatMessageSchema.safeParse({
      content: "",
      displayName: "홍길동",
    });
    expect(empty.success).toBe(false);
  });

  it("sanitize 후 공백만 남으면 거부한다", () => {
    const tagsOnly = portalChatMessageSchema.safeParse({
      content: "<div>   </div>",
      displayName: "홍길동",
    });
    expect(tagsOnly.success).toBe(false);
  });

  it("displayName이 누락되면 거부한다", () => {
    const missing = portalChatMessageSchema.safeParse({
      content: "안녕하세요",
    });
    expect(missing.success).toBe(false);
  });

  it("비문자열 content는 거부한다", () => {
    const nonString = portalChatMessageSchema.safeParse({
      content: 42,
      displayName: "홍길동",
    });
    expect(nonString.success).toBe(false);
  });

  it("긴 content는 4000자로 잘린다", () => {
    const huge = "가".repeat(5000);
    const result = portalChatMessageSchema.safeParse({
      content: huge,
      displayName: "홍길동",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content.length).toBe(4000);
    }
  });

  it("password는 선택적이다", () => {
    const noPassword = portalChatMessageSchema.safeParse({
      content: "안녕하세요",
      displayName: "홍길동",
    });
    expect(noPassword.success).toBe(true);

    const withPassword = portalChatMessageSchema.safeParse({
      content: "안녕하세요",
      displayName: "홍길동",
      password: "secret",
    });
    expect(withPassword.success).toBe(true);
    if (withPassword.success) {
      expect(withPassword.data.password).toBe("secret");
    }
  });
});
