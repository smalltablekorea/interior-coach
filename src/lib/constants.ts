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

export const PAYMENT_TYPES = ["계약금", "중도금", "잔금"] as const;

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
};
