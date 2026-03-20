import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { LEAD_SCORE_RULES, MKT_CAMPAIGN_CHANNELS, MKT_CAMPAIGN_CHANNEL_LABELS } from "@/lib/types/marketing";

// 설정 데이터 조회
export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  try {
    // 채널별 연동 상태
    const channels = MKT_CAMPAIGN_CHANNELS.map((ch) => ({
      id: ch,
      label: MKT_CAMPAIGN_CHANNEL_LABELS[ch],
      // 실제 연동 상태는 환경변수/DB 기반으로 판단
      isConnected: getChannelStatus(ch),
      configUrl: getChannelConfigUrl(ch),
    }));

    // 발송 제한 정책
    const sendPolicy = {
      nightSendBlock: { enabled: true, start: "22:00", end: "08:00" },
      maxSendPerUser: { daily: 3, weekly: 10, monthly: 30 },
      dedupeWindow: 24,  // 시간
      globalDailyLimit: 1000,
    };

    // 기본 UTM 규칙
    const defaultUtm = {
      source: "gyeonjeokcoach",
      medium: "{{channel}}",
      campaign: "{{campaign_name}}",
      content: "{{variant}}",
      term: "",
    };

    // 운영자 알림 설정
    const notifications = {
      slackWebhook: process.env.SLACK_WEBHOOK_URL ? "연결됨" : "미연결",
      emailAlerts: true,
      alertThresholds: {
        conversionDropPercent: 20,
        paymentFailurePercent: 15,
        uploadFailurePercent: 10,
      },
    };

    // 리드 점수 규칙
    const leadScoring = LEAD_SCORE_RULES;

    // 개인정보/동의 안내
    const privacy = {
      consentRequired: true,
      consentText: "마케팅 정보 수신에 동의합니다.",
      dataRetentionDays: 365,
      rightToDelete: true,
      privacyPolicyUrl: "/privacy",
    };

    return NextResponse.json({
      channels,
      sendPolicy,
      defaultUtm,
      notifications,
      leadScoring,
      privacy,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "설정 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function getChannelStatus(channel: string): boolean {
  switch (channel) {
    case "email":
      return !!process.env.SMTP_HOST || !!process.env.RESEND_API_KEY;
    case "kakao":
      return !!process.env.KAKAO_ALIMTALK_KEY;
    case "search_ads":
      return !!process.env.GOOGLE_ADS_KEY || !!process.env.NAVER_ADS_KEY;
    case "retargeting":
      return !!process.env.META_PIXEL_ID;
    case "content":
      return true; // 내부 콘텐츠는 항상 가능
    default:
      return false;
  }
}

function getChannelConfigUrl(channel: string): string {
  switch (channel) {
    case "email": return "/admin/marketing/settings/email";
    case "kakao": return "/admin/marketing/settings/kakao";
    case "search_ads": return "/admin/marketing/settings/search-ads";
    case "retargeting": return "/admin/marketing/settings/retargeting";
    case "content": return "/admin/marketing/settings/content";
    default: return "/admin/marketing/settings";
  }
}
