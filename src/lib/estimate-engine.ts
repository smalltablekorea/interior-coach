/*
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║  Small Table Design · 인테리어 견적 시스템 v5 — 공유 엔진            ║
 ║  8등급 (60평 8천만~4.2억) · 10~100평 · 2026 인건비 반영             ║
 ╚═══════════════════════════════════════════════════════════════════════╝
*/

// ─── Types ───
export interface Grade {
  key: string;
  label: string;
  tag: string;
  mult: number;
  color: string;
  desc: string;
  target60: number;
}

export interface Sub {
  name: string;
  base: number;
  scale: string;
  ratio?: number;
  type: string;
  perRoom?: number;
}

export interface MatOption {
  grade: string;
  name: string;
  price: number;
}

export interface Cat {
  id: string;
  name: string;
  icon: string;
  color: string;
  essential: boolean;
  desc: string;
  subs: Sub[];
  matOptions?: MatOption[];
  gradeAdj: Record<string, number>;
}

// ─── 2026 인건비 (일당) ───
export const LABOR: Record<string, number> = {
  목수기공: 380000, 목수팀장: 420000,
  도배: 285000, 종합설비: 325000, 필름: 285000,
  페인트: 300000, 용접: 300000, 전기: 300000,
  소방: 300000, 타일: 380000, 철거: 260000,
  미장: 290000, 실리콘: 400000, 외부코킹: 325000,
  다기능: 280000, 용역: 175000, 입주청소평당: 14000,
};

export const GRADES: Grade[] = [
  { key: "basic",     label: "베이직",       tag: "최소한",   mult: 0.57,  color: "#8B8E96", desc: "최소 시공, 기본 자재만", target60: 80000000 },
  { key: "economy",   label: "실속형",       tag: "가성비",   mult: 0.71,  color: "#5BA87B", desc: "실용적 구성, 합리적 가격", target60: 100000000 },
  { key: "standard",  label: "스탠다드",     tag: "추천",     mult: 1.0,   color: "#C8A97E", desc: "검증된 자재, 균형잡힌 시공", target60: 140000000 },
  { key: "comfort",   label: "컴포트",       tag: "업그레이드", mult: 1.21, color: "#7BA1C7", desc: "한 단계 높은 자재·마감", target60: 170000000 },
  { key: "premium",   label: "프리미엄",     tag: "고급",     mult: 1.50,  color: "#C8A97E", desc: "고급 자재, 디테일 시공", target60: 210000000 },
  { key: "highend",   label: "하이엔드",     tag: "최상급",   mult: 1.93,  color: "#D4956B", desc: "수입자재, 맞춤 디자인", target60: 270000000 },
  { key: "luxury",    label: "럭셔리",       tag: "프레스티지", mult: 2.43, color: "#B07D9E", desc: "최고급 자재·시공·맞춤 제작", target60: 340000000 },
  { key: "ultralux",  label: "시그니처",     tag: "하이엔드+", mult: 3.0,  color: "#8B7BB5", desc: "올 커스텀, 해외 자재, 풀 디자인", target60: 420000000 },
];

export const gradeMap: Record<string, Grade> = {};
GRADES.forEach(g => { gradeMap[g.key] = g; });

// ─── 계산 함수 ───
export const BASE = 27;
export const areaCoeff = (a: number) => a <= 15 ? 1.18 : a <= 20 ? 1.10 : a <= 26 ? 1.04 : a <= 32 ? 1.0 : a <= 40 ? 0.96 : a <= 50 ? 0.92 : a <= 65 ? 0.88 : a <= 80 ? 0.85 : 0.82;
export const rooms = (a: number) => a <= 15 ? 1 : a <= 20 ? 2 : a <= 26 ? 3 : a <= 32 ? 4 : a <= 42 ? 5 : a <= 55 ? 6 : a <= 75 ? 7 : 8;
export const baths = (a: number) => a <= 26 ? 1 : a <= 42 ? 2 : a <= 65 ? 2 : 3;

// ─── 포맷 함수 ───
export const fmt = (n: number | null | undefined) => n == null || isNaN(n) ? "₩0" : "₩" + Math.round(n).toLocaleString("ko-KR");
export const fmtM = (n: number) => { const m = Math.round(n / 10000); if (Math.abs(m) >= 10000) return (m / 10000).toFixed(1) + "억"; return m.toLocaleString() + "만"; };
export const fmtShort = (n: number) => { if (n >= 100000000) return (n / 100000000).toFixed(1) + "억"; if (n >= 10000000) return (n / 10000000).toFixed(1) + "천만"; return fmtM(n); };

// ─── 공종 데이터 (27평 standard 기준) ───
export const CATS: Cat[] = [
  {
    id: "demolition", name: "철거공사", icon: "铁", color: "#C4726C", essential: true,
    desc: "기존 시설물 해체·폐기물 처리",
    subs: [
      { name: "철거 인건비", base: 780000, scale: "partial", ratio: 0.3, type: "labor" },
      { name: "욕실 방수층/도기류 철거", base: 1000000, scale: "fixed", type: "work" },
      { name: "가구철거 (싱크대,신발장 등)", base: 750000, scale: "fixed", type: "work" },
      { name: "본 철거 (천장,벽체)", base: 600000, scale: "linear", type: "work" },
      { name: "폐기물 처리 (1t차량)", base: 825000, scale: "partial", ratio: 0.5, type: "material" },
      { name: "바닥철거 및 샌딩", base: 625000, scale: "linear", type: "work" },
    ],
    gradeAdj: { basic: -800000, economy: -400000, standard: 0, comfort: 150000, premium: 350000, highend: 600000, luxury: 900000, ultralux: 1300000 },
  },
  {
    id: "plumbing", name: "설비공사", icon: "设", color: "#6B9DC2", essential: true,
    desc: "배관·방수·급배수 공사",
    subs: [
      { name: "설비 인건비 (종합설비)", base: 650000, scale: "fixed", type: "labor" },
      { name: "입배수 이동 및 교체", base: 1000000, scale: "fixed", type: "work" },
      { name: "조적설비", base: 500000, scale: "fixed", type: "work" },
      { name: "방수설비", base: 650000, scale: "fixed", type: "material" },
      { name: "주방 수평몰탈", base: 650000, scale: "fixed", type: "work" },
      { name: "도막방수", base: 450000, scale: "fixed", type: "material" },
    ],
    gradeAdj: { basic: -500000, economy: -300000, standard: 0, comfort: 200000, premium: 600000, highend: 1200000, luxury: 2000000, ultralux: 3000000 },
  },
  {
    id: "window", name: "창호공사", icon: "窗", color: "#9B7DB8", essential: false,
    desc: "샷시·유리창·발코니 도어",
    subs: [
      { name: "샷시 (m²계산)", base: 9800000, scale: "partial", ratio: 0.45, type: "material" },
      { name: "터닝도어 (발코니)", base: 550000, scale: "fixed", type: "material" },
    ],
    matOptions: [
      { grade: "basic", name: "국산 기본 22mm", price: 5500000 },
      { grade: "economy", name: "한화 이너뷰 22mm", price: 7000000 },
      { grade: "standard", name: "KCC 윈체 플러스 26mm", price: 9800000 },
      { grade: "comfort", name: "KCC 원빌라즈 26mm", price: 11000000 },
      { grade: "premium", name: "KCC 원빌라즈 28mm 로이", price: 13000000 },
      { grade: "highend", name: "LX 수퍼세이브 3중유리", price: 16000000 },
      { grade: "luxury", name: "독일 수입 시스템창", price: 22000000 },
      { grade: "ultralux", name: "커스텀 시스템창+전동", price: 30000000 },
    ],
    gradeAdj: { basic: 0, economy: 0, standard: 0, comfort: 400000, premium: 800000, highend: 1500000, luxury: 2500000, ultralux: 4000000 },
  },
  {
    id: "electrical", name: "전기공사", icon: "电", color: "#C9A855", essential: true,
    desc: "배선·스위치·조명",
    subs: [
      { name: "전기 인건비 (팀장)", base: 300000, scale: "fixed", type: "labor" },
      { name: "전기 인건비 (기공)", base: 300000, scale: "fixed", type: "labor" },
      { name: "부자재 (전선,케이블,난연관)", base: 850000, scale: "linear", type: "material" },
      { name: "스위치류", base: 550000, scale: "linear", type: "material" },
      { name: "등기구 설치 (2인)", base: 600000, scale: "fixed", type: "labor" },
      { name: "간접조명 LED바/T5", base: 850000, scale: "linear", type: "material" },
      { name: "다운라이트", base: 550000, scale: "linear", type: "material" },
    ],
    matOptions: [
      { grade: "basic", name: "일반 스위치+기본LED", price: 400000 },
      { grade: "economy", name: "일반 스위치+LED", price: 550000 },
      { grade: "standard", name: "디자인 스위치+COB LED", price: 850000 },
      { grade: "comfort", name: "신성 디자인+고급 LED", price: 1100000 },
      { grade: "premium", name: "르그랑+고급 조명", price: 1500000 },
      { grade: "highend", name: "르그랑+디자인 조명기구", price: 2200000 },
      { grade: "luxury", name: "루트론 디머+자동화", price: 3500000 },
      { grade: "ultralux", name: "풀 홈오토메이션 조명", price: 5500000 },
    ],
    gradeAdj: { basic: -600000, economy: -400000, standard: 0, comfort: 300000, premium: 700000, highend: 1500000, luxury: 2800000, ultralux: 5000000 },
  },
  {
    id: "carpentry", name: "목공사", icon: "木", color: "#9E8B76", essential: true,
    desc: "천장·벽체·몰딩 목재 작업",
    subs: [
      { name: "목수 인건비 (팀장 42만×4일)", base: 1680000, scale: "linear", type: "labor" },
      { name: "목수 인건비 (기공 38만×8일)", base: 3040000, scale: "linear", type: "labor" },
      { name: "장비 사용료", base: 400000, scale: "fixed", type: "work" },
      { name: "부자재 (접착재,폼,철물)", base: 120000, scale: "fixed", type: "material" },
      { name: "목자재 (석고,MDF,각재,단열재)", base: 2800000, scale: "linear", type: "material" },
    ],
    gradeAdj: { basic: -3500000, economy: -2000000, standard: 0, comfort: 800000, premium: 1800000, highend: 3500000, luxury: 5500000, ultralux: 9000000 },
  },
  {
    id: "door", name: "도어", icon: "门", color: "#7D8B96", essential: false,
    desc: "방문·히든도어·하드웨어",
    subs: [
      { name: "도어", base: 900000, scale: "room", type: "material", perRoom: 225000 },
      { name: "실린더+경첩", base: 260000, scale: "room", type: "material", perRoom: 65000 },
    ],
    matOptions: [
      { grade: "basic", name: "기본 ABS도어", price: 150000 },
      { grade: "economy", name: "ABS도어", price: 180000 },
      { grade: "standard", name: "온누리/갤러리도어", price: 225000 },
      { grade: "comfort", name: "디자인 ABS도어", price: 280000 },
      { grade: "premium", name: "우드도어", price: 400000 },
      { grade: "highend", name: "우드+히든도어 1개", price: 550000 },
      { grade: "luxury", name: "원목도어+히든 전실", price: 750000 },
      { grade: "ultralux", name: "커스텀 원목+전실히든", price: 1000000 },
    ],
    gradeAdj: { basic: 0, economy: 0, standard: 0, comfort: 200000, premium: 500000, highend: 1200000, luxury: 2500000, ultralux: 4000000 },
  },
  {
    id: "film", name: "필름공사", icon: "膜", color: "#5DA8A8", essential: false,
    desc: "인테리어 필름 (가구면·문틀)",
    subs: [
      { name: "필름 인건비 (팀장 2인)", base: 600000, scale: "partial", ratio: 0.4, type: "labor" },
      { name: "필름 인건비 (기공 3인)", base: 855000, scale: "partial", ratio: 0.4, type: "labor" },
      { name: "부자재 (핸디코트,프라이머)", base: 900000, scale: "linear", type: "material" },
      { name: "필름 원단", base: 560000, scale: "linear", type: "material" },
    ],
    matOptions: [
      { grade: "basic", name: "국산 기본 필름", price: 180000 },
      { grade: "economy", name: "현대L&C 보닥", price: 250000 },
      { grade: "standard", name: "LX하우시스 필름", price: 280000 },
      { grade: "comfort", name: "LX 프리미엄", price: 320000 },
      { grade: "premium", name: "3M 다이녹", price: 380000 },
      { grade: "highend", name: "3M 다이녹 우드", price: 450000 },
      { grade: "luxury", name: "수입 우드그레인", price: 550000 },
      { grade: "ultralux", name: "유럽 프리미엄 필름", price: 700000 },
    ],
    gradeAdj: { basic: -800000, economy: -500000, standard: 0, comfort: 300000, premium: 600000, highend: 1000000, luxury: 1600000, ultralux: 2500000 },
  },
  {
    id: "tile", name: "타일공사", icon: "砖", color: "#8E7260", essential: true,
    desc: "욕실·현관·발코니 타일",
    subs: [
      { name: "타일 인건비 (38만×3일)", base: 1140000, scale: "fixed", type: "labor" },
      { name: "공용 화장실 600×600", base: 1800000, scale: "fixed", type: "work" },
      { name: "현관타일 600×600", base: 450000, scale: "fixed", type: "work" },
      { name: "발코니 타일 300×300", base: 900000, scale: "partial", ratio: 0.3, type: "work" },
      { name: "기타 (졸리컷,배딩 등)", base: 700000, scale: "fixed", type: "work" },
      { name: "타일 자재+부자재", base: 1500000, scale: "partial", ratio: 0.3, type: "material" },
      { name: "양중", base: 350000, scale: "fixed", type: "labor" },
    ],
    matOptions: [
      { grade: "basic", name: "국산 기본타일", price: 800000 },
      { grade: "economy", name: "국산 포세린", price: 1000000 },
      { grade: "standard", name: "국산 고급포세린 600×600", price: 1500000 },
      { grade: "comfort", name: "국산 대형 600×1200", price: 2000000 },
      { grade: "premium", name: "스페인 수입타일", price: 2800000 },
      { grade: "highend", name: "이태리 수입 포세린", price: 4000000 },
      { grade: "luxury", name: "이태리 대리석타일", price: 5500000 },
      { grade: "ultralux", name: "천연대리석+모자이크", price: 8000000 },
    ],
    gradeAdj: { basic: -1200000, economy: -500000, standard: 0, comfort: 800000, premium: 2200000, highend: 4000000, luxury: 6500000, ultralux: 12000000 },
  },
  {
    id: "bathroom", name: "욕실도기", icon: "浴", color: "#5E9E95", essential: true,
    desc: "양변기·세면대·수전·악세사리",
    subs: [
      { name: "양변기", base: 180000, scale: "bath", type: "material" },
      { name: "세면대", base: 150000, scale: "bath", type: "material" },
      { name: "세면수전(니켈)", base: 180000, scale: "bath", type: "material" },
      { name: "샤워수전(니켈)", base: 230000, scale: "bath", type: "material" },
      { name: "거울장", base: 250000, scale: "bath", type: "material" },
      { name: "매립휴지걸이", base: 80000, scale: "bath", type: "material" },
      { name: "기구설치 인건비", base: 250000, scale: "bath", type: "labor" },
      { name: "유리파티션", base: 450000, scale: "bath", type: "material" },
      { name: "돔천장", base: 200000, scale: "bath", type: "work" },
      { name: "환풍기(힘펠)", base: 85000, scale: "bath", type: "material" },
    ],
    matOptions: [
      { grade: "basic", name: "기본 도기+일반수전", price: 250000 },
      { grade: "economy", name: "코스모+일반수전", price: 350000 },
      { grade: "standard", name: "코스모+니켈수전", price: 560000 },
      { grade: "comfort", name: "대림바스+디자인수전", price: 800000 },
      { grade: "premium", name: "아메리칸스탠다드+KVK", price: 1200000 },
      { grade: "highend", name: "듀라빗+한스그로에", price: 2000000 },
      { grade: "luxury", name: "TOTO+악사 수전", price: 3000000 },
      { grade: "ultralux", name: "빌레로이보흐+도른브라흐트", price: 5000000 },
    ],
    gradeAdj: { basic: -300000, economy: 0, standard: 0, comfort: 500000, premium: 1500000, highend: 3500000, luxury: 6000000, ultralux: 10000000 },
  },
  {
    id: "paint", name: "도장공사", icon: "涂", color: "#A87DB8", essential: false,
    desc: "발코니 탄성도장·페인트",
    subs: [
      { name: "페인트 인건비 (30만)", base: 300000, scale: "fixed", type: "labor" },
      { name: "발코니 탄성도장", base: 550000, scale: "partial", ratio: 0.4, type: "material" },
    ],
    gradeAdj: { basic: 0, economy: 0, standard: 0, comfort: 400000, premium: 1000000, highend: 2000000, luxury: 3500000, ultralux: 6000000 },
  },
  {
    id: "wallpaper", name: "도배공사", icon: "壁", color: "#C4836C", essential: true,
    desc: "벽지 시공",
    subs: [
      { name: "도배 인건비 (28.5만×3일)", base: 855000, scale: "linear", type: "labor" },
      { name: "벽지 자재 (퍼티포함)", base: 1445000, scale: "linear", type: "material" },
    ],
    matOptions: [
      { grade: "basic", name: "합지벽지 (기본)", price: 900000 },
      { grade: "economy", name: "합지벽지 (양품)", price: 1200000 },
      { grade: "standard", name: "LX 베스띠 실크", price: 2300000 },
      { grade: "comfort", name: "신한 실크벽지", price: 2800000 },
      { grade: "premium", name: "프리미엄 실크", price: 3500000 },
      { grade: "highend", name: "유럽 수입벽지", price: 5000000 },
      { grade: "luxury", name: "프리미엄 수입 + 포인트", price: 7000000 },
      { grade: "ultralux", name: "올 수입 + 아트월 + 패브릭", price: 12000000 },
    ],
    gradeAdj: { basic: 0, economy: 0, standard: 0, comfort: 300000, premium: 600000, highend: 1500000, luxury: 3000000, ultralux: 6000000 },
  },
  {
    id: "kitchen", name: "주방가구", icon: "厨", color: "#C46C6C", essential: true,
    desc: "싱크대·상판·싱크볼·후드",
    subs: [
      { name: "싱크대 상부장", base: 1500000, scale: "partial", ratio: 0.3, type: "material" },
      { name: "싱크대 하부장", base: 1800000, scale: "partial", ratio: 0.3, type: "material" },
      { name: "냉장고장", base: 650000, scale: "fixed", type: "material" },
      { name: "인조대리석 (상판+미드웨이)", base: 1800000, scale: "partial", ratio: 0.3, type: "material" },
      { name: "싱크볼", base: 400000, scale: "fixed", type: "material" },
      { name: "싱크수전", base: 220000, scale: "fixed", type: "material" },
      { name: "후드", base: 200000, scale: "fixed", type: "material" },
      { name: "서랍 언더레일", base: 580000, scale: "fixed", type: "material" },
    ],
    matOptions: [
      { grade: "basic", name: "기본 싱크대+인조대리석", price: 4000000 },
      { grade: "economy", name: "가성비 싱크대+인조대리석", price: 5000000 },
      { grade: "standard", name: "중급+LG하이막스", price: 7150000 },
      { grade: "comfort", name: "중상급+하이막스+블랑코", price: 9000000 },
      { grade: "premium", name: "고급+스타론+프랑케", price: 12000000 },
      { grade: "highend", name: "하이엔드+세자르스톤", price: 17000000 },
      { grade: "luxury", name: "맞춤제작+천연석", price: 25000000 },
      { grade: "ultralux", name: "올커스텀+빌트인가전+천연석", price: 40000000 },
    ],
    gradeAdj: { basic: -1000000, economy: 0, standard: 0, comfort: 1000000, premium: 3000000, highend: 6000000, luxury: 12000000, ultralux: 22000000 },
  },
  {
    id: "furniture", name: "가구(신발장 등)", icon: "柜", color: "#6C72A8", essential: false,
    desc: "신발장·붙박이장·드레스룸",
    subs: [
      { name: "신발장 (1.5m)", base: 750000, scale: "fixed", type: "material" },
    ],
    gradeAdj: { basic: -200000, economy: 0, standard: 0, comfort: 500000, premium: 1500000, highend: 3000000, luxury: 5000000, ultralux: 9000000 },
  },
  {
    id: "flooring", name: "바닥(마루)", icon: "地", color: "#7EA86C", essential: true,
    desc: "마루 시공",
    subs: [
      { name: "마루 시공 인건비", base: 1050000, scale: "partial", ratio: 0.3, type: "labor" },
      { name: "마루 자재 (로스15%)", base: 3593750, scale: "linear", type: "material" },
    ],
    matOptions: [
      { grade: "basic", name: "기본 강화마루", price: 60000 },
      { grade: "economy", name: "SPC 마루", price: 80000 },
      { grade: "standard", name: "동화 7.5T 강텍스쳐", price: 125000 },
      { grade: "comfort", name: "한화 헤리티지", price: 150000 },
      { grade: "premium", name: "헤링본 강마루", price: 180000 },
      { grade: "highend", name: "고급 헤링본", price: 230000 },
      { grade: "luxury", name: "유럽산 오크 원목", price: 300000 },
      { grade: "ultralux", name: "프리미엄 원목+특수코팅", price: 450000 },
    ],
    gradeAdj: { basic: -500000, economy: 0, standard: 0, comfort: 300000, premium: 800000, highend: 1500000, luxury: 2500000, ultralux: 4500000 },
  },
  {
    id: "etc", name: "기타공사", icon: "其", color: "#7B8896", essential: true,
    desc: "배관청소·입주청소·실리콘",
    subs: [
      { name: "배관청소", base: 350000, scale: "fixed", type: "work" },
      { name: "입주청소 (평당 1.4만)", base: 378000, scale: "linear", type: "labor" },
      { name: "실리콘 인건비 (40만×2일)", base: 800000, scale: "partial", ratio: 0.3, type: "labor" },
      { name: "실리콘 자재", base: 280000, scale: "partial", ratio: 0.3, type: "material" },
    ],
    gradeAdj: { basic: 0, economy: 0, standard: 0, comfort: 100000, premium: 200000, highend: 400000, luxury: 600000, ultralux: 1000000 },
  },
];

// ─── 공종별 등급 상세 스펙 설명 ───
export const GRADE_SPECS: Record<string, Record<string, string>> = {
  demolition: {
    basic: "필수 부위만 기본 철거 · 폐기물 최소 처리",
    economy: "전체 철거 · 폐기물 1t 처리 포함",
    standard: "전 구역 완전 철거 · 폐기물 반출 · 바닥 샌딩 포함",
    comfort: "꼼꼼 철거 · 몰딩/우레탄 완전 제거 · 기초 레벨링",
    premium: "정밀 철거 · 방음재 제거 · 바닥 레벨링 모르타르 선시공",
    highend: "고급 철거 · 단열재 분리 해체 · 현장 보양 강화",
    luxury: "프리미엄 철거 · 폐기물 완전 분리수거 · 먼지 차단 시스템",
    ultralux: "시그니처 철거 · HEPA 집진 시스템 · 전층 보양 완비",
  },
  plumbing: {
    basic: "기존 배관 점검 · 누수 부위 부분 교체 · 기본 방수",
    economy: "급배수관 노후 부위 교체 · 욕실 방수 신설",
    standard: "급배수관 전체 교체 · 도막방수 · 조적 설비 포함",
    comfort: "고내구성 배관재 · 욕실 방수 2겹 · 수압 테스트",
    premium: "수입 PE배관 · 방수 3겹 · 바닥 난방배관 점검",
    highend: "독일 비에가 배관 · 방수 시스템 강화 · 소음 차단 피복",
    luxury: "프리미엄 수입 배관 전량 · 완전 방수 시스템 · 소음 차단재",
    ultralux: "올커스텀 배관 · 스마트 누수감지 · 최고급 방수 시스템",
  },
  window: {
    basic: "국산 기본 22mm 2중유리 · 기밀성 기본",
    economy: "한화 이너뷰 22mm · 향상된 단열성능",
    standard: "KCC 윈체 플러스 26mm · 로이유리 옵션",
    comfort: "KCC 원빌라즈 26mm · 향상된 기밀 · 방음성",
    premium: "KCC 원빌라즈 28mm 로이 · 고단열 · 고방음",
    highend: "LX 수퍼세이브 3중유리 · 패시브 수준 단열",
    luxury: "독일 수입 시스템창 · 트리플글레이징 · 최고 단열",
    ultralux: "커스텀 시스템창 · 전동블라인드 · 스마트홈 연동",
  },
  electrical: {
    basic: "기존 배선 유지 · 스위치/콘센트 기본 교체",
    economy: "부분 배선 교체 · 일반 스위치 · 기본 LED 조명",
    standard: "전체 배선 교체 · 디자인 스위치 · COB LED 조명",
    comfort: "차폐전선 사용 · 신성 디자인 스위치 · 고효율 LED",
    premium: "르그랑 스위치 · 간접조명 전 구역 · 전용 회로 분리",
    highend: "르그랑 전용 · 디자이너 조명기구 · 회로별 차단기",
    luxury: "루트론 디머 · 자동화 조명 · 스마트 콘센트",
    ultralux: "풀 홈오토메이션 · AI 조명 제어 · 음성인식 연동",
  },
  carpentry: {
    basic: "필수 부위만 목공 · 기본 석고보드 · 단열 최소",
    economy: "거실/방 천장 목공 · 기본 몰딩 · 단열재 포함",
    standard: "전실 천장/벽체/몰딩 · 단열재 전체 시공",
    comfort: "아치/곡면 목공 부분 적용 · 고급 몰딩 · 두꺼운 단열",
    premium: "디자인 천장 포인트 · 간접조명 박스 · 수납 목공",
    highend: "맞춤 목공 디자인 · 히든도어 프레임 · 월 패널링",
    luxury: "원목 마감 목공 · 풀 패널링 · 아트월 목공 구현",
    ultralux: "올커스텀 목공 · 해외 디자이너 디자인 · 수제 마감",
  },
  door: {
    basic: "기본 ABS도어 교체 · 기존 문틀 재활용",
    economy: "ABS도어 전체 교체 · 기본 실린더",
    standard: "온누리/갤러리도어 · 디자인 실린더 · 경첩 세트",
    comfort: "디자인 ABS도어 · 프리미엄 실린더 · 소프트클로징",
    premium: "우드도어 · 고급 실린더 · 방문 차음 성능 강화",
    highend: "우드도어 + 히든도어 1개 · 모티스락 · 소음차단 개스킷",
    luxury: "원목도어 전체 + 전실 히든도어 · 모티스락 고급형",
    ultralux: "커스텀 원목 + 전실 히든 시스템 · 전자식 잠금장치",
  },
  film: {
    basic: "주요 가구면 위주 필름 · 국산 기본 필름",
    economy: "현대 L&C 보닥 · 가구면 + 문틀 필름",
    standard: "LX하우시스 · 전체 가구면 + 문틀 + 마이너스 몰딩",
    comfort: "LX 프리미엄 · 패턴 필름 포인트 적용",
    premium: "3M 다이녹 · 수입 질감 필름 · 정밀 시공",
    highend: "3M 다이녹 우드 · 우드그레인 질감 · 정교한 마감",
    luxury: "수입 우드그레인 필름 · 하이그로시 포인트",
    ultralux: "유럽 프리미엄 필름 · 커스텀 패턴 · 수제 마감",
  },
  tile: {
    basic: "욕실 기본 국산 타일 교체 · 현관 기본 시공",
    economy: "욕실 포세린 · 현관 중급 타일 · 기본 줄눈",
    standard: "욕실 고급 포세린 600×600 · 현관 · 발코니 전체",
    comfort: "욕실 대형 600×1200 · 포인트 줄눈 · 발코니 업그레이드",
    premium: "스페인 수입타일 · 에폭시 줄눈 · 정밀 시공",
    highend: "이태리 수입 포세린 · 졸리컷 마감 · 포인트 배치",
    luxury: "이태리 대리석타일 · 모자이크 포인트 · 전문 줄눈 시공",
    ultralux: "천연대리석 + 모자이크 · 해외 타일리스트 투입",
  },
  bathroom: {
    basic: "기본 도기류 (코스모 동급) · 일반 수전",
    economy: "코스모 도기 · 니켈 수전 · 일반 거울장",
    standard: "코스모 + 니켈 수전 · 힘펠 환풍기 · 유리파티션",
    comfort: "대림바스 + 디자인수전 · 안티-알러지 변기 · LED 거울",
    premium: "아메리칸스탠다드 + KVK 수전 · 벽걸이 세면대 · 욕조 옵션",
    highend: "듀라빗 + 한스그로에 수전 · 욕조 설치 · 디자인 파티션",
    luxury: "TOTO 비데 + 악사 수전 · 욕조 + 샤워부스 · 히든 수납",
    ultralux: "빌레로이보흐 + 도른브라흐트 · 욕조 + 스팀샤워 · 커스텀",
  },
  paint: {
    basic: "발코니 기본 탄성도장 1회",
    economy: "발코니 탄성도장 2회 · 기본 마감",
    standard: "발코니 탄성도장 2회 + 프라이머 · 방수 효과",
    comfort: "발코니 고급 탄성 + 실내 포인트 도장 1면",
    premium: "실내 벽면 일부 페인트 + 발코니 고급 방수도장",
    highend: "실내 전체 수성페인트 + 아트 도장 포인트",
    luxury: "수입 페인트 · 아트월 특수도장 · 정밀 마감",
    ultralux: "수입 친환경 페인트 · 맞춤 조색 · 전문 아트 도장",
  },
  wallpaper: {
    basic: "합지벽지 (기본) · 퍼티 최소",
    economy: "합지벽지 (양품) · 퍼티 전체",
    standard: "LX 베스띠 실크벽지 · 퍼티 + 초배 전체 시공",
    comfort: "신한 실크벽지 · 포인트 벽지 1~2곳",
    premium: "프리미엄 실크 · 아트월 패브릭 포인트",
    highend: "유럽 수입벽지 · 포인트 1~2면 수입 패턴",
    luxury: "프리미엄 수입 + 포인트 전면 · 특수 패브릭",
    ultralux: "올 수입 + 아트월 + 패브릭 · 전문 도배사 투입",
  },
  kitchen: {
    basic: "기본 싱크대 + 인조대리석 상판 · 기본 후드",
    economy: "가성비 싱크대 + 인조대리석 · 슬라이드 서랍",
    standard: "중급 싱크대 + LG 하이막스 상판 · 블랑코 싱크볼",
    comfort: "중상급 + 하이막스 + 블랑코 · 프리미엄 후드 · 소프트클로징",
    premium: "고급 싱크대 + 스타론 + 프랑케 · 빌트인 가전 준비",
    highend: "하이엔드 + 세자르스톤 · 빌트인 후드 · 디자인 손잡이",
    luxury: "맞춤제작 + 천연석 상판 · 빌트인 가전 + 디자인 조명",
    ultralux: "올커스텀 + 빌트인가전 + 천연석 · 해외 하드웨어",
  },
  furniture: {
    basic: "기본 신발장 교체 (1.5m 기성품)",
    economy: "신발장 + 기본 붙박이장 1개소",
    standard: "신발장 + 붙박이장 · 기본 드레스룸 구성",
    comfort: "신발장 + 드레스룸 · 소프트클로징 서랍",
    premium: "하이그로시 신발장 + 드레스룸 시스템 · LED 내부조명",
    highend: "맞춤 신발장 + 드레스룸 + 주문제작 수납",
    luxury: "프리미엄 맞춤 전체 · 원목 마감 · LED + 미러 포함",
    ultralux: "올커스텀 이탈리아 수납 · 워크인클로젯 전체",
  },
  flooring: {
    basic: "기본 강화마루 시공 (6~7mm) · 기본 걸레받이",
    economy: "SPC 방수 마루 · 내구성 우수",
    standard: "동화 7.5T 강텍스쳐 강마루 · 일반 걸레받이",
    comfort: "한화 헤리티지 강마루 · 디자인 걸레받이",
    premium: "헤링본 패턴 강마루 · 프리미엄 걸레받이",
    highend: "고급 헤링본 마루 · 패턴 시공 · 보양 강화",
    luxury: "유럽산 오크 원목마루 · 자연 오일 마감",
    ultralux: "프리미엄 원목 + 특수코팅 · 히든 걸레받이 · 수제 마감",
  },
  etc: {
    basic: "배관청소 · 기본 입주청소 · 실리콘 필수 부위",
    economy: "배관청소 + 전체 입주청소 · 실리콘 욕실 + 주방",
    standard: "배관청소 · 입주청소 전체 · 실리콘 전 구역 시공",
    comfort: "배관청소 · 프리미엄 입주청소 · 실리콘 2회 시공",
    premium: "배관청소 · 에어컨 포함 청소 · 항균 실리콘",
    highend: "배관청소 · 왁스 코팅 포함 · 고급 실리콘",
    luxury: "배관청소 · 마루 오일 코팅 · 수입 실리콘 · 제균 청소",
    ultralux: "배관청소 · 전문 클리닝 업체 · 마루 코팅 · 방향 처리",
  },
};

// ─── 공종별 표준 공사기간 (27평 기준) ───
export const CAT_DURATION: Record<string, { min: number; max: number; seq: number; note: string }> = {
  demolition: { min: 3, max: 5, seq: 1, note: "철거·폐기물 반출" },
  plumbing: { min: 2, max: 4, seq: 2, note: "배관·방수·건조" },
  window: { min: 2, max: 3, seq: 2, note: "샷시 제작·설치" },
  electrical: { min: 3, max: 5, seq: 2, note: "배선·분전반·스위치" },
  carpentry: { min: 7, max: 12, seq: 3, note: "천장·벽체·몰딩" },
  tile: { min: 3, max: 6, seq: 3, note: "타일 시공·양생" },
  bathroom: { min: 1, max: 2, seq: 4, note: "도기류 설치" },
  door: { min: 1, max: 1, seq: 5, note: "방문 설치" },
  film: { min: 2, max: 4, seq: 5, note: "필름 시공" },
  paint: { min: 1, max: 2, seq: 5, note: "도장·건조" },
  wallpaper: { min: 2, max: 3, seq: 6, note: "도배 시공" },
  kitchen: { min: 1, max: 2, seq: 7, note: "싱크대 설치" },
  furniture: { min: 1, max: 1, seq: 7, note: "붙박이장 설치" },
  flooring: { min: 2, max: 4, seq: 7, note: "마루 시공" },
  etc: { min: 1, max: 2, seq: 8, note: "청소·실리콘" },
};

// ─── 계산 함수 ───
export function getDuration(catId: string, area: number): { min: number; max: number; note: string } {
  const d = CAT_DURATION[catId];
  if (!d) return { min: 1, max: 2, note: "" };
  const scale = Math.max(0.7, Math.min(2.2, area / BASE));
  return {
    min: Math.max(1, Math.round(d.min * Math.max(0.8, scale))),
    max: Math.max(1, Math.round(d.max * scale)),
    note: d.note,
  };
}

export function calcSubDesc(sub: Sub, area: number): string {
  const ar = area / BASE;
  const ac = areaCoeff(area);
  const ratio = sub.ratio ?? 0.3;
  switch (sub.scale) {
    case "linear":
      return `${fmtM(sub.base)} × ${ar.toFixed(2)} (면적비) × ${ac.toFixed(2)} (보정)`;
    case "fixed":
      return `${fmtM(sub.base)} × ${ac.toFixed(2)} (면적보정) = 고정`;
    case "room":
      return `${fmtM(sub.perRoom ?? sub.base / 4)}/실 × ${rooms(area)}실 × ${ac.toFixed(2)}`;
    case "bath":
      return `${fmtM(sub.base)}/욕실 × ${baths(area)}욕실 × ${ac.toFixed(2)}`;
    case "partial": {
      const fixedAmt = sub.base * (1 - ratio);
      const varAmt = sub.base * ratio;
      return `고정 ${fmtM(fixedAmt)} + 변동 ${fmtM(varAmt)} × ${ar.toFixed(2)} × ${ac.toFixed(2)}`;
    }
    default: return "";
  }
}

export function calcSub(sub: Sub, area: number) {
  const ar = area / BASE;
  const ac = areaCoeff(area);
  if (sub.scale === "linear") return sub.base * ar * ac;
  if (sub.scale === "partial") return ((sub.base * (1 - (sub.ratio || 0.3))) + (sub.base * (sub.ratio || 0.3) * ar)) * ac;
  if (sub.scale === "room") return (sub.perRoom || sub.base / 4) * rooms(area) * ac;
  if (sub.scale === "bath") return sub.base * baths(area) * ac;
  return sub.base * ac;
}

export function calcCatTotal(cat: Cat, area: number, gKey: string, override?: string) {
  const g = override || gKey;
  let total = cat.subs.reduce((s, sub) => s + calcSub(sub, area), 0);
  if (cat.matOptions) {
    const std = cat.matOptions.find(m => m.grade === "standard")?.price || 0;
    const cur = cat.matOptions.find(m => m.grade === g)?.price || std;
    if (cat.id === "flooring") total += (cur - 125000) * area * 1.15;
    else if (cat.id === "door") total += (cur - (cat.matOptions.find(m => m.grade === "standard")?.price || 225000)) * rooms(area);
    else total += cur - std;
  }
  total += (cat.gradeAdj?.[g] || 0);
  return Math.round(Math.max(0, total) / 10000) * 10000;
}

export const STEPS = ["평수", "등급", "공종", "상세", "견적서"];
