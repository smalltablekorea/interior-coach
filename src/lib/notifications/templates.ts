/** 알림 이벤트 타입 */
export type NotificationEventType =
  | "phase_delayed"
  | "payment_due"
  | "payment_overdue"
  | "defect_status"
  | "billing_overdue"
  | "photo_upload"
  | "change_request";

interface TemplateResult {
  title: string;
  message: string;
  link: string;
}

/** payload 값을 안전하게 문자열로 변환 (SQL injection 방지) */
function safe(val: unknown): string {
  if (val == null) return "";
  return String(val).replace(/[<>"'&]/g, "");
}

/** 이벤트별 한국어 메시지 템플릿 */
export function renderTemplate(
  eventType: NotificationEventType,
  payload: Record<string, unknown>,
): TemplateResult {
  const siteName = safe(payload.siteName);
  const siteId = safe(payload.siteId);

  switch (eventType) {
    case "phase_delayed":
      return {
        title: `[공정 지연] ${siteName}`,
        message: `${siteName} 현장의 "${safe(payload.category)}" 공정이 ${safe(payload.daysDelayed)}일 지연되었습니다. 확인이 필요합니다.`,
        link: `/construction?siteId=${siteId}`,
      };

    case "payment_due": {
      const daysUntil = Number(payload.daysUntil) || 0;
      const label = daysUntil === 0 ? "오늘" : `${daysUntil}일 후`;
      return {
        title: `[수금 알림] ${siteName}`,
        message: `${siteName} 현장의 ${safe(payload.paymentType)} ${fmtAmount(payload.amount)}이 ${label} 만기입니다.`,
        link: `/contracts?siteId=${siteId}`,
      };
    }

    case "payment_overdue":
      return {
        title: `[수금 연체] ${siteName}`,
        message: `${siteName} 현장의 ${safe(payload.paymentType)} ${fmtAmount(payload.amount)}이 ${safe(payload.daysOverdue)}일 연체 중입니다.`,
        link: `/contracts?siteId=${siteId}`,
      };

    case "defect_status":
      return {
        title: `[하자 상태변경] ${siteName}`,
        message: `${siteName} 현장의 하자 "${safe(payload.defectTitle)}"가 ${safe(payload.oldStatus)} → ${safe(payload.newStatus)}로 변경되었습니다.`,
        link: `/construction?tab=defects&siteId=${siteId}`,
      };

    case "billing_overdue":
      return {
        title: `[청구 연체] ${siteName}`,
        message: `${siteName} 현장의 "${safe(payload.milestoneName)}" 청구서 ${fmtAmount(payload.amount)}이 연체되었습니다.`,
        link: `/settlement?siteId=${siteId}`,
      };

    case "photo_upload":
      return {
        title: `[사진 업로드] ${siteName}`,
        message: `${siteName} 현장에 새 사진이 ${safe(payload.count)}장 업로드되었습니다.`,
        link: `/sites/${siteId}?tab=photos`,
      };

    case "change_request":
      return {
        title: `[고객 변경요청] ${siteName}`,
        message: `${safe(payload.customerName)}님이 "${safe(payload.title)}" 변경을 요청했습니다.`,
        link: `/sites/${siteId}?tab=changes`,
      };

    default:
      return {
        title: "알림",
        message: String(payload.message || "새 알림이 있습니다."),
        link: "/dashboard",
      };
  }
}

function fmtAmount(val: unknown): string {
  const num = Number(val) || 0;
  if (num >= 10000) return `${Math.round(num / 10000).toLocaleString()}만원`;
  return `${num.toLocaleString()}원`;
}

/** SMS용 짧은 메시지 (90바이트 이하 = SMS, 초과 = LMS) */
export function renderSmsMessage(
  eventType: NotificationEventType,
  payload: Record<string, unknown>,
): { text: string; isLms: boolean } {
  const { title, message } = renderTemplate(eventType, payload);
  const text = `[인테리어코치] ${title}\n${message}`;
  // 한국어 SMS: 한글 1자 = 2바이트, 영문/숫자 = 1바이트 (EUC-KR 기준)
  let byteLength = 0;
  for (const ch of text) {
    byteLength += ch.charCodeAt(0) > 127 ? 2 : 1;
  }
  return { text, isLms: byteLength > 90 };
}
