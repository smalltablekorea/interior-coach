export const TRADES = [
  "철거",
  "설비",
  "전기",
  "창호",
  "목공",
  "타일",
  "도배",
  "도장",
  "금속",
  "필름",
  "가구",
  "세라믹",
  "도기",
  "중문",
  "도어",
  "철물",
  "유리",
  "거울",
  "IoT",
  "커텐",
  "장판",
  "강마루",
  "원목마루",
  "후드",
  "돔천장",
  "실리콘",
  "보양",
  "양중",
  "촬영",
  "입주민동의서",
  "입주청소",
  "폐기물",
  "이사",
  "조명",
  "기타",
] as const;

export const SITE_STATUSES = [
  "상담중",
  "견적중",
  "계약완료",
  "시공중",
  "시공완료",
  "A/S",
] as const;

export const BUILDING_TYPES = [
  "아파트",
  "빌라",
  "오피스텔",
  "상가",
  "주택",
  "사무실",
  "기타",
] as const;

export const ESTIMATE_STATUSES = [
  "작성중",
  "발송",
  "승인",
  "거절",
] as const;

export const PAYMENT_TYPES = ["계약금", "착수금", "중도금", "잔금"] as const;

export const PHASE_STATUSES = ["대기", "진행중", "완료", "보류"] as const;

export const ORDER_STATUSES = ["발주", "배송중", "입고", "취소"] as const;

export const CUSTOMER_STATUSES = [
  "상담중",
  "계약완료",
  "시공중",
  "시공완료",
  "A/S",
  "VIP",
] as const;

export const COMMUNICATION_TYPES = [
  "전화",
  "문자",
  "방문",
  "카톡",
] as const;

// ─── 쓰레드 마케팅 ───

export const THREADS_POST_STATUSES = ["작성중", "예약", "발행완료", "실패"] as const;

export const THREADS_TEMPLATE_CATEGORIES = ["시공완료", "시공팁", "고객후기", "프로모션", "일상"] as const;

export const THREADS_AUTO_RULE_TYPES = ["시공완료자동", "정기포스팅", "시공사진자동", "프로모션자동"] as const;

export const THREADS_COMMENT_STATUSES = ["대기", "완료", "건너뜀"] as const;

// ─── 세무/회계 ───

export const TAX_REVENUE_TYPES = ["시공매출", "설계매출", "자재판매", "기타매출"] as const;

export const TAX_EXPENSE_CATEGORIES = ["자재비", "인건비", "외주비", "임대료", "차량유지", "사무용품", "접대비", "보험료", "통신비", "기타"] as const;

export const TAX_INVOICE_DIRECTIONS = ["매출", "매입"] as const;

export const TAX_INVOICE_STATUSES = ["발행", "수취", "수정", "취소"] as const;

export const TAX_WORKER_TYPES = ["일용직", "프리랜서", "정규직"] as const;

export const TAX_CALENDAR_TYPES = ["부가세", "원천세", "종합소득세", "법인세", "4대보험", "기타"] as const;

export const TAX_CALENDAR_STATUSES = ["upcoming", "completed", "overdue"] as const;

export const TAX_PAYMENT_METHODS = ["카드", "계좌이체", "현금", "어음"] as const;

// ─── 구독/요금제 ───

export const PLAN_IDS = ["free", "starter", "pro"] as const;

export const SUBSCRIPTION_STATUSES = ["active", "trialing", "canceled", "expired"] as const;

export const BILLING_CYCLES = ["monthly", "yearly"] as const;

// ─── 마케팅 자동화 (공통) ───

export const MARKETING_CHANNELS = [
  { id: "threads", name: "스레드", color: "#000000" },
  { id: "instagram", name: "인스타그램", color: "#E4405F" },
  { id: "naver_blog", name: "네이버 블로그", color: "#03C75A" },
  { id: "youtube", name: "유튜브", color: "#FF0000" },
  { id: "meta_ads", name: "메타 광고", color: "#1877F2" },
  { id: "sms", name: "SMS 자동화", color: "#FF6B00" },
  { id: "adlog", name: "애드로그", color: "#4A90D9" },
] as const;

// ─── SMS/알림톡 리드 자동화 ───

export const SMS_LEAD_GRADES = ["A", "B", "C"] as const;

export const SMS_LEAD_STATUSES = ["new", "contacted", "responding", "qualified", "converted", "lost"] as const;

export const SMS_LEAD_STATUS_LABELS: Record<string, string> = {
  new: "신규",
  contacted: "연락완료",
  responding: "응답중",
  qualified: "유망",
  converted: "전환",
  lost: "이탈",
};

export const SMS_LEAD_SOURCES = ["naver_cafe", "instagram", "referral", "manual", "landing_page"] as const;

export const SMS_LEAD_SOURCE_LABELS: Record<string, string> = {
  naver_cafe: "네이버 카페",
  instagram: "인스타그램",
  referral: "소개",
  manual: "수동 등록",
  landing_page: "랜딩페이지",
};

export const SMS_CAMPAIGN_TYPES = ["drip", "blast", "trigger"] as const;

export const SMS_CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed"] as const;

export const SMS_TEMPLATE_TYPES = ["first_contact", "follow_up", "portfolio", "promotion", "maintenance", "referral"] as const;

export const SMS_TEMPLATE_TYPE_LABELS: Record<string, string> = {
  first_contact: "첫 연락",
  follow_up: "팔로업",
  portfolio: "포트폴리오",
  promotion: "프로모션",
  maintenance: "유지보수",
  referral: "소개 요청",
};

export const SMS_OUTREACH_STATUSES = ["pending", "sent", "delivered", "failed", "opened", "clicked"] as const;

export const CONTENT_CATEGORIES = [
  "시공사례", "비포애프터", "자재소개", "팁/노하우", "비용안내",
  "공정소개", "고객후기", "트렌드", "프로모션",
] as const;

export const INQUIRY_CHANNELS = ["네이버", "인스타", "유튜브", "스레드", "지인소개", "현수막", "기타"] as const;

export const INQUIRY_STATUSES = ["신규", "상담중", "견적발송", "계약완료", "실패"] as const;

export const POST_STATUSES = ["draft", "scheduled", "publishing", "published", "failed"] as const;

export const CAMPAIGN_STATUSES = ["active", "paused", "completed"] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  // 현장 상태
  상담중: { bg: "bg-blue-500/10", text: "text-blue-400" },
  견적중: { bg: "bg-purple-500/10", text: "text-purple-400" },
  계약완료: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  시공중: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  시공완료: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  "A/S": { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  // 견적 상태
  작성중: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  발송: { bg: "bg-blue-500/10", text: "text-blue-400" },
  승인: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  거절: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  // 공정 상태
  대기: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  진행중: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  완료: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  보류: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  // 결제 상태
  미수: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  완납: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  // 발주 상태
  발주: { bg: "bg-blue-500/10", text: "text-blue-400" },
  배송중: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  입고: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  취소: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  // 고객 상태
  VIP: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  // 마케팅 문의 상태
  신규: { bg: "bg-blue-500/10", text: "text-blue-400" },
  견적발송: { bg: "bg-purple-500/10", text: "text-purple-400" },
  실패: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  // 쓰레드 포스트 상태
  예약: { bg: "bg-purple-500/10", text: "text-purple-400" },
  발행완료: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  // 쓰레드 댓글 상태
  건너뜀: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  // 세금계산서 상태
  발행: { bg: "bg-purple-500/10", text: "text-purple-400" },
  수취: { bg: "bg-blue-500/10", text: "text-blue-400" },
  수정: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  // 세무 캘린더 상태
  upcoming: { bg: "bg-blue-500/10", text: "text-blue-400" },
  completed: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  overdue: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  // 구독 상태
  active: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  trialing: { bg: "bg-blue-500/10", text: "text-blue-400" },
  canceled: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  expired: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  // 요금제
  free: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  starter: { bg: "bg-blue-500/10", text: "text-blue-400" },
  pro: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
};
