import crypto from "crypto";

const API_KEY = process.env.SOLAPI_API_KEY || "";
const API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SENDER = process.env.SOLAPI_SENDER_NUMBER || "";
const BASE_URL = "https://api.solapi.com";

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** HMAC-SHA256 서명 생성 */
function generateSignature(): { authorization: string; date: string } {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const hmac = crypto.createHmac("sha256", API_SECRET);
  hmac.update(date + salt);
  const signature = hmac.digest("hex");

  return {
    authorization: `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
    date,
  };
}

/** SMS/LMS 자동 분기 발송 */
export async function sendSms(
  to: string,
  text: string,
  isLms: boolean = false,
): Promise<SendResult> {
  if (!API_KEY || !API_SECRET || !SENDER) {
    return { success: false, error: "Solapi 환경변수가 설정되지 않았습니다 (SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER_NUMBER)" };
  }

  // 전화번호 정규화 (하이픈 제거)
  const phone = to.replace(/[^0-9]/g, "");
  if (phone.length < 10 || phone.length > 11) {
    return { success: false, error: `유효하지 않은 전화번호: ${to}` };
  }

  const { authorization } = generateSignature();
  const body = {
    messages: [{
      to: phone,
      from: SENDER,
      text,
      type: isLms ? "LMS" : "SMS",
      ...(isLms ? { subject: "[인테리어코치]" } : {}),
    }],
  };

  try {
    const res = await fetch(`${BASE_URL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Solapi HTTP ${res.status}: ${errBody}` };
    }

    const data = await res.json();
    const firstResult = data?.failedMessageList?.[0];
    if (firstResult) {
      return { success: false, error: `Solapi 발송 실패: ${firstResult.reason || "unknown"}` };
    }

    const successMsg = data?.successfulMessageList?.[0];
    return {
      success: true,
      messageId: successMsg?.messageId || data?.groupId || undefined,
    };
  } catch (error) {
    return { success: false, error: `Solapi 네트워크 오류: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/** Rate limiting: 100ms delay (Solapi 초당 10건 제한) */
export function rateLimitDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 100));
}
