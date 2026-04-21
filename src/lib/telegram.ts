/**
 * 텔레그램 봇 알림 — 대표님/관리자에게 중요 이벤트 알림
 * AI-26: 실시간 알림 시스템
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * 텔레그램 메시지 발송
 */
export async function sendTelegram(
  chatId: string,
  text: string,
  options?: { parseMode?: "HTML" | "Markdown"; silent?: boolean },
): Promise<TelegramResult> {
  if (!BOT_TOKEN) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN 미설정 — 발송 건너뜀");
    return { success: false, error: "TELEGRAM_BOT_TOKEN이 설정되지 않았습니다" };
  }

  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode ?? "HTML",
        disable_notification: options?.silent ?? false,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || "텔레그램 발송 실패" };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err) {
    return {
      success: false,
      error: `텔레그램 발송 오류: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 견적 요청 접수 알림
 */
export function formatEstimateRequestAlert(params: {
  customerName: string;
  siteName: string;
  areaPyeong?: number;
  estimatedAmount?: string;
}): string {
  return [
    `🏠 <b>새 견적 요청 접수</b>`,
    ``,
    `👤 고객: ${escapeHtml(params.customerName)}`,
    `📍 현장: ${escapeHtml(params.siteName)}`,
    params.areaPyeong ? `📐 면적: ${params.areaPyeong}평` : null,
    params.estimatedAmount ? `💰 예상금액: ${params.estimatedAmount}` : null,
    ``,
    `⏰ ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 결제 완료 알림
 */
export function formatPaymentCompleteAlert(params: {
  customerName: string;
  siteName: string;
  amount: string;
  paymentType: string;
}): string {
  return [
    `💳 <b>결제 완료</b>`,
    ``,
    `👤 고객: ${escapeHtml(params.customerName)}`,
    `📍 현장: ${escapeHtml(params.siteName)}`,
    `💰 금액: ${params.amount}`,
    `📝 유형: ${escapeHtml(params.paymentType)}`,
    ``,
    `⏰ ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
  ].join("\n");
}

/**
 * 일반 업무 알림
 */
export function formatBusinessAlert(title: string, details: string): string {
  return `📢 <b>${escapeHtml(title)}</b>\n\n${escapeHtml(details)}\n\n⏰ ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
