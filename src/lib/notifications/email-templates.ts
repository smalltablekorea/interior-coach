/**
 * 이메일 템플릿 — 견적서/결제 관련
 * AI-26: 실시간 알림 시스템
 */

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@interiorcoach.kr";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://interiorcoach.kr";

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function guardResend(): SendResult | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY 미설정 — 이메일 발송 건너뜀");
    return { success: false, error: "RESEND_API_KEY가 설정되지 않았습니다" };
  }
  return null;
}

// ─── 견적서 완성 → 고객 이메일 ───

export async function sendEstimateReadyEmail(params: {
  to: string;
  customerName: string;
  siteName: string;
  totalAmount: string;
  estimateUrl: string;
  companyName: string;
}): Promise<SendResult> {
  const guard = guardResend();
  if (guard) return guard;

  try {
    const { data, error } = await getResend().emails.send({
      from: `인테리어코치 <${FROM_EMAIL}>`,
      to: params.to,
      subject: `[${params.companyName}] ${params.siteName} 견적서가 준비되었습니다`,
      html: buildEstimateReadyHtml(params),
    });
    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: `이메일 발송 실패: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function buildEstimateReadyHtml(params: {
  customerName: string;
  siteName: string;
  totalAmount: string;
  estimateUrl: string;
  companyName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#533afd,#7c5cfc);padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">${esc(params.companyName)}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">견적서 안내</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="margin:0 0 8px;color:#111;font-size:18px;font-weight:600">${esc(params.customerName)}님, 안녕하세요.</p>
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
            <strong>${esc(params.siteName)}</strong> 견적서가 준비되었습니다.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;border-radius:8px;padding:20px;margin:0 0 24px">
            <tr><td>
              <p style="margin:0 0 4px;color:#888;font-size:13px">견적 금액</p>
              <p style="margin:0;color:#533afd;font-size:28px;font-weight:700">${esc(params.totalAmount)}</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 32px">
              <a href="${esc(params.estimateUrl)}" style="display:inline-block;background:#533afd;color:#fff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none">견적서 확인하기</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#999;font-size:13px;line-height:1.5">
            궁금한 사항이 있으시면 언제든 연락해주세요.<br>
            감사합니다.
          </p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:20px 40px;text-align:center">
          <p style="margin:0;color:#aaa;font-size:12px">인테리어코치 | 인테리어 현장 관리 솔루션</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── 결제 완료 → 감사 이메일 + 영수증 ───

export async function sendPaymentReceiptEmail(params: {
  to: string;
  customerName: string;
  siteName: string;
  amount: string;
  paymentType: string;
  paymentDate: string;
  receiptItems: { label: string; amount: string }[];
  companyName: string;
  businessNumber?: string;
}): Promise<SendResult> {
  const guard = guardResend();
  if (guard) return guard;

  try {
    const { data, error } = await getResend().emails.send({
      from: `인테리어코치 <${FROM_EMAIL}>`,
      to: params.to,
      subject: `[${params.companyName}] 결제가 완료되었습니다 — ${params.siteName}`,
      html: buildPaymentReceiptHtml(params),
    });
    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: `이메일 발송 실패: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function buildPaymentReceiptHtml(params: {
  customerName: string;
  siteName: string;
  amount: string;
  paymentType: string;
  paymentDate: string;
  receiptItems: { label: string; amount: string }[];
  companyName: string;
  businessNumber?: string;
}): string {
  const itemRows = params.receiptItems
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;color:#555;font-size:14px;border-bottom:1px solid #eee">${esc(item.label)}</td><td style="padding:8px 0;color:#111;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #eee">${esc(item.amount)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">결제 완료 ✓</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${esc(params.companyName)}</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
            ${esc(params.customerName)}님, 결제해 주셔서 감사합니다.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td style="padding:8px 0;color:#888;font-size:13px">현장</td><td style="padding:8px 0;color:#111;font-size:14px;text-align:right">${esc(params.siteName)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">결제유형</td><td style="padding:8px 0;color:#111;font-size:14px;text-align:right">${esc(params.paymentType)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">결제일</td><td style="padding:8px 0;color:#111;font-size:14px;text-align:right">${esc(params.paymentDate)}</td></tr>
          </table>
          <hr style="border:0;border-top:2px solid #eee;margin:0 0 16px">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
            <tr><td style="padding:12px 0 0;color:#111;font-size:16px;font-weight:700">합계</td><td style="padding:12px 0 0;color:#10b981;font-size:20px;font-weight:700;text-align:right">${esc(params.amount)}</td></tr>
          </table>
          ${params.businessNumber ? `<p style="margin:24px 0 0;color:#aaa;font-size:12px">사업자번호: ${esc(params.businessNumber)}</p>` : ""}
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:20px 40px;text-align:center">
          <p style="margin:0;color:#aaa;font-size:12px">인테리어코치 | 인테리어 현장 관리 솔루션</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── 시공 일정 D-3/D-1 → 고객 SMS 알림 ───

export function buildScheduleReminderSms(params: {
  customerName: string;
  siteName: string;
  scheduledDate: string;
  daysUntil: number;
  category: string;
  companyName: string;
}): string {
  const dLabel = params.daysUntil === 0 ? "오늘" : `${params.daysUntil}일 후`;
  return [
    `[${params.companyName}]`,
    `${params.customerName}님, ${params.siteName}`,
    `"${params.category}" 공정이 ${dLabel} (${params.scheduledDate}) 시작됩니다.`,
    `궁금하신 사항은 연락주세요.`,
  ].join("\n");
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
