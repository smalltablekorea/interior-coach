import { describe, it, expect } from "vitest";
import { renderTemplate, type NotificationEventType } from "@/lib/notifications/templates";

describe("renderTemplate — 알림 템플릿", () => {
  const basePayload = { siteName: "잠실르엘", siteId: "site-123" };

  it("phase_delayed — 공정지연", () => {
    const result = renderTemplate("phase_delayed", {
      ...basePayload,
      category: "타일",
      daysDelayed: 3,
    });
    expect(result.title).toContain("공정지연");
    expect(result.title).toContain("잠실르엘");
    expect(result.message).toContain("타일");
    expect(result.message).toContain("3");
    expect(result.link).toContain("construction");
  });

  it("payment_due — 수금예정 (D-7)", () => {
    const result = renderTemplate("payment_due", {
      ...basePayload,
      paymentType: "중도금",
      amount: 50000000,
      daysUntil: 7,
    });
    expect(result.title).toContain("수금예정");
    expect(result.message).toContain("D-7");
    expect(result.message).toContain("중도금");
    expect(result.link).toContain("contracts");
  });

  it("payment_due — 당일", () => {
    const result = renderTemplate("payment_due", {
      ...basePayload,
      paymentType: "잔금",
      amount: 30000000,
      daysUntil: 0,
    });
    expect(result.message).toContain("당일");
  });

  it("payment_overdue — 수금연체", () => {
    const result = renderTemplate("payment_overdue", {
      ...basePayload,
      paymentType: "계약금",
      amount: 10000000,
      daysOverdue: 5,
    });
    expect(result.title).toContain("수금연체");
    expect(result.message).toContain("5일 연체");
  });

  it("defect_status — 하자변경", () => {
    const result = renderTemplate("defect_status", {
      ...basePayload,
      defectTitle: "벽면 균열",
      oldStatus: "접수",
      newStatus: "수리중",
    });
    expect(result.title).toContain("하자변경");
    expect(result.message).toContain("벽면 균열");
    expect(result.message).toContain("접수→수리중");
  });

  it("photo_upload — 사진등록", () => {
    const result = renderTemplate("photo_upload", {
      ...basePayload,
      count: 15,
    });
    expect(result.title).toContain("사진등록");
    expect(result.message).toContain("15장");
  });

  it("change_request — 변경요청", () => {
    const result = renderTemplate("change_request", {
      ...basePayload,
      title: "주방 상부장 색상 변경",
    });
    expect(result.title).toContain("변경요청");
    expect(result.message).toContain("주방 상부장 색상 변경");
  });

  it("unknown event → 기본 알림", () => {
    const result = renderTemplate("unknown_event" as NotificationEventType, {
      message: "테스트 메시지",
    });
    expect(result.title).toBe("알림");
    expect(result.link).toBe("/dashboard");
  });

  it("XSS payload가 safe() 함수에 의해 방어됨", () => {
    const result = renderTemplate("phase_delayed", {
      siteName: '<script>alert("xss")</script>',
      siteId: "test",
      category: '"><img src=x onerror=alert(1)>',
      daysDelayed: 1,
    });
    // safe() removes < > " ' & characters
    expect(result.title).not.toContain("<script");
    expect(result.title).not.toContain("<");
    expect(result.message).not.toContain("<img");
    expect(result.message).not.toContain("<");
    expect(result.message).not.toContain(">");
  });

  it("null payload 값 처리", () => {
    const result = renderTemplate("phase_delayed", {
      siteName: null,
      siteId: null,
      category: undefined,
      daysDelayed: undefined,
    } as any);
    // Should not throw
    expect(result.title).toBeDefined();
    expect(result.message).toBeDefined();
  });
});
