/**
 * 카카오 알림톡 발송.
 *
 * 환경변수로 mock ↔ 실 발송 전환.
 *
 * 실 발송 (Solapi 알림톡 ATA) 조건:
 *   - ALIMTALK_ENABLED=true
 *   - SOLAPI_API_KEY, SOLAPI_API_SECRET 설정됨
 *   - KAKAO_PF_ID (카카오톡 발신 프로필 ID)
 *   - 템플릿별 KAKAO_TEMPLATE_PORTAL_FIRST / KAKAO_TEMPLATE_WEEKLY / KAKAO_TEMPLATE_MISSING ID
 *
 * 위 조건 중 하나라도 빠지면 mock 모드 (콘솔 로그).
 *
 * 비즈채널 미등록 상태에서는 ALIMTALK_ENABLED=false (기본값) 유지.
 */

import crypto from "crypto";

export type AlimtalkTemplate =
  | "A_PORTAL_FIRST"
  | "B_WEEKLY_REMINDER"
  | "C_MISSING_RESEND";

export interface AlimtalkResult {
  sent: boolean;
  channel: "mock" | "kakao";
  template: AlimtalkTemplate;
  to: string;
  body: string;
  messageId?: string;
  error?: string;
}

const SENDER_PREFIX = "[스몰테이블 마케팅 대행]";

const SOLAPI_BASE = "https://api.solapi.com";
const ALIMTALK_ENABLED = process.env.ALIMTALK_ENABLED === "true";
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const KAKAO_PF_ID = process.env.KAKAO_PF_ID;
const KAKAO_TEMPLATES: Record<AlimtalkTemplate, string | undefined> = {
  A_PORTAL_FIRST: process.env.KAKAO_TEMPLATE_PORTAL_FIRST,
  B_WEEKLY_REMINDER: process.env.KAKAO_TEMPLATE_WEEKLY,
  C_MISSING_RESEND: process.env.KAKAO_TEMPLATE_MISSING,
};

function realSendEnabled(template: AlimtalkTemplate): boolean {
  return !!(
    ALIMTALK_ENABLED &&
    SOLAPI_API_KEY &&
    SOLAPI_API_SECRET &&
    KAKAO_PF_ID &&
    KAKAO_TEMPLATES[template]
  );
}

function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatMMDD(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/** 입력일 기준 이번 주 일요일(같은 주). 일요일 입력 시 본인 반환. */
function thisWeekSunday(now: Date = new Date()): Date {
  const day = now.getDay(); // 0(일) ~ 6(토)
  const offset = day === 0 ? 0 : 7 - day;
  const sun = new Date(now);
  sun.setHours(0, 0, 0, 0);
  sun.setDate(sun.getDate() + offset);
  return sun;
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  return digits;
}

function solapiAuth(): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const hmac = crypto.createHmac("sha256", SOLAPI_API_SECRET!);
  hmac.update(date + salt);
  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY!}, date=${date}, salt=${salt}, signature=${hmac.digest("hex")}`;
}

async function sendRealAlimtalk(
  template: AlimtalkTemplate,
  to: string,
  body: string,
): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const phone = normalizePhone(to);
  if (!phone) return { ok: false, error: `invalid phone: ${to}` };

  const payload = {
    messages: [
      {
        to: phone,
        from: KAKAO_PF_ID,
        type: "ATA",
        kakaoOptions: {
          pfId: KAKAO_PF_ID,
          templateId: KAKAO_TEMPLATES[template],
          disableSms: false, // 알림톡 실패 시 SMS fallback
          variables: { "#{body}": body },
        },
        text: body, // SMS fallback 본문
      },
    ],
  };

  try {
    const resp = await fetch(`${SOLAPI_BASE}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: solapiAuth(),
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      return { ok: false, error: `Solapi HTTP ${resp.status}: ${errBody.slice(0, 200)}` };
    }
    const data = await resp.json();
    const failed = data?.failedMessageList?.[0];
    if (failed) return { ok: false, error: `Solapi 발송 실패: ${failed.reason || "unknown"}` };
    return { ok: true, messageId: data?.groupId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function logMock(result: AlimtalkResult): AlimtalkResult {
  // eslint-disable-next-line no-console
  console.log(
    "[alimtalk:mock]",
    JSON.stringify(
      { template: result.template, to: result.to, body: result.body },
      null,
      2,
    ),
  );
  return result;
}

async function dispatch(
  template: AlimtalkTemplate,
  to: string,
  body: string,
): Promise<AlimtalkResult> {
  if (!realSendEnabled(template)) {
    return logMock({
      sent: true,
      channel: "mock",
      template,
      to,
      body,
    });
  }
  const r = await sendRealAlimtalk(template, to, body);
  // eslint-disable-next-line no-console
  console.log(
    `[alimtalk:kakao] template=${template} to=${to} ${r.ok ? `ok messageId=${r.messageId ?? "-"}` : `FAIL ${r.error}`}`,
  );
  if (r.ok) {
    return { sent: true, channel: "kakao", template, to, body, messageId: r.messageId };
  }
  return { sent: false, channel: "kakao", template, to, body, error: r.error };
}

export async function sendPortalLink(args: {
  businessName: string;
  contactPhone?: string | null;
  portalUrl: string;
  contractEndDate: Date;
}): Promise<AlimtalkResult> {
  const body = [
    `${SENDER_PREFIX} ${args.businessName} 대표님, 마케팅 대행 서비스가 시작되었습니다.`,
    `매주 시공 사진을 아래 링크에서 업로드해 주세요. 같은 링크를 계속 사용하시면 됩니다.`,
    args.portalUrl,
    `※ 약정 종료 시점(${formatYmd(args.contractEndDate)})까지 유효합니다.`,
  ].join("\n");
  return dispatch("A_PORTAL_FIRST", args.contactPhone || "(미입력)", body);
}

export async function sendWeeklyReminder(args: {
  businessName: string;
  contactPhone?: string | null;
  portalUrl: string;
}): Promise<AlimtalkResult> {
  const sun = thisWeekSunday();
  const body = [
    `${SENDER_PREFIX} ${args.businessName} 대표님, 이번 주 (${formatMMDD(sun)} 23:59까지) 시공 사진 업로드 부탁드립니다.`,
    args.portalUrl,
  ].join("\n");
  return dispatch("B_WEEKLY_REMINDER", args.contactPhone || "(미입력)", body);
}

export async function sendMissingResend(args: {
  businessName: string;
  contactPhone?: string | null;
  portalUrl: string;
}): Promise<AlimtalkResult> {
  const body = [
    `${SENDER_PREFIX} ${args.businessName} 대표님, 지난 주 시공 사진이 아직 업로드되지 않았습니다.`,
    `시간 되실 때 업로드 부탁드립니다 :)`,
    args.portalUrl,
  ].join("\n");
  return dispatch("C_MISSING_RESEND", args.contactPhone || "(미입력)", body);
}
