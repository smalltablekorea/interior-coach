/**
 * 알림 이벤트 디스패처 — 비즈니스 이벤트 발생 시 적절한 채널로 알림
 * AI-26: 실시간 알림 시스템
 * 
 * 사용법:
 *   import { dispatchNotification } from "@/lib/notifications/dispatcher";
 *   await dispatchNotification("estimate_ready", { ... });
 */

import { enqueueNotification } from "./queue";
import { sendTelegram, formatEstimateRequestAlert, formatPaymentCompleteAlert } from "@/lib/telegram";
import { sendEstimateReadyEmail, sendPaymentReceiptEmail } from "./email-templates";
import { sendSms } from "@/lib/solapi";

export type NotificationEvent =
  | "estimate_requested"   // 견적 요청 접수 → 텔레그램
  | "estimate_ready"       // 견적서 완성 → 고객 이메일
  | "payment_complete"     // 결제 완료 → 감사 이메일 + 텔레그램
  | "schedule_reminder";   // 시공 일정 D-3/D-1 → 고객 SMS

interface DispatchResult {
  channels: { channel: string; success: boolean; error?: string }[];
}

/**
 * 통합 알림 디스패처
 * 이벤트 타입에 따라 적절한 채널(텔레그램/이메일/SMS)로 알림 발송
 */
export async function dispatchNotification(
  event: NotificationEvent,
  workspaceId: string,
  payload: Record<string, unknown>,
): Promise<DispatchResult> {
  const results: DispatchResult["channels"] = [];

  try {
    switch (event) {
      case "estimate_requested":
        // 텔레그램으로 대표님/관리자에게 즉시 알림
        const telegramRecipients = await getTelegramRecipients(workspaceId);
        for (const chatId of telegramRecipients) {
          const message = formatEstimateRequestAlert({
            customerName: String(payload.customerName || ""),
            siteName: String(payload.siteName || ""),
            areaPyeong: payload.areaPyeong as number | undefined,
            estimatedAmount: payload.estimatedAmount as string | undefined,
          });
          const r = await sendTelegram(chatId, message);
          results.push({ channel: `telegram:${chatId}`, success: r.success, error: r.error });
        }
        // 인앱 큐에도 추가
        await enqueueNotification(workspaceId, "estimate_requested", payload);
        break;

      case "estimate_ready":
        // 고객에게 이메일 발송
        if (payload.customerEmail) {
          const r = await sendEstimateReadyEmail({
            to: String(payload.customerEmail),
            customerName: String(payload.customerName || "고객"),
            siteName: String(payload.siteName || ""),
            totalAmount: String(payload.totalAmount || ""),
            estimateUrl: String(payload.estimateUrl || ""),
            companyName: String(payload.companyName || "인테리어코치"),
          });
          results.push({ channel: "email", success: r.success, error: r.error });
        }
        break;

      case "payment_complete":
        // 고객에게 영수증 이메일
        if (payload.customerEmail) {
          const r = await sendPaymentReceiptEmail({
            to: String(payload.customerEmail),
            customerName: String(payload.customerName || "고객"),
            siteName: String(payload.siteName || ""),
            amount: String(payload.amount || ""),
            paymentType: String(payload.paymentType || ""),
            paymentDate: String(payload.paymentDate || new Date().toLocaleDateString("ko-KR")),
            receiptItems: (payload.receiptItems as { label: string; amount: string }[]) || [],
            companyName: String(payload.companyName || "인테리어코치"),
            businessNumber: payload.businessNumber as string | undefined,
          });
          results.push({ channel: "email", success: r.success, error: r.error });
        }
        // 대표님 텔레그램 알림
        const payTgRecipients = await getTelegramRecipients(workspaceId);
        for (const chatId of payTgRecipients) {
          const message = formatPaymentCompleteAlert({
            customerName: String(payload.customerName || ""),
            siteName: String(payload.siteName || ""),
            amount: String(payload.amount || ""),
            paymentType: String(payload.paymentType || ""),
          });
          const r = await sendTelegram(chatId, message);
          results.push({ channel: `telegram:${chatId}`, success: r.success, error: r.error });
        }
        break;

      case "schedule_reminder":
        // 고객 SMS 발송
        if (payload.customerPhone) {
          const r = await sendSms(
            String(payload.customerPhone),
            String(payload.smsBody || ""),
          );
          results.push({ channel: "sms", success: r.success, error: r.error });
        }
        break;
    }
  } catch (err) {
    results.push({
      channel: "dispatcher",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { channels: results };
}

/**
 * 워크스페이스의 텔레그램 수신자 목록 조회
 * 
 * 현재 notificationRecipients 테이블에 channel/chatId 컬럼이 없으므로
 * 환경변수 TELEGRAM_NOTIFY_CHAT_ID를 기본으로 사용.
 * 향후 DB 마이그레이션으로 channel+chatId 추가 시 DB 조회로 전환.
 */
async function getTelegramRecipients(_workspaceId: string): Promise<string[]> {
  const defaultChatId = process.env.TELEGRAM_NOTIFY_CHAT_ID;
  return defaultChatId ? [defaultChatId] : [];
}
