import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@interiorcoach.kr";

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** 워크스페이스 초대 이메일 발송 */
export async function sendInviteEmail(params: {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY 미설정 — 이메일 발송 건너뜀");
    return { success: false, error: "RESEND_API_KEY가 설정되지 않았습니다" };
  }

  const roleLabel: Record<string, string> = {
    admin: "관리자",
    manager: "매니저",
    member: "멤버",
    viewer: "뷰어",
  };

  try {
    const { data, error } = await getResend().emails.send({
      from: `인테리어코치 <${FROM_EMAIL}>`,
      to: params.to,
      subject: `[인테리어코치] ${params.workspaceName} 워크스페이스에 초대되었습니다`,
      html: buildInviteHtml({
        workspaceName: params.workspaceName,
        inviterName: params.inviterName,
        role: roleLabel[params.role] || params.role,
        inviteUrl: params.inviteUrl,
      }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: `이메일 발송 실패: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function buildInviteHtml(params: {
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr><td style="background:#2563eb;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">인테리어코치</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 8px;color:#111;font-size:20px;font-weight:600">워크스페이스 초대</h2>
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
            <strong>${escapeHtml(params.inviterName)}</strong>님이 <strong>${escapeHtml(params.workspaceName)}</strong> 워크스페이스에 <strong>${escapeHtml(params.role)}</strong> 역할로 초대했습니다.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 32px">
              <a href="${escapeHtml(params.inviteUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600">
                초대 수락하기
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#888;font-size:13px">버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
          <p style="margin:0;color:#2563eb;font-size:13px;word-break:break-all">${escapeHtml(params.inviteUrl)}</p>
          <hr style="margin:32px 0;border:none;border-top:1px solid #eee">
          <p style="margin:0;color:#aaa;font-size:12px">이 초대는 7일 후 만료됩니다. 본인이 요청하지 않은 초대라면 이 이메일을 무시하세요.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
