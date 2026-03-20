// ─── 마케팅 센터 타입 정의 ───

// 이벤트 타입
export const MKT_EVENT_TYPES = [
  "signup_completed",
  "login_completed",
  "upload_started",
  "upload_file_added",
  "upload_submitted",
  "analysis_completed",
  "paywall_viewed",
  "checkout_started",
  "payment_succeeded",
  "payment_failed",
  "report_viewed",
  "report_downloaded",
  "companies_viewed",
  "company_clicked",
  "inquiry_submitted",
  "referral_shared",
  "referral_signup",
  "email_sent",
  "email_opened",
  "email_clicked",
  "automation_entered",
  "automation_completed",
  "campaign_attributed_signup",
  "campaign_attributed_payment",
] as const;

export type MktEventType = (typeof MKT_EVENT_TYPES)[number];

// 리드 점수 기본값
export const LEAD_SCORE_RULES: Record<string, number> = {
  signup_completed: 10,
  login_completed: 5,
  upload_started: 20,
  upload_submitted: 30,
  analysis_completed: 15,
  paywall_viewed: 10,
  checkout_started: 20,
  payment_succeeded: 50,
  companies_viewed: 10,
  inquiry_submitted: 30,
  inactive_7d: -15,
};

// 퍼널 단계
export const FUNNEL_STAGES = [
  { key: "visit", label: "방문", event: null },
  { key: "signup", label: "회원가입", event: "signup_completed" },
  { key: "login", label: "로그인", event: "login_completed" },
  { key: "upload_start", label: "업로드 시작", event: "upload_started" },
  { key: "upload_submit", label: "업로드 제출", event: "upload_submitted" },
  { key: "analysis_done", label: "분석 완료", event: "analysis_completed" },
  { key: "checkout_start", label: "결제 시작", event: "checkout_started" },
  { key: "payment_done", label: "결제 성공", event: "payment_succeeded" },
  { key: "report_view", label: "리포트 확인", event: "report_viewed" },
  { key: "inquiry", label: "업체문의", event: "inquiry_submitted" },
] as const;

export type FunnelStageKey = (typeof FUNNEL_STAGES)[number]["key"];

// 캠페인 상태
export const MKT_CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "active",
  "paused",
  "completed",
] as const;

export type MktCampaignStatus = (typeof MKT_CAMPAIGN_STATUSES)[number];

export const MKT_CAMPAIGN_STATUS_LABELS: Record<MktCampaignStatus, string> = {
  draft: "초안",
  pending_approval: "승인대기",
  active: "집행중",
  paused: "일시중지",
  completed: "종료",
};

// 캠페인 채널
export const MKT_CAMPAIGN_CHANNELS = [
  "email",
  "kakao",
  "search_ads",
  "retargeting",
  "content",
] as const;

export type MktCampaignChannel = (typeof MKT_CAMPAIGN_CHANNELS)[number];

export const MKT_CAMPAIGN_CHANNEL_LABELS: Record<MktCampaignChannel, string> = {
  email: "이메일",
  kakao: "카카오",
  search_ads: "검색광고",
  retargeting: "리타게팅",
  content: "콘텐츠",
};

// 자동화 상태
export const MKT_AUTOMATION_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export type MktAutomationStatus = (typeof MKT_AUTOMATION_STATUSES)[number];

// 자동화 트리거 타입
export const MKT_TRIGGER_TYPES = [
  "event",       // 특정 이벤트 발생 시
  "time_delay",  // 이전 단계 후 시간 경과
  "schedule",    // 스케줄 기반
  "segment",     // 세그먼트 진입 시
] as const;

// 자동화 액션 타입
export const MKT_ACTION_TYPES = [
  "send_email",
  "send_kakao",
  "send_push",
  "add_tag",
  "remove_tag",
  "update_lead_score",
  "move_to_segment",
  "wait",
  "condition",
] as const;

// 실험 상태
export const MKT_EXPERIMENT_STATUSES = [
  "draft",
  "running",
  "completed",
] as const;

export type MktExperimentStatus = (typeof MKT_EXPERIMENT_STATUSES)[number];

// 메시지 상태
export const MKT_MESSAGE_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
] as const;

export type MktMessageStatus = (typeof MKT_MESSAGE_STATUSES)[number];

// 리드 상태
export const MKT_LEAD_STATUSES = [
  "anonymous",
  "identified",
  "engaged",
  "qualified",
  "customer",
  "churned",
] as const;

export type MktLeadStatus = (typeof MKT_LEAD_STATUSES)[number];

export const MKT_LEAD_STATUS_LABELS: Record<MktLeadStatus, string> = {
  anonymous: "익명",
  identified: "식별",
  engaged: "활성",
  qualified: "유망",
  customer: "고객",
  churned: "이탈",
};

// 세그먼트 규칙 타입
export interface SegmentRule {
  field: string;        // e.g. "event", "lead_score", "last_active", "payment_status"
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "not_contains" | "in" | "not_in" | "between" | "is_null" | "is_not_null";
  value: string | number | string[] | number[] | null;
}

export interface SegmentConfig {
  logic: "and" | "or";
  rules: SegmentRule[];
}

// 자동화 단계 설정
export interface AutomationStepConfig {
  trigger?: {
    type: string;
    event?: string;
    delay?: number;  // 초 단위
    schedule?: string;  // cron 표현식
  };
  action?: {
    type: string;
    templateId?: string;
    channel?: string;
    content?: string;
    tag?: string;
    scoreChange?: number;
    segmentId?: string;
  };
  condition?: {
    field: string;
    operator: string;
    value: unknown;
    trueBranch?: number;   // step sortOrder
    falseBranch?: number;
  };
}

// 자동화 안전장치
export interface AutomationSafeguard {
  noNightSend: boolean;          // 야간 발송 금지 (22:00~08:00)
  excludeRecentPayers: boolean;  // 최근 결제 고객 제외
  maxSendPerDay: number;         // 동일 유저 일일 최대 발송
  dedupeWindow: number;          // 중복 발송 제한 (시간)
  preventReentry: boolean;       // 동일 유저 재진입 방지
}

// API 응답 타입
export interface OverviewKPI {
  label: string;
  key: string;
  value: number;
  previousValue: number;
  changePercent: number;
  changeDirection: "up" | "down" | "flat";
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  conversionRate: number;  // 이전 단계 대비
  dropoffRate: number;     // 이탈률
}

export interface ActionItem {
  type: "unpaid_after_upload" | "abandoned_upload" | "payment_failed" | "dormant_return";
  label: string;
  count: number;
  urgency: "high" | "medium" | "low";
}

export interface AnomalyAlert {
  type: "conversion_drop" | "payment_rate_drop" | "upload_failure_spike";
  label: string;
  description: string;
  severity: "critical" | "warning" | "info";
  currentValue: number;
  previousValue: number;
}

export interface OverviewResponse {
  kpis: OverviewKPI[];
  actionItems: ActionItem[];
  anomalies: AnomalyAlert[];
  period: { from: string; to: string };
}

export interface FunnelResponse {
  stages: FunnelStage[];
  period: { from: string; to: string };
  filters: {
    channel?: string;
    campaign?: string;
    device?: string;
    region?: string;
  };
}

export interface LeadListItem {
  id: string;
  userId: string | null;
  email: string | null;
  name: string | null;
  lastEvent: string | null;
  lastEventAt: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  leadScore: number;
  segment: string | null;
  lastActiveAt: string | null;
  status: MktLeadStatus;
  paymentStatus: string | null;
  createdAt: string;
}

export interface LeadTimeline {
  eventType: string;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

export interface LeadDetail extends LeadListItem {
  timeline: LeadTimeline[];
  hasReport: boolean;
  hasInquiry: boolean;
  recommendedAction: string | null;
}
