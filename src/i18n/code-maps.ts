/**
 * 정적 코드 ↔ 다국어 라벨 매핑.
 *
 * 원칙:
 *   - DB 컬럼 추가 없이 코드값(공종 / status / grade / unit / region)을 화면에 표시할 때 사용.
 *   - 키는 항상 한국어 원본(TRADES 상수, status 값 등)을 그대로 사용 — 기존 코드 변경 최소화.
 *   - translateCode(locale, MAP, code) 로 호출.
 *   - 매핑 누락 시 원본 그대로 노출(빈 라벨 방지).
 *
 * 새 코드값 추가 시 ko/en 둘 다 채울 것 — 미번역 흔적이 남는 게 사라지는 것보다 낫다.
 */

import { TRADES, CUSTOMER_STATUSES, SITE_STATUSES, BUILDING_TYPES, ESTIMATE_STATUSES, PAYMENT_TYPES, PHASE_STATUSES, ORDER_STATUSES } from "@/lib/constants";

type LabelPair = { ko: string; en: string };
type CodeMap<K extends string> = Readonly<Record<K, LabelPair>>;

// ── 공종 (TRADES) ─────────────────────────────────────────────────
type Trade = (typeof TRADES)[number];

export const TRADE_LABELS: CodeMap<Trade> = {
  철거:       { ko: "철거",       en: "Demolition" },
  설비:       { ko: "설비",       en: "Plumbing" },
  전기:       { ko: "전기",       en: "Electrical" },
  창호:       { ko: "창호",       en: "Windows & Doors" },
  목공:       { ko: "목공",       en: "Carpentry" },
  타일:       { ko: "타일",       en: "Tiling" },
  도배:       { ko: "도배",       en: "Wallpapering" },
  도장:       { ko: "도장",       en: "Painting" },
  금속:       { ko: "금속",       en: "Metalwork" },
  필름:       { ko: "필름",       en: "Film Wrap" },
  가구:       { ko: "가구",       en: "Furniture" },
  세라믹:     { ko: "세라믹",     en: "Ceramic" },
  도기:       { ko: "도기",       en: "Sanitaryware" },
  중문:       { ko: "중문",       en: "Inner Door" },
  도어:       { ko: "도어",       en: "Door" },
  철물:       { ko: "철물",       en: "Hardware" },
  유리:       { ko: "유리",       en: "Glass" },
  거울:       { ko: "거울",       en: "Mirror" },
  IoT:        { ko: "IoT",        en: "IoT" },
  커텐:       { ko: "커텐",       en: "Curtain" },
  장판:       { ko: "장판",       en: "Vinyl Flooring" },
  강마루:     { ko: "강마루",     en: "Laminate Flooring" },
  원목마루:   { ko: "원목마루",   en: "Hardwood Flooring" },
  후드:       { ko: "후드",       en: "Range Hood" },
  돔천장:     { ko: "돔천장",     en: "Dome Ceiling" },
  실리콘:     { ko: "실리콘",     en: "Silicone Sealing" },
  보양:       { ko: "보양",       en: "Site Protection" },
  양중:       { ko: "양중",       en: "Material Hoisting" },
  촬영:       { ko: "촬영",       en: "Photography" },
  입주민동의서: { ko: "입주민동의서", en: "Resident Consent" },
  입주청소:   { ko: "입주청소",   en: "Move-in Cleaning" },
  폐기물:     { ko: "폐기물",     en: "Waste Disposal" },
  이사:       { ko: "이사",       en: "Moving" },
  조명:       { ko: "조명",       en: "Lighting" },
  기타:       { ko: "기타",       en: "Other" },
};

// ── 현장/고객 status ──────────────────────────────────────────────
export const SITE_STATUS_LABELS: CodeMap<(typeof SITE_STATUSES)[number]> = {
  상담중:   { ko: "상담중",   en: "Consulting" },
  견적중:   { ko: "견적중",   en: "Quoting" },
  계약완료: { ko: "계약완료", en: "Contracted" },
  시공중:   { ko: "시공중",   en: "In Progress" },
  시공완료: { ko: "시공완료", en: "Completed" },
  "A/S":   { ko: "A/S",      en: "After-sales" },
};

export const CUSTOMER_STATUS_LABELS: CodeMap<(typeof CUSTOMER_STATUSES)[number]> = {
  상담중:   { ko: "상담중",   en: "Consulting" },
  현장실측: { ko: "현장실측", en: "Site Measurement" },
  견적미팅: { ko: "견적미팅", en: "Quote Meeting" },
  계약완료: { ko: "계약완료", en: "Contracted" },
  시공중:   { ko: "시공중",   en: "In Progress" },
  시공완료: { ko: "시공완료", en: "Completed" },
  "A/S":   { ko: "A/S",      en: "After-sales" },
  VIP:      { ko: "VIP",      en: "VIP" },
  "상담중단/취소": { ko: "상담중단/취소", en: "Discontinued/Canceled" },
};

// ── 건물 유형 ─────────────────────────────────────────────────────
export const BUILDING_TYPE_LABELS: CodeMap<(typeof BUILDING_TYPES)[number]> = {
  아파트:   { ko: "아파트",   en: "Apartment" },
  빌라:     { ko: "빌라",     en: "Villa" },
  오피스텔: { ko: "오피스텔", en: "Officetel" },
  상가:     { ko: "상가",     en: "Commercial" },
  주택:     { ko: "주택",     en: "House" },
  사무실:   { ko: "사무실",   en: "Office" },
  기타:     { ko: "기타",     en: "Other" },
};

// ── 견적 status / 결제 타입 / 공정 status / 발주 status ─────────────
export const ESTIMATE_STATUS_LABELS: CodeMap<(typeof ESTIMATE_STATUSES)[number]> = {
  작성중: { ko: "작성중", en: "Draft" },
  발송:   { ko: "발송",   en: "Sent" },
  승인:   { ko: "승인",   en: "Approved" },
  거절:   { ko: "거절",   en: "Rejected" },
};

export const PAYMENT_TYPE_LABELS: CodeMap<(typeof PAYMENT_TYPES)[number]> = {
  계약금: { ko: "계약금", en: "Deposit" },
  착수금: { ko: "착수금", en: "Mobilization Fee" },
  중도금: { ko: "중도금", en: "Interim Payment" },
  잔금:   { ko: "잔금",   en: "Final Payment" },
};

export const PHASE_STATUS_LABELS: CodeMap<(typeof PHASE_STATUSES)[number]> = {
  예정:   { ko: "예정",   en: "Scheduled" },
  진행중: { ko: "진행중", en: "In Progress" },
  완료:   { ko: "완료",   en: "Done" },
  보류:   { ko: "보류",   en: "On Hold" },
};

export const ORDER_STATUS_LABELS: CodeMap<(typeof ORDER_STATUSES)[number]> = {
  발주:   { ko: "발주",   en: "Ordered" },
  배송중: { ko: "배송중", en: "Shipping" },
  입고:   { ko: "입고",   en: "Received" },
  취소:   { ko: "취소",   en: "Canceled" },
};

// ── 자재 등급/단위/지역 — 코드 매핑(컬럼 추가 X) ────────────────────
export const MATERIAL_GRADE_LABELS: Readonly<Record<string, LabelPair>> = {
  일반: { ko: "일반", en: "Standard" },
  중급: { ko: "중급", en: "Mid-grade" },
  고급: { ko: "고급", en: "Premium" },
};

export const UNIT_LABELS: Readonly<Record<string, LabelPair>> = {
  개:   { ko: "개",   en: "EA" },
  박스: { ko: "박스", en: "Box" },
  "m²": { ko: "m²",   en: "m²" },
  롤:   { ko: "롤",   en: "Roll" },
  EA:   { ko: "EA",   en: "EA" },
  식:   { ko: "식",   en: "Lot" },
  m:    { ko: "m",    en: "m" },
};

export const REGION_LABELS: Readonly<Record<string, LabelPair>> = {
  전국: { ko: "전국", en: "Nationwide" },
  서울: { ko: "서울", en: "Seoul" },
  경기: { ko: "경기", en: "Gyeonggi" },
  인천: { ko: "인천", en: "Incheon" },
  부산: { ko: "부산", en: "Busan" },
  대구: { ko: "대구", en: "Daegu" },
  광주: { ko: "광주", en: "Gwangju" },
  대전: { ko: "대전", en: "Daejeon" },
  미상: { ko: "미상", en: "Unknown" },
};
