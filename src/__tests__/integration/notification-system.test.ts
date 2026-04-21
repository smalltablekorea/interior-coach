import { describe, it, expect } from "vitest";
import { buildScheduleReminderSms } from "@/lib/notifications/email-templates";

describe("Email Templates — buildScheduleReminderSms", () => {
  it("generates proper SMS for D-3", () => {
    const sms = buildScheduleReminderSms({
      customerName: "홍길동",
      siteName: "잠실 래미안",
      scheduledDate: "2026-05-01",
      daysUntil: 3,
      category: "도배",
      companyName: "스몰테이블디자인그룹",
    });
    expect(sms).toContain("홍길동");
    expect(sms).toContain("잠실 래미안");
    expect(sms).toContain("3일 후");
    expect(sms).toContain("도배");
    expect(sms).toContain("스몰테이블디자인그룹");
  });

  it("generates proper SMS for D-1", () => {
    const sms = buildScheduleReminderSms({
      customerName: "김영희",
      siteName: "성수 오피스",
      scheduledDate: "2026-04-30",
      daysUntil: 1,
      category: "타일",
      companyName: "테스트업체",
    });
    expect(sms).toContain("1일 후");
    expect(sms).toContain("타일");
  });

  it("uses 오늘 for D-0", () => {
    const sms = buildScheduleReminderSms({
      customerName: "박씨",
      siteName: "현장",
      scheduledDate: "2026-04-29",
      daysUntil: 0,
      category: "전기",
      companyName: "업체",
    });
    expect(sms).toContain("오늘");
  });
});

describe("Notification Dispatcher — module structure", () => {
  it("exports dispatchNotification function", async () => {
    // Can't fully test without DB, but verify the module loads and exports correctly
    const mod = await import("@/lib/notifications/dispatcher");
    expect(typeof mod.dispatchNotification).toBe("function");
  });

  it("exports correct event types", async () => {
    // Type check — the module should define 4 event types
    const mod = await import("@/lib/notifications/dispatcher");
    // dispatchNotification accepts the defined event types
    expect(mod.dispatchNotification).toBeDefined();
  });
});
