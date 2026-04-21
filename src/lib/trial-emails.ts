import { Resend } from "resend";
import { PLANS } from "@/lib/plans";

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

interface TrialNudgeEmailParams {
  to: string;
  userName: string;
  daysLeft: number;
  plan: keyof typeof PLANS;
  userId: string;
}

/** 트라이얼 만료 넛지 이메일 발송 */
export async function sendTrialNudgeEmail(params: TrialNudgeEmailParams): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[trial-email] RESEND_API_KEY 미설정 — 이메일 발송 건너뜀");
    return { success: false, error: "RESEND_API_KEY가 설정되지 않았습니다" };
  }

  try {
    const planConfig = PLANS[params.plan];
    const upgradeUrl = `https://interiorcoach.kr/pricing?utm_source=email&utm_medium=trial_nudge&utm_campaign=d${params.daysLeft}&user_id=${params.userId}`;

    const { subject, html } = buildTrialNudgeEmail({
      userName: params.userName,
      daysLeft: params.daysLeft,
      plan: params.plan,
      planConfig,
      upgradeUrl,
    });

    const { data, error } = await getResend().emails.send({
      from: `인테리어코치 <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      html,
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

function buildTrialNudgeEmail(params: {
  userName: string;
  daysLeft: number;
  plan: keyof typeof PLANS;
  planConfig: typeof PLANS[keyof typeof PLANS];
  upgradeUrl: string;
}): { subject: string; html: string } {
  const { userName, daysLeft, planConfig, upgradeUrl } = params;

  // 일수에 따른 메시지 톤 조절
  const urgencyData = getUrgencyData(daysLeft);

  const subject = `${urgencyData.emoji} ${urgencyData.subjectPrefix} — 무료체험 ${daysLeft}일 남음`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:${urgencyData.headerColor};padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">인테리어코치</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${urgencyData.headerSubtext}</p>
        </td></tr>

        <!-- Main Content -->
        <tr><td style="padding:48px 40px;">

          <div style="text-align:center;margin-bottom:32px;">
            <div style="background:${urgencyData.badgeColor};color:${urgencyData.badgeTextColor};display:inline-block;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;margin-bottom:16px;">
              ${urgencyData.badge}
            </div>
            <h2 style="margin:0 0 12px;color:#1e293b;font-size:28px;font-weight:700;">
              안녕하세요, ${escapeHtml(userName)}님! ${urgencyData.emoji}
            </h2>
            <p style="margin:0;color:#64748b;font-size:16px;line-height:1.6;">
              ${urgencyData.mainMessage}
            </p>
          </div>

          <!-- Trial Status Card -->
          <div style="background:#f1f5f9;border-radius:12px;padding:24px;margin-bottom:32px;text-align:center;">
            <div style="color:#475569;font-size:14px;font-weight:500;margin-bottom:8px;">현재 체험 중인 플랜</div>
            <div style="color:#1e293b;font-size:20px;font-weight:700;margin-bottom:4px;">${planConfig.nameKo} 플랜</div>
            <div style="color:#ef4444;font-size:16px;font-weight:600;">
              <span style="background:#fef2f2;padding:4px 12px;border-radius:8px;">
                ${daysLeft}일 후 체험 종료
              </span>
            </div>
          </div>

          <!-- Benefits Section -->
          <div style="margin-bottom:32px;">
            <h3 style="margin:0 0 16px;color:#1e293b;font-size:18px;font-weight:600;">
              ${urgencyData.benefitsTitle}
            </h3>
            ${buildPlanBenefits(planConfig)}
          </div>

          <!-- CTA Section -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${escapeHtml(upgradeUrl)}" style="display:inline-block;background:${urgencyData.ctaColor};color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px ${urgencyData.ctaShadow};transition:transform 0.2s;">
              ${urgencyData.ctaText}
            </a>
            <p style="margin:16px 0 0;color:#64748b;font-size:14px;">
              클릭 한 번으로 간편하게 구독하고 모든 기능을 계속 이용하세요
            </p>
          </div>

          <!-- Social Proof / Success Story -->
          ${buildSocialProof(daysLeft)}

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:32px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6;">
            궁금한 점이 있으시면 언제든 <a href="mailto:support@interiorcoach.kr" style="color:#3b82f6;text-decoration:none;">support@interiorcoach.kr</a>로 문의해주세요.
          </p>
          <div style="color:#94a3b8;font-size:12px;">
            인테리어코치 | 중소 인테리어 업체를 위한 올인원 솔루션<br>
            이 이메일은 무료체험 사용자에게 발송되었습니다.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function getUrgencyData(daysLeft: number) {
  switch (daysLeft) {
    case 7:
      return {
        emoji: "🎯",
        subjectPrefix: "7일의 기회가 남았습니다",
        headerColor: "#3b82f6",
        headerSubtext: "아직 일주일의 여유가 있어요",
        badge: "체험 7일 남음",
        badgeColor: "#dbeafe",
        badgeTextColor: "#1d4ed8",
        mainMessage: "인테리어코치를 체험해주셔서 감사합니다! 아직 7일의 시간이 남았지만, 지금이 최적의 구독 타이밍입니다.",
        benefitsTitle: "구독하시면 계속 이용할 수 있어요",
        ctaText: "지금 구독하기",
        ctaColor: "#3b82f6",
        ctaShadow: "rgba(59, 130, 246, 0.3)"
      };
    case 3:
      return {
        emoji: "⚠️",
        subjectPrefix: "체험 종료 3일 전",
        headerColor: "#f59e0b",
        headerSubtext: "곧 체험이 종료됩니다",
        badge: "체험 3일 남음",
        badgeColor: "#fef3c7",
        badgeTextColor: "#92400e",
        mainMessage: "체험 종료가 3일 앞으로 다가왔습니다. 지금까지 쌓아온 소중한 데이터를 잃지 마시고 계속 이용해보세요!",
        benefitsTitle: "지금 구독하면 데이터가 그대로 보존됩니다",
        ctaText: "데이터 보존하고 구독하기",
        ctaColor: "#f59e0b",
        ctaShadow: "rgba(245, 158, 11, 0.3)"
      };
    case 0:
      return {
        emoji: "🔒",
        subjectPrefix: "무료 체험이 오늘 종료됩니다",
        headerColor: "#dc2626",
        headerSubtext: "체험 기간이 만료되었습니다",
        badge: "체험 종료",
        badgeColor: "#fecaca",
        badgeTextColor: "#dc2626",
        mainMessage: "오늘 무료 체험이 종료됩니다. 지금 구독하시면 데이터를 그대로 유지하며 모든 기능을 계속 사용하실 수 있습니다.",
        benefitsTitle: "마지막 기회 — 데이터가 보존됩니다",
        ctaText: "지금 구독하고 데이터 보존하기",
        ctaColor: "#dc2626",
        ctaShadow: "rgba(220, 38, 38, 0.3)"
      };
    case 1:
      return {
        emoji: "🚨",
        subjectPrefix: "마지막 기회",
        headerColor: "#ef4444",
        headerSubtext: "체험이 내일 종료됩니다",
        badge: "체험 1일 남음",
        badgeColor: "#fecaca",
        badgeTextColor: "#dc2626",
        mainMessage: "마지막 하루가 남았습니다! 지금 구독하지 않으면 내일부터 모든 기능이 제한됩니다. 놓치기 아까운 기회예요.",
        benefitsTitle: "마지막 기회 — 지금 구독하세요!",
        ctaText: "지금 즉시 구독하기",
        ctaColor: "#ef4444",
        ctaShadow: "rgba(239, 68, 68, 0.3)"
      };
    default:
      return {
        emoji: "📅",
        subjectPrefix: "체험 종료 안내",
        headerColor: "#6b7280",
        headerSubtext: "체험 기간 확인",
        badge: `체험 ${daysLeft}일 남음`,
        badgeColor: "#f3f4f6",
        badgeTextColor: "#374151",
        mainMessage: `체험 종료까지 ${daysLeft}일 남았습니다. 계속 이용하시려면 구독을 고려해보세요.`,
        benefitsTitle: "구독 혜택 확인하기",
        ctaText: "구독하기",
        ctaColor: "#6b7280",
        ctaShadow: "rgba(107, 114, 128, 0.3)"
      };
  }
}

function buildPlanBenefits(planConfig: typeof PLANS[keyof typeof PLANS]): string {
  return `<div style="background:#f8fafc;border-radius:8px;padding:20px;">
    ${planConfig.highlights.map(highlight => `
      <div style="display:flex;align-items:center;margin-bottom:8px;font-size:14px;">
        <span style="color:#10b981;margin-right:8px;font-weight:bold;">✓</span>
        <span style="color:#374151;">${highlight}</span>
      </div>
    `).join('')}
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
      <span style="color:#6b7280;font-size:13px;">월 </span>
      <span style="color:#1e293b;font-size:18px;font-weight:700;">${planConfig.monthlyPrice === 0 ? '무료' : `₩${planConfig.monthlyPrice.toLocaleString()}`}</span>
    </div>
  </div>`;
}

function buildSocialProof(daysLeft: number): string {
  const stories = [
    {
      name: "김대표",
      company: "신림인테리어",
      quote: "구독 후 현장 관리가 50% 효율적이 되었어요. 고객들도 더 만족해하시고요!"
    },
    {
      name: "이사장",
      company: "프리미엄홈",
      quote: "견적서 템플릿으로 시간이 엄청 단축되고, AI 분석으로 정확한 가격 책정이 가능해졌습니다."
    },
    {
      name: "박실장",
      company: "모던스페이스",
      quote: "고객 포털로 소통이 원활해지고, 세무 관리까지 한 번에 해결됩니다."
    }
  ];

  const randomStory = stories[Math.floor(Math.random() * stories.length)];

  if (daysLeft <= 1) {
    return `<div style="background:#f0fdff;border-left:4px solid #0891b2;padding:20px;margin-bottom:24px;">
      <div style="color:#0c4a6e;font-size:14px;font-weight:600;margin-bottom:8px;">🏆 성공 사례</div>
      <div style="color:#374151;font-size:14px;font-style:italic;line-height:1.5;margin-bottom:8px;">
        "${randomStory.quote}"
      </div>
      <div style="color:#64748b;font-size:12px;">
        — ${randomStory.name}, ${randomStory.company}
      </div>
    </div>`;
  }

  return '';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}