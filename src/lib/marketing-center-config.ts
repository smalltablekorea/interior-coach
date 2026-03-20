/**
 * 견적코치 마케팅 센터 — 공유 설정/타입/시드 데이터
 *
 * 이 파일은 리서치/마케팅 창에서 정의한 전략 문서를 기반으로
 * 프론트엔드/백엔드 창이 직접 import해서 사용할 수 있는 typed config이다.
 *
 * 참조: docs/marketing-center/
 */

// ─── 퍼널 단계 ───

export const FUNNEL_STEPS = [
  { key: "visit", label: "방문", event: null },
  { key: "signup", label: "회원가입", event: "signup_completed" },
  { key: "login", label: "로그인", event: "login_completed" },
  { key: "upload_start", label: "업로드 시작", event: "upload_started" },
  { key: "upload_submit", label: "업로드 제출", event: "upload_submitted" },
  { key: "analysis_done", label: "분석 완료", event: "analysis_completed" },
  { key: "checkout_start", label: "결제 시작", event: "checkout_started" },
  { key: "payment_success", label: "결제 성공", event: "payment_succeeded" },
  { key: "report_view", label: "리포트 확인", event: "report_viewed" },
  { key: "inquiry", label: "업체문의", event: "inquiry_submitted" },
] as const;

// ─── 이벤트 표준 ───

export const MARKETING_EVENTS = [
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

export type MarketingEventName = (typeof MARKETING_EVENTS)[number];

// ─── 이벤트 한국어 레이블 ───

export const EVENT_LABELS: Record<string, string> = {
  signup_completed: "회원가입",
  login_completed: "로그인",
  upload_started: "업로드 시작",
  upload_file_added: "파일 첨부",
  upload_submitted: "업로드 제출",
  analysis_completed: "분석 완료",
  paywall_viewed: "결제화면 조회",
  checkout_started: "결제 시작",
  payment_succeeded: "결제 성공",
  payment_failed: "결제 실패",
  report_viewed: "리포트 확인",
  report_downloaded: "리포트 다운로드",
  companies_viewed: "업체목록 조회",
  company_clicked: "업체 상세 조회",
  inquiry_submitted: "업체문의 제출",
  referral_shared: "추천코드 공유",
  referral_signup: "추천 가입",
  email_sent: "이메일 발송",
  email_opened: "이메일 오픈",
  email_clicked: "이메일 클릭",
  automation_entered: "자동화 진입",
  automation_completed: "자동화 완료",
  campaign_attributed_signup: "캠페인 기여 가입",
  campaign_attributed_payment: "캠페인 기여 결제",
};

// ─── 리드 점수 규칙 ───

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
  inactive_14d: -25,
};

export type LeadGrade = "hot" | "warm" | "cold" | "dormant";

export function getLeadGrade(score: number): LeadGrade {
  if (score >= 80) return "hot";
  if (score >= 40) return "warm";
  if (score >= 0) return "cold";
  return "dormant";
}

export const LEAD_GRADE_CONFIG: Record<
  LeadGrade,
  { label: string; labelKo: string; bg: string; text: string }
> = {
  hot: { label: "Hot", labelKo: "핫", bg: "bg-red-500/10", text: "text-red-400" },
  warm: { label: "Warm", labelKo: "관심", bg: "bg-orange-500/10", text: "text-orange-400" },
  cold: { label: "Cold", labelKo: "저조", bg: "bg-blue-500/10", text: "text-blue-400" },
  dormant: { label: "Dormant", labelKo: "휴면", bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
};

// ─── 세그먼트 정의 ───

export interface SegmentRule {
  id: string;
  name: string;
  slug: string;
  description: string;
  priority: number;
  rules: {
    has?: string[];
    has_any?: string[];
    not_has?: string[];
    event_count?: Record<string, { gte?: number; lte?: number }>;
    event_age_hours?: Record<string, { gte?: number; lte?: number }>;
    event_age_days?: Record<string, { gte?: number; lte?: number }>;
    last_activity_days_ago?: { gte?: number; lt?: number };
    min_age_hours?: number;
  };
  marketing_goal: string;
  recommended_actions: string[];
  max_messages_per_period: { count: number; period_hours: number };
}

export const DEFAULT_SEGMENTS: SegmentRule[] = [
  {
    id: "seg_01",
    name: "가입만 함",
    slug: "signed_up_only",
    description: "회원가입 후 업로드를 시작하지 않은 사용자",
    priority: 7,
    rules: { has: ["signup_completed"], not_has: ["upload_started"], min_age_hours: 1 },
    marketing_goal: "업로드 시작 유도",
    recommended_actions: ["업로드 가이드 이메일", "서비스 가치 리마인더"],
    max_messages_per_period: { count: 1, period_hours: 48 },
  },
  {
    id: "seg_02",
    name: "로그인 후 업로드 안 함",
    slug: "logged_in_no_upload",
    description: "2회 이상 로그인했으나 업로드를 시작하지 않은 사용자",
    priority: 6,
    rules: {
      has: ["login_completed"],
      event_count: { login_completed: { gte: 2 } },
      not_has: ["upload_started"],
    },
    marketing_goal: "업로드 시작 동기 부여",
    recommended_actions: ["절감 사례 소개", "업로드 방법 안내"],
    max_messages_per_period: { count: 1, period_hours: 48 },
  },
  {
    id: "seg_03",
    name: "업로드 시작 후 미제출",
    slug: "upload_started_not_submitted",
    description: "업로드를 시작했으나 6시간 이상 제출하지 않은 사용자",
    priority: 5,
    rules: {
      has: ["upload_started"],
      not_has: ["upload_submitted"],
      event_age_hours: { upload_started: { gte: 6 } },
    },
    marketing_goal: "업로드 완료 유도",
    recommended_actions: ["이어하기 링크 발송", "파일 포맷 가이드"],
    max_messages_per_period: { count: 1, period_hours: 48 },
  },
  {
    id: "seg_04",
    name: "분석 완료 후 미결제",
    slug: "analysis_done_not_paid",
    description: "AI 분석이 완료됐으나 결제하지 않은 사용자",
    priority: 4,
    rules: {
      has: ["analysis_completed"],
      not_has: ["payment_succeeded"],
      event_age_hours: { analysis_completed: { gte: 12, lte: 720 } },
    },
    marketing_goal: "결제 전환",
    recommended_actions: ["무료 프리뷰 하이라이트", "절감 금액 미리보기", "한정 할인"],
    max_messages_per_period: { count: 1, period_hours: 24 },
  },
  {
    id: "seg_05",
    name: "결제 성공 후 리포트 미확인",
    slug: "paid_not_viewed",
    description: "결제했으나 리포트를 아직 확인하지 않은 사용자",
    priority: 2,
    rules: {
      has: ["payment_succeeded"],
      not_has: ["report_viewed"],
      event_age_hours: { payment_succeeded: { gte: 2 } },
    },
    marketing_goal: "리포트 확인 → 업체문의 유도",
    recommended_actions: ["리포트 링크 재발송", "리포트 활용 가이드"],
    max_messages_per_period: { count: 1, period_hours: 12 },
  },
  {
    id: "seg_06",
    name: "업체추천 관심 고객",
    slug: "company_interest",
    description: "업체 목록을 조회했으나 문의를 제출하지 않은 사용자",
    priority: 3,
    rules: {
      has_any: ["companies_viewed", "company_clicked"],
      not_has: ["inquiry_submitted"],
    },
    marketing_goal: "업체문의 전환",
    recommended_actions: ["업체 비교 팁", "협상 가이드", "무료 상담 안내"],
    max_messages_per_period: { count: 1, period_hours: 72 },
  },
  {
    id: "seg_07",
    name: "7일 휴면",
    slug: "dormant_7d",
    description: "7일 이상 활동이 없는 미결제 사용자",
    priority: 8,
    rules: {
      last_activity_days_ago: { gte: 7, lt: 14 },
      not_has: ["payment_succeeded"],
    },
    marketing_goal: "서비스 재방문",
    recommended_actions: ["가치 리마인더", "절감 사례 콘텐츠"],
    max_messages_per_period: { count: 1, period_hours: 168 },
  },
  {
    id: "seg_08",
    name: "14일 휴면",
    slug: "dormant_14d",
    description: "14일 이상 활동이 없는 미결제 사용자",
    priority: 9,
    rules: {
      last_activity_days_ago: { gte: 14, lt: 30 },
      not_has: ["payment_succeeded"],
    },
    marketing_goal: "최종 재활성화",
    recommended_actions: ["강한 가치 제안", "할인 인센티브", "마지막 리마인더"],
    max_messages_per_period: { count: 1, period_hours: 336 },
  },
  {
    id: "seg_09",
    name: "후기 요청 대상",
    slug: "review_eligible",
    description: "결제 및 리포트 확인 후 3~14일 경과한 사용자",
    priority: 1,
    rules: {
      has: ["payment_succeeded", "report_viewed"],
      event_age_days: { payment_succeeded: { gte: 3, lte: 14 } },
      not_has: ["review_submitted", "refund_requested"],
    },
    marketing_goal: "후기/추천코드 확산",
    recommended_actions: ["후기 작성 요청", "추천코드 안내", "간편 후기 폼"],
    max_messages_per_period: { count: 1, period_hours: 168 },
  },
];

// ─── 자동화 정의 ───

export interface AutomationStep {
  step_index: number;
  delay_hours: number;
  delay_from: "trigger" | "previous_step";
  condition_check?: { not_has?: string[]; has?: string[] };
  action: {
    type: "send_message";
    channel: "email" | "kakao" | "sms";
    template_id: string;
    fallback_channel?: "email" | "sms";
  };
}

export interface AutomationDefinition {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger: { event: string; conditions?: { has?: string[]; not_has?: string[] } };
  steps: AutomationStep[];
  safety: {
    no_night_send: boolean;
    exclude_recent_payers: boolean;
    max_daily_messages: number;
    reentry_cooldown_hours: number;
    respect_opt_out: boolean;
  };
  exit_conditions: string[];
}

export const DEFAULT_AUTOMATIONS: AutomationDefinition[] = [
  {
    id: "auto_01",
    name: "가입 후 업로드 미시작",
    description: "가입 후 24시간 내 업로드를 시작하지 않은 사용자에게 가이드를 발송합니다.",
    is_active: true,
    trigger: { event: "signup_completed", conditions: { not_has: ["upload_started"] } },
    steps: [
      {
        step_index: 0,
        delay_hours: 24,
        delay_from: "trigger",
        condition_check: { not_has: ["upload_started"] },
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_welcome_upload_guide", fallback_channel: "email" },
      },
      {
        step_index: 1,
        delay_hours: 48,
        delay_from: "previous_step",
        condition_check: { not_has: ["upload_started"] },
        action: { type: "send_message", channel: "email", template_id: "tmpl_upload_case_study" },
      },
    ],
    safety: { no_night_send: true, exclude_recent_payers: true, max_daily_messages: 2, reentry_cooldown_hours: 168, respect_opt_out: true },
    exit_conditions: ["upload_started"],
  },
  {
    id: "auto_02",
    name: "업로드 시작 후 미제출",
    description: "업로드를 시작했으나 6시간 내 제출하지 않은 사용자에게 이어하기 링크를 발송합니다.",
    is_active: true,
    trigger: { event: "upload_started", conditions: { not_has: ["upload_submitted"] } },
    steps: [
      {
        step_index: 0,
        delay_hours: 6,
        delay_from: "trigger",
        condition_check: { not_has: ["upload_submitted"] },
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_continue_upload", fallback_channel: "sms" },
      },
    ],
    safety: { no_night_send: true, exclude_recent_payers: false, max_daily_messages: 2, reentry_cooldown_hours: 48, respect_opt_out: true },
    exit_conditions: ["upload_submitted"],
  },
  {
    id: "auto_03",
    name: "분석 완료 후 미결제",
    description: "AI 분석 완료 후 결제하지 않은 사용자에게 단계적 결제 유도 메시지를 발송합니다.",
    is_active: true,
    trigger: { event: "analysis_completed", conditions: { not_has: ["payment_succeeded"] } },
    steps: [
      {
        step_index: 0,
        delay_hours: 12,
        delay_from: "trigger",
        condition_check: { not_has: ["payment_succeeded"] },
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_payment_nudge_1", fallback_channel: "email" },
      },
      {
        step_index: 1,
        delay_hours: 24,
        delay_from: "previous_step",
        condition_check: { not_has: ["payment_succeeded"] },
        action: { type: "send_message", channel: "email", template_id: "tmpl_payment_nudge_2" },
      },
      {
        step_index: 2,
        delay_hours: 48,
        delay_from: "previous_step",
        condition_check: { not_has: ["payment_succeeded"] },
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_payment_nudge_3" },
      },
    ],
    safety: { no_night_send: true, exclude_recent_payers: true, max_daily_messages: 2, reentry_cooldown_hours: 720, respect_opt_out: true },
    exit_conditions: ["payment_succeeded"],
  },
  {
    id: "auto_04",
    name: "결제 성공 후 후속 유도",
    description: "결제 완료 후 리포트 확인, 업체추천, 협상팁을 단계적으로 안내합니다.",
    is_active: true,
    trigger: { event: "payment_succeeded" },
    steps: [
      {
        step_index: 0,
        delay_hours: 0,
        delay_from: "trigger",
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_payment_success" },
      },
      {
        step_index: 1,
        delay_hours: 2,
        delay_from: "trigger",
        condition_check: { not_has: ["report_viewed"] },
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_report_reminder" },
      },
      {
        step_index: 2,
        delay_hours: 24,
        delay_from: "trigger",
        condition_check: { has: ["report_viewed"], not_has: ["inquiry_submitted"] },
        action: { type: "send_message", channel: "email", template_id: "tmpl_negotiation_tips" },
      },
    ],
    safety: { no_night_send: true, exclude_recent_payers: false, max_daily_messages: 3, reentry_cooldown_hours: -1, respect_opt_out: true },
    exit_conditions: [],
  },
  {
    id: "auto_05",
    name: "리포트 확인 후 후기 요청",
    description: "리포트를 확인한 결제 고객에게 3일 후 후기 작성을 요청합니다.",
    is_active: true,
    trigger: { event: "report_viewed", conditions: { has: ["payment_succeeded"] } },
    steps: [
      {
        step_index: 0,
        delay_hours: 72,
        delay_from: "trigger",
        condition_check: { not_has: ["review_submitted", "refund_requested"] },
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_review_request" },
      },
      {
        step_index: 1,
        delay_hours: 168,
        delay_from: "previous_step",
        condition_check: { not_has: ["review_submitted"] },
        action: { type: "send_message", channel: "kakao", template_id: "tmpl_review_reminder" },
      },
    ],
    safety: { no_night_send: true, exclude_recent_payers: false, max_daily_messages: 2, reentry_cooldown_hours: 2160, respect_opt_out: true },
    exit_conditions: ["review_submitted"],
  },
];

// ─── 캠페인 설정 ───

export const CAMPAIGN_STATUSES = [
  { key: "draft", label: "초안" },
  { key: "pending_approval", label: "승인대기" },
  { key: "active", label: "집행중" },
  { key: "paused", label: "일시중지" },
  { key: "completed", label: "종료" },
] as const;

export const CAMPAIGN_CHANNELS = [
  { key: "email", label: "이메일" },
  { key: "kakao", label: "카카오" },
  { key: "search_ad", label: "검색광고" },
  { key: "retargeting", label: "리타게팅" },
  { key: "content", label: "콘텐츠" },
] as const;

// ─── 콘텐츠 카테고리 ───

export const CONTENT_STUDIO_CATEGORIES = [
  { key: "search_ad", label: "검색광고 카피" },
  { key: "email_subject", label: "이메일 제목" },
  { key: "email_body", label: "이메일 본문" },
  { key: "kakao_message", label: "카카오 메시지" },
  { key: "blog_title", label: "블로그 제목" },
  { key: "landing_cta", label: "랜딩 CTA" },
  { key: "review_request", label: "후기 요청" },
  { key: "referral_share", label: "추천코드 공유" },
] as const;

// ─── 실험 설정 ───

export const EXPERIMENT_TARGETS = [
  { key: "headline", label: "헤드라인" },
  { key: "cta", label: "CTA 문구" },
  { key: "price_copy", label: "가격 카피" },
  { key: "review_placement", label: "후기 블록 배치" },
] as const;

export const EXPERIMENT_METRICS = [
  { key: "click_rate", label: "클릭률" },
  { key: "upload_start_rate", label: "업로드 시작률" },
  { key: "checkout_start_rate", label: "결제 시작률" },
  { key: "payment_success_rate", label: "결제 성공률" },
] as const;

// ─── 알림 설정 ───

export const ALERT_LABELS: Record<string, string> = {
  critical: "긴급",
  warning: "주의",
  info: "정보",
  success: "성공",
  crit_payment_rate: "결제 성공률 급락",
  crit_pipeline_failure: "분석 파이프라인 장애",
  crit_revenue_drop: "일 매출 급감",
  warn_conversion_drop: "전환율 하락",
  warn_unpaid_surge: "미결제 대기자 급증",
  warn_automation_failure: "자동화 발송 실패",
  warn_upload_abandon: "업로드 중단율 급증",
  info_daily_report: "일간 요약 리포트",
  info_weekly_report: "주간 요약 리포트",
  info_milestones: "마일스톤 달성",
  info_campaign_status: "캠페인 상태 변경",
  success_automation_convert: "자동화 전환 성공",
  success_weekly_goal: "주간 목표 달성",
};

export interface SendingPolicy {
  night_quiet_start: string;
  night_quiet_end: string;
  night_queue_behavior: "hold_until_morning" | "drop";
  max_messages_per_user_per_day: number;
  min_interval_same_automation_hours: number;
  min_interval_any_message_hours: number;
  default_reentry_cooldown_hours: number;
  exclude_recent_payers_hours: number;
}

export const DEFAULT_SENDING_POLICY: SendingPolicy = {
  night_quiet_start: "21:00",
  night_quiet_end: "08:00",
  night_queue_behavior: "hold_until_morning",
  max_messages_per_user_per_day: 2,
  min_interval_same_automation_hours: 24,
  min_interval_any_message_hours: 4,
  default_reentry_cooldown_hours: 168,
  exclude_recent_payers_hours: 24,
};
