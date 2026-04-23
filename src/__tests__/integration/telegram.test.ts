import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for Telegram API
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Telegram — sendTelegram", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
  });

  it("returns error when BOT_TOKEN is not set", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "";
    const { sendTelegram } = await import("@/lib/telegram");
    const result = await sendTelegram("123", "test");
    expect(result.success).toBe(false);
    expect(result.error).toContain("TELEGRAM_BOT_TOKEN");
  });

  it("sends message via Telegram API", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test-token-123";
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true, result: { message_id: 42 } }),
    });

    const { sendTelegram } = await import("@/lib/telegram");
    const result = await sendTelegram("123456", "Hello 인테리어코치");
    expect(result.success).toBe(true);
    expect(result.messageId).toBe(42);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("test-token-123/sendMessage");
    const body = JSON.parse(opts.body);
    expect(body.chat_id).toBe("123456");
    expect(body.text).toBe("Hello 인테리어코치");
    expect(body.parse_mode).toBe("HTML");
  });

  it("handles Telegram API error", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({ ok: false, description: "Bad Request: chat not found" }),
    });

    const { sendTelegram } = await import("@/lib/telegram");
    const result = await sendTelegram("999", "test");
    expect(result.success).toBe(false);
    expect(result.error).toContain("chat not found");
  });

  it("handles network error", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

    const { sendTelegram } = await import("@/lib/telegram");
    const result = await sendTelegram("123", "test");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network timeout");
  });
});

describe("Telegram — message formatters", () => {
  it("formatEstimateRequestAlert includes all fields", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test";
    const { formatEstimateRequestAlert } = await import("@/lib/telegram");
    const msg = formatEstimateRequestAlert({
      customerName: "홍길동",
      siteName: "잠실 래미안",
      areaPyeong: 34,
      estimatedAmount: "1.5억",
    });
    expect(msg).toContain("홍길동");
    expect(msg).toContain("잠실 래미안");
    expect(msg).toContain("34평");
    expect(msg).toContain("1.5억");
    expect(msg).toContain("견적 요청");
  });

  it("formatPaymentCompleteAlert includes all fields", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test";
    const { formatPaymentCompleteAlert } = await import("@/lib/telegram");
    const msg = formatPaymentCompleteAlert({
      customerName: "김철수",
      siteName: "성수동 오피스",
      amount: "5,000만원",
      paymentType: "계약금",
    });
    expect(msg).toContain("김철수");
    expect(msg).toContain("5,000만원");
    expect(msg).toContain("계약금");
    expect(msg).toContain("결제 완료");
  });

  it("escapes HTML in message formatters", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test";
    const { formatEstimateRequestAlert } = await import("@/lib/telegram");
    const msg = formatEstimateRequestAlert({
      customerName: "<script>alert(1)</script>",
      siteName: "test & <b>bold</b>",
    });
    expect(msg).not.toContain("<script>");
    expect(msg).toContain("&lt;script&gt;");
    expect(msg).toContain("&amp;");
  });
});
