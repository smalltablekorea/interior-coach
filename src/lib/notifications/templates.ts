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

/** payload 값을 안전하게 문자열로 변환 */
function safe(val: unknown): string {
  if (val == null) return "";
  return String(val).replace(/[<>"'&]/g, "");
}

/**
 * 이벤트별 한국어 메시지 템플릿
 * 수신 대상: 업체 내부 관계자 (반장/자재상/매니저)
 * 톤: 간결한 업무 보고체
 */
export function renderTemplate(
  eventType: NotificationEventType,
  payload: Record<string, unknown>,
): TemplateResult {
  const siteName = safe(payload.siteName);
  const siteId = safe(payload.siteId);

  switch (eventType) {
    case "phase_delayed":
      return {
        title: `공정지연 ${siteName}`,
        message: `${siteName} "${safe(payload.category)}" ${safe(payload.daysDelayed)}일 지연. 확인 필요.`,
        link: `/construction?siteId=${siteId}`,
      };

    case "payment_due": {
      const daysUntil = Number(payload.daysUntil) || 0;
      const label = daysUntil === 0 ? "당일" : `D-${daysUntil}`;
      return {
        title: `수금예정 ${siteName} ${label}`,
        message: `${siteName} ${safe(payload.paymentType)} ${fmtAmount(payload.amount)} 만기 ${label}.`,
        link: `/contracts?siteId=${siteId}`,
      };
    }

    case "payment_overdue":
      return {
        title: `수금연체 ${siteName}`,
        message: `${siteName} ${safe(payload.paymentType)} ${fmtAmount(payload.amount)} ${safe(payload.daysOverdue)}일 연체.`,
        link: `/contracts?siteId=${siteId}`,
      };

    case "defect_status":
      return {
        title: `하자변경 ${siteName}`,
        message: `${siteName} "${safe(payload.defectTitle)}" ${safe(payload.oldStatus)}→${safe(payload.newStatus)}.`,
        link: `/construction?tab=defects&siteId=${siteId}`,
      };

    case "billing_overdue":
      return {
        title: `청구연체 ${siteName}`,
        message: `${siteName} "${safe(payload.milestoneName)}" ${fmtAmount(payload.amount)} 연체.`,
        link: `/settlement?siteId=${siteId}`,
      };

    case "photo_upload":
      return {
        title: `사진등록 ${siteName}`,
        message: `${siteName} 사진 ${safe(payload.count)}장 등록.`,
        link: `/sites/${siteId}?tab=photos`,
      };

    case "change_request":
      return {
        title: `변경요청 ${siteName}`,
        message: `${siteName} 고객이 "${safe(payload.title)}" 변경 요청. 검토 필요.`,
        link: `/sites/${siteId}?tab=changes`,
      };

    default:
      return {
        title: "알림",
        message: String(payload.message || "새 알림"),
        link: "/dashboard",
      };
  }
}

function fmtAmount(val: unknown): string {
  const num = Number(val) || 0;
  if (num >= 10000) return `${Math.round(num / 10000).toLocaleString()}만원`;
  return `${num.toLocaleString()}원`;
}

/** SMS용 메시지 (90바이트 이하 = SMS, 초과 = LMS) */
export function renderSmsMessage(
  eventType: NotificationEventType,
  payload: Record<string, unknown>,
): { text: string; isLms: boolean } {
  const { title, message } = renderTemplate(eventType, payload);
  const text = `[인테리어코치] ${title}\n${message}`;
  let byteLength = 0;
  for (const ch of text) {
    byteLength += ch.charCodeAt(0) > 127 ? 2 : 1;
  }
  return { text, isLms: byteLength > 90 };
}
