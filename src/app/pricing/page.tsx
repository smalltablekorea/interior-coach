"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, X, ChevronDown, ArrowRight, Wallet, Clock, FileText, Lightbulb, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/plans";

// ─── Plan Data ───

interface PlanFeature {
  text: string;
  included: boolean;
  section?: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  badge: string | null;
  highlighted: boolean;
  darkTheme: boolean;
  ctaText: string;
  ctaHref: string;
  color: string;
  valueMessage?: string;
  subPriceText?: string;
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "무료",
    description: "시작은 부담 없이",
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    badge: null,
    highlighted: false,
    darkTheme: false,
    ctaText: "무료로 시작하기",
    ctaHref: "/auth/login",
    color: "slate",
    subPriceText: "영구 무료, 카드 등록 불필요",
    features: [
      { text: "현장 3개 관리", included: true },
      { text: "고객 20명 등록", included: true },
      { text: "기본 공정 관리 (6공종)", included: true },
      { text: "간단 정산 (총액)", included: true },
      { text: "견적코치 무료 분석", included: true },
      { text: "상담 이력 기록", included: true },
      { text: "공종별 정산", included: false },
      { text: "마케팅 자동화", included: false },
      { text: "세무/회계", included: false },
      { text: "Excel 내보내기", included: false },
    ],
  },
  {
    id: "starter",
    name: "스타터",
    description: "본격적으로 현장 관리",
    monthlyPrice: 149000,
    yearlyMonthlyPrice: 119000,
    badge: null,
    highlighted: false,
    darkTheme: false,
    ctaText: "스타터 시작하기",
    ctaHref: "/auth/login",
    color: "blue",
    features: [
      { text: "Free 전체 포함", included: true },
      { text: "현장 15개 관리", included: true, section: "추가 기능" },
      { text: "고객 100명 등록", included: true },
      { text: "공종별 정산 (12공종)", included: true },
      { text: "실시간 수익률", included: true },
      { text: "미수금 관리 + 알림", included: true },
      { text: "견적서 템플릿 3개", included: true },
      { text: "세무 캘린더 + 기본 장부", included: true },
      { text: "AI 세무 상담 (월 10회)", included: true },
      { text: "Excel 내보내기", included: true },
      { text: "마케팅 자동화", included: false },
      { text: "전자 계약", included: false },
      { text: "인력/자재 관리", included: false },
    ],
  },
  {
    id: "pro",
    name: "프로",
    description: "중소 인테리어 업체의 올인원",
    monthlyPrice: 299000,
    yearlyMonthlyPrice: 239000,
    badge: "가장 인기",
    highlighted: true,
    darkTheme: false,
    ctaText: "14일 무료 체험",
    ctaHref: "/auth/login",
    color: "green",
    valueMessage: "블로그 대행 + 세무사 + 현장관리앱 = 최소 95만원 → 29.9만원에 전부!",
    features: [
      { text: "Starter 전체 포함", included: true },
      { text: "현장 무제한", included: true, section: "핵심 추가" },
      { text: "고객 무제한", included: true },
      { text: "사용자 5명", included: true },
      { text: "스레드 자동화 (30건/월)", included: true, section: "마케팅 자동화" },
      { text: "인스타그램 자동화 (20건/월)", included: true },
      { text: "네이버 블로그 자동화 (8건/월)", included: true },
      { text: "유튜브 자동화 (4건/월)", included: true },
      { text: "메타 광고 대시보드", included: true },
      { text: "OCR 영수증 자동 등록", included: true, section: "세무/회계" },
      { text: "부가세 자동 산출", included: true },
      { text: "현장별 수익 분석", included: true },
      { text: "AI 세무 상담 무제한", included: true },
      { text: "전자 계약 (카카오/PASS)", included: true, section: "추가" },
      { text: "인력/자재 관리", included: true },
      { text: "고객 포털", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "엔터프라이즈",
    description: "대형 업체 & 프랜차이즈",
    monthlyPrice: 599000,
    yearlyMonthlyPrice: 479000,
    badge: "PREMIUM",
    highlighted: false,
    darkTheme: true,
    ctaText: "도입 문의하기",
    ctaHref: "/auth/login",
    color: "amber",
    subPriceText: "10인 초과 시 인당 월 ₩39,000 추가",
    features: [
      { text: "Pro 전체 포함", included: true },
      { text: "모든 기능 무제한", included: true, section: "핵심 추가" },
      { text: "사용자 무제한", included: true },
      { text: "마케팅 발행 무제한", included: true },
      { text: "다지점 관리 (본사↔지점)", included: true, section: "대형 업체" },
      { text: "지점별 성과 비교", included: true },
      { text: "API 연동 (REST)", included: true },
      { text: "SSO 지원", included: true },
      { text: "복식부기/법인세 관리", included: true, section: "프리미엄 세무" },
      { text: "4대보험 자동", included: true },
      { text: "세무대리인 공유", included: true },
      { text: "전담 고객 매니저", included: true, section: "프리미엄 지원" },
      { text: "온보딩 교육 (1회)", included: true },
      { text: "우선 기술 지원 (4시간)", included: true },
    ],
  },
];

// ─── Calculator Data ───

interface CalcItem {
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  step: number;
}

const CALC_ITEMS: CalcItem[] = [
  { label: "네이버 블로그 대행", min: 300000, max: 1500000, defaultValue: 700000, step: 50000 },
  { label: "세무사 기장료", min: 150000, max: 800000, defaultValue: 350000, step: 50000 },
  { label: "현장관리 앱", min: 50000, max: 300000, defaultValue: 150000, step: 10000 },
  { label: "SNS 대행 (인스타/유튜브)", min: 500000, max: 3000000, defaultValue: 1000000, step: 100000 },
  { label: "SMS 마케팅 대행", min: 200000, max: 800000, defaultValue: 400000, step: 50000 },
  { label: "견적서/계약서 관리", min: 50000, max: 200000, defaultValue: 100000, step: 10000 },
];

// ─── Comparison Data ───

interface ComparisonCategory {
  name: string;
  rows: { label: string; free: string | boolean; starter: string | boolean; pro: string | boolean; enterprise: string | boolean }[];
}

const COMPARISON_DATA: ComparisonCategory[] = [
  {
    name: "현장관리",
    rows: [
      { label: "현장 등록", free: "3개", starter: "15개", pro: "무제한", enterprise: "무제한" },
      { label: "사진 업로드 (현장당)", free: "20장", starter: "200장", pro: "무제한", enterprise: "무제한" },
      { label: "공정 관리", free: "6공종", starter: "12+커스텀", pro: "12+커스텀", enterprise: "12+커스텀" },
      { label: "현장 건강점수", free: false, starter: "기본", pro: "상세", enterprise: "상세+예측" },
      { label: "협력 관리", free: false, starter: false, pro: true, enterprise: true },
    ],
  },
  {
    name: "정산관리",
    rows: [
      { label: "공종별 정산", free: false, starter: true, pro: true, enterprise: true },
      { label: "실시간 수익률", free: false, starter: true, pro: true, enterprise: true },
      { label: "미수금 관리", free: false, starter: true, pro: true, enterprise: true },
      { label: "OCR 영수증 스캔", free: false, starter: false, pro: true, enterprise: true },
    ],
  },
  {
    name: "마케팅 자동화",
    rows: [
      { label: "스레드 자동화", free: false, starter: false, pro: "30건/월", enterprise: "무제한" },
      { label: "인스타그램 자동화", free: false, starter: false, pro: "20건/월", enterprise: "무제한" },
      { label: "네이버 블로그 자동화", free: false, starter: false, pro: "8건/월", enterprise: "무제한" },
      { label: "유튜브 자동화", free: false, starter: false, pro: "4건/월", enterprise: "무제한" },
      { label: "메타 광고 대시보드", free: false, starter: false, pro: true, enterprise: true },
    ],
  },
  {
    name: "세무/회계",
    rows: [
      { label: "세무 캘린더 + 장부", free: false, starter: true, pro: true, enterprise: true },
      { label: "OCR 영수증 자동 등록", free: false, starter: false, pro: true, enterprise: true },
      { label: "부가세 자동 산출", free: false, starter: false, pro: true, enterprise: true },
      { label: "현장별 수익 분석", free: false, starter: false, pro: true, enterprise: true },
      { label: "AI 세무 상담", free: false, starter: "10회/월", pro: "무제한", enterprise: "무제한" },
      { label: "복식부기/법인세", free: false, starter: false, pro: false, enterprise: true },
      { label: "4대보험 자동", free: false, starter: false, pro: false, enterprise: true },
    ],
  },
  {
    name: "고객/견적/계약",
    rows: [
      { label: "고객 등록", free: "20명", starter: "100명", pro: "무제한", enterprise: "무제한" },
      { label: "고객 포털", free: false, starter: false, pro: true, enterprise: true },
      { label: "전자 계약", free: false, starter: false, pro: true, enterprise: true },
      { label: "견적코치 리드 연결", free: false, starter: false, pro: "유료", enterprise: "유료" },
    ],
  },
  {
    name: "인력/자재/AI",
    rows: [
      { label: "인력 관리", free: false, starter: false, pro: true, enterprise: true },
      { label: "자재 관리", free: false, starter: false, pro: true, enterprise: true },
    ],
  },
  {
    name: "관리/보안",
    rows: [
      { label: "사용자 수", free: "1명", starter: "1명", pro: "5명", enterprise: "무제한" },
      { label: "다지점 관리", free: false, starter: false, pro: false, enterprise: true },
      { label: "API 제공", free: false, starter: false, pro: false, enterprise: true },
      { label: "전담 매니저", free: false, starter: false, pro: false, enterprise: true },
      { label: "Excel 내보내기", free: false, starter: true, pro: true, enterprise: true },
    ],
  },
];

// ─── FAQ Data ───

const FAQ_DATA = [
  {
    q: "무료 체험 후 자동으로 결제되나요?",
    a: "14일 무료 체험 종료 3일 전에 알림을 보내드립니다. 체험 기간 내 해지하시면 비용이 청구되지 않습니다. 해지 후에도 입력하신 데이터는 Free 플랜에서 계속 보실 수 있습니다.",
  },
  {
    q: "플랜을 중간에 변경할 수 있나요?",
    a: "언제든 업그레이드/다운그레이드 가능합니다. 업그레이드는 즉시 적용되며 남은 기간 일할 계산으로 차액 결제됩니다. 다운그레이드는 현재 결제 기간 종료 후 적용되며 초과 데이터는 읽기 전용으로 유지됩니다.",
  },
  {
    q: "마케팅 자동화에 별도 비용이 드나요?",
    a: "아닙니다. 스레드, 인스타, 블로그, 유튜브, 메타 광고 대시보드 모두 Pro 구독료에 포함되어 있습니다. 별도 API 토큰 비용도 없습니다. 다만 메타 광고 자체의 광고비는 메타에 직접 결제하셔야 합니다.",
  },
  {
    q: "AI 세무 상담이 실제 세무사를 대체할 수 있나요?",
    a: "AI 세무 상담은 인테리어 업종 전문 세법을 학습한 AI입니다. 일반적인 세무 상담, 부가세 신고 보조, 절세 팁 등을 제공합니다. 다만 법적 효력이 있는 세무 대리는 세무사 자격이 필요하므로 복잡한 세무 이슈는 전문 세무사와 상담하시길 권합니다.",
  },
  {
    q: "견적코치는 업체도 이용할 수 있나요?",
    a: "네! 업체용 기능이 별도로 있습니다. Pro+ 플랜에 가입하면 견적코치에서 접수되는 소비자 고객이 자동으로 연결됩니다. 광고비 0원으로 고객을 확보하는 효과가 있습니다.",
  },
  {
    q: "데이터가 안전한가요?",
    a: "모든 데이터는 AWS 기반 클라우드에 암호화 저장됩니다. 업체별 데이터 격리(Row Level Security)가 적용되어 다른 업체의 데이터에 접근할 수 없습니다. Enterprise는 일일 자동 백업 + 3년 데이터 보관 정책이 적용됩니다.",
  },
  {
    q: "직원들도 같이 쓸 수 있나요?",
    a: "Pro 플랜은 최대 5명, Enterprise는 무제한 사용자를 지원합니다. 역할별 권한 설정이 가능하여 대표/실장/디자이너/현장소장 등 각자 필요한 기능만 볼 수 있도록 설정할 수 있습니다.",
  },
  {
    q: "환불 정책은 어떻게 되나요?",
    a: "월간 결제: 결제일로부터 7일 이내 전액 환불. 연간 결제: 결제일로부터 14일 이내 전액 환불. 이후 해지 시 남은 기간에 대한 일할 환불은 지원하지 않으며, 현재 결제 기간 종료까지 서비스를 이용하실 수 있습니다.",
  },
  {
    q: "다른 프로그램에서 데이터를 가져올 수 있나요?",
    a: "Excel(xlsx) 파일로 현장/고객/정산 데이터를 일괄 업로드할 수 있습니다. 기존에 사용하시던 현장관리앱이나 엑셀 파일에서 데이터를 내보내신 후 인테리어코치에 업로드하시면 자동으로 매핑됩니다. Enterprise 플랜은 API를 통한 외부 시스템 연동도 지원합니다.",
  },
  {
    q: "네이버 블로그 연동에 별도 비용이 있나요?",
    a: "인테리어코치 내 네이버 블로그 연동 기능은 Pro 구독료에 포함됩니다. 인테리어코치는 네이버 API 데이터를 읽어와서 통합 표시하는 역할입니다.",
  },
];

// ─── CountUp Hook ───

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = ref.current ?? 0;
    ref.current = target;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

// ─── Components ───

function BillingToggle({ yearly, setYearly }: { yearly: boolean; setYearly: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <span className={`text-sm font-medium transition-colors ${!yearly ? "text-white" : "text-[var(--muted)]"}`}>
        월간 결제
      </span>
      <button
        onClick={() => setYearly(!yearly)}
        className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? "bg-[var(--green)]" : "bg-[var(--border)]"}`}
        role="switch"
        aria-checked={yearly}
        aria-label="연간 결제 토글"
      >
        <div
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${yearly ? "translate-x-7" : "translate-x-0.5"}`}
        />
      </button>
      <span className={`text-sm font-medium transition-colors ${yearly ? "text-white" : "text-[var(--muted)]"}`}>
        연간 결제
      </span>
      {yearly && (
        <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)] text-xs font-semibold">
          20% 할인
        </span>
      )}
    </div>
  );
}

function PlanCard({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  const price = yearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
  const originalPrice = plan.monthlyPrice;

  const cardBg = plan.darkTheme
    ? "bg-[#0a0a0a] text-white"
    : "bg-[var(--card)]";

  const borderClass = plan.highlighted
    ? "border-2 border-[var(--green)] shadow-[0_0_40px_rgba(0,196,113,0.12)]"
    : plan.darkTheme
      ? "border border-amber-500/30"
      : plan.id === "starter"
        ? "border border-blue-500/30"
        : "border border-[var(--border)]";

  const ctaClass = plan.highlighted
    ? "bg-[var(--green)] text-black font-semibold hover:opacity-90 py-3 text-base"
    : plan.darkTheme
      ? "bg-amber-500 text-black font-semibold hover:bg-amber-400 py-2.5"
      : plan.id === "starter"
        ? "border border-blue-400/50 text-blue-400 hover:bg-blue-500/10 py-2.5"
        : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--border)] py-2.5";

  let currentSection = "";

  return (
    <div
      id={plan.id}
      className={`relative rounded-2xl ${cardBg} ${borderClass} p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        plan.highlighted ? "lg:-translate-y-2 lg:scale-[1.02]" : ""
      } ${plan.id === "pro" ? "order-first md:order-none" : ""}`}
    >
      {plan.badge && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
            plan.highlighted
              ? "bg-[var(--green)] text-black"
              : "bg-amber-500 text-black"
          }`}
        >
          {plan.badge}
        </div>
      )}

      {/* Plan Name + Desc */}
      <div className="mb-5">
        <h3
          className={`text-xl font-bold ${
            plan.id === "starter" ? "text-blue-400" : plan.id === "pro" ? "text-[var(--green)]" : plan.darkTheme ? "text-amber-400" : ""
          }`}
        >
          {plan.name}
        </h3>
        <p className="text-xs text-[var(--muted)] mt-1">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
          {price > 0 && <span className="text-sm text-[var(--muted)]">/월</span>}
        </div>
        {yearly && price > 0 && (
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-[var(--muted)]">
              <span className="line-through">월 {formatPrice(originalPrice)}</span>
              <span className="ml-1.5 text-[var(--green)] font-medium">20% 할인</span>
            </p>
            <p className="text-xs text-[var(--muted)]">연 {formatPrice(price * 12)}</p>
          </div>
        )}
        {!yearly && price > 0 && (
          <p className="text-xs text-[var(--muted)] mt-1">연간 결제 시 월 {formatPrice(plan.yearlyMonthlyPrice)}</p>
        )}
        {plan.subPriceText && (
          <p className="text-xs text-[var(--muted)] mt-1">{plan.subPriceText}</p>
        )}
      </div>

      {/* Value Message */}
      {plan.valueMessage && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
          <p className="text-xs text-[var(--green)] leading-relaxed flex items-start gap-1.5">
            <Lightbulb size={14} className="shrink-0 mt-0.5" />
            {plan.valueMessage}
          </p>
        </div>
      )}

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={`w-full rounded-xl text-sm text-center block transition-all ${ctaClass}`}
      >
        {plan.ctaText}
      </Link>
      {plan.highlighted && (
        <p className="text-[10px] text-center text-[var(--muted)] mt-1.5">카드 등록 후 14일 무료, 언제든 해지</p>
      )}

      {/* Divider */}
      <div className={`my-5 border-t ${plan.darkTheme ? "border-white/10" : "border-[var(--border)]"}`} />

      {/* Features */}
      <div className="space-y-2 flex-1">
        {plan.features.map((f, i) => {
          const showSection = f.section && f.section !== currentSection;
          if (f.section) currentSection = f.section;

          return (
            <div key={i}>
              {showSection && (
                <p className={`text-[10px] font-semibold uppercase tracking-wider mt-3 mb-1.5 ${plan.darkTheme ? "text-amber-500/60" : plan.highlighted ? "text-[var(--green)]/60" : "text-[var(--muted)]"}`}>
                  {f.section}
                </p>
              )}
              <div className="flex items-start gap-2 text-sm">
                {f.included ? (
                  <Check size={14} className={`shrink-0 mt-0.5 ${plan.darkTheme ? "text-amber-400" : "text-[var(--green)]"}`} />
                ) : (
                  <X size={14} className="shrink-0 mt-0.5 text-white/10" />
                )}
                <span className={f.included ? "" : "text-[var(--muted)] line-through opacity-40"}>
                  {f.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CostCalculator() {
  const [items, setItems] = useState<Record<number, { checked: boolean; value: number }>>(
    () => Object.fromEntries(CALC_ITEMS.map((item, i) => [i, { checked: i < 3, value: item.defaultValue }]))
  );

  const total = Object.entries(items).reduce(
    (sum, [i, { checked, value }]) => (checked ? sum + value : sum),
    0
  );

  const proPrice = 299000;
  const savings = total - proPrice;
  const animatedTotal = useCountUp(total);
  const animatedSavings = useCountUp(Math.max(savings, 0));

  const toggleItem = (idx: number) => {
    setItems((prev) => ({ ...prev, [idx]: { ...prev[idx], checked: !prev[idx].checked } }));
  };

  const updateValue = (idx: number, value: number) => {
    setItems((prev) => ({ ...prev, [idx]: { ...prev[idx], value, checked: true } }));
  };

  return (
    <section id="calculator" className="py-20 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">지금 매달 이만큼 쓰고 계시진 않나요?</h2>
          <p className="text-[var(--muted)] mt-2">인테리어코치 Pro 하나면 전부 해결됩니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sliders */}
          <div className="space-y-4">
            {CALC_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-colors ${
                  items[i].checked ? "border-[var(--green)]/30 bg-[var(--green)]/[0.03]" : "border-[var(--border)] opacity-50"
                }`}
              >
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={items[i].checked}
                      onChange={() => toggleItem(i)}
                      className="w-4 h-4 rounded accent-[var(--green)]"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--green)]">
                    월 {formatPrice(items[i].value)}
                  </span>
                </label>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={items[i].value}
                  onChange={(e) => updateValue(i, Number(e.target.value))}
                  disabled={!items[i].checked}
                  className="w-full h-1.5 rounded-full appearance-none bg-[var(--border)] accent-[var(--green)] disabled:opacity-30"
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
                  <span>{formatPrice(item.min)}</span>
                  <span>{formatPrice(item.max)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center">
                <p className="text-xs text-[var(--muted)] mb-1">현재 지출</p>
                <p className="text-2xl font-bold text-[var(--red)]">
                  {formatPrice(animatedTotal)}
                  <span className="text-sm font-normal text-[var(--muted)]">/월</span>
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-1">연 {formatPrice(total * 12)}</p>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/5 text-center">
                <p className="text-xs text-[var(--muted)] mb-1">인테리어코치 Pro</p>
                <p className="text-2xl font-bold text-[var(--green)]">
                  {formatPrice(proPrice)}
                  <span className="text-sm font-normal text-[var(--muted)]">/월</span>
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-1">연 {formatPrice(proPrice * 12)}</p>
              </div>
            </div>

            {savings > 0 && (
              <div className="p-5 rounded-2xl bg-[var(--green)]/10 border border-[var(--green)]/20 text-center mb-6">
                <p className="text-sm text-[var(--muted)]">연간 절감액</p>
                <p className="text-3xl font-bold text-[var(--green)] mt-1">
                  {formatPrice(animatedSavings * 12)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  매달 {formatPrice(animatedSavings)}을 아끼면서 더 많은 기능을!
                </p>
              </div>
            )}

            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-[var(--green)] text-black font-semibold text-center text-sm hover:opacity-90 transition-opacity block"
            >
              Pro 14일 무료 체험하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonTable() {
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({ 0: true });
  const [mobilePlan, setMobilePlan] = useState<"free" | "starter" | "pro" | "enterprise">("pro");

  const toggleCategory = useCallback((idx: number) => {
    setOpenCategories((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const planIds = ["free", "starter", "pro", "enterprise"] as const;
  const planNames = { free: "무료", starter: "스타터", pro: "프로", enterprise: "엔터프라이즈" };

  return (
    <section id="compare" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">기능 비교표</h2>
          <p className="text-[var(--muted)] mt-2">플랜별 제공 기능을 한눈에 비교하세요</p>
        </div>

        {/* Mobile Plan Selector */}
        <div className="md:hidden flex gap-1 p-1 rounded-xl bg-white/[0.04] mb-4">
          {planIds.map((pid) => (
            <button
              key={pid}
              onClick={() => setMobilePlan(pid)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                mobilePlan === pid ? "bg-[var(--green)] text-black" : "text-[var(--muted)]"
              }`}
            >
              {planNames[pid]}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-5 border-b border-[var(--border)] bg-white/[0.02]">
            <div className="py-3 px-4 text-sm font-medium text-[var(--muted)]">기능</div>
            {planIds.map((pid) => (
              <div
                key={pid}
                className={`py-3 px-4 text-sm font-medium text-center ${pid === "pro" ? "bg-[var(--green)]/5" : ""}`}
              >
                {planNames[pid]}
              </div>
            ))}
          </div>

          {/* Categories */}
          {COMPARISON_DATA.map((cat, ci) => (
            <div key={ci}>
              <button
                onClick={() => toggleCategory(ci)}
                className="w-full flex items-center justify-between py-3 px-4 bg-white/[0.02] border-b border-[var(--border)] hover:bg-[var(--border)] transition-colors"
              >
                <span className="text-sm font-semibold">{cat.name}</span>
                <ChevronDown
                  size={16}
                  className={`text-[var(--muted)] transition-transform duration-200 ${openCategories[ci] ? "rotate-180" : ""}`}
                />
              </button>

              {openCategories[ci] && (
                <div>
                  {cat.rows.map((row, ri) => (
                    <div
                      key={ri}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      {/* Desktop */}
                      <div className="hidden md:grid grid-cols-5">
                        <div className="py-2.5 px-4 text-sm text-[var(--muted)]">{row.label}</div>
                        {planIds.map((pid) => {
                          const val = row[pid];
                          return (
                            <div
                              key={pid}
                              className={`py-2.5 px-4 text-center text-sm ${pid === "pro" ? "bg-[var(--green)]/5" : ""}`}
                            >
                              {val === true ? (
                                <Check size={16} className="mx-auto text-[var(--green)]" />
                              ) : val === false ? (
                                <X size={16} className="mx-auto text-white/10" />
                              ) : (
                                <span>{val}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Mobile */}
                      <div className="md:hidden flex items-center justify-between py-2.5 px-4">
                        <span className="text-sm text-[var(--muted)]">{row.label}</span>
                        <span className="text-sm">
                          {(() => {
                            const val = row[mobilePlan];
                            if (val === true) return <Check size={16} className="text-[var(--green)]" />;
                            if (val === false) return <X size={16} className="text-white/10" />;
                            return val;
                          })()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EstimateCoachSection() {
  return (
    <section className="py-20 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">견적 받으셨나요? AI가 분석해드립니다</h2>
          <p className="text-[var(--muted)] mt-2">견적코치는 인테리어 견적을 받은 소비자를 위한 무료 서비스입니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-[var(--muted)]" />
              <h3 className="font-semibold">무료 분석</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--muted)] mb-6">
              <li className="flex items-start gap-2"><Check size={14} className="text-[var(--green)] shrink-0 mt-0.5" /> 견적 총액 + 등급 평가</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-[var(--green)] shrink-0 mt-0.5" /> 종합 요약 리포트</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-[var(--green)] shrink-0 mt-0.5" /> 공종별 기본 분석</li>
            </ul>
            <Link
              href="/auth/login"
              className="w-full py-2.5 rounded-xl border border-[var(--border)] text-sm text-center block hover:bg-[var(--border)] transition-colors"
            >
              무료로 분석하기
            </Link>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/[0.03]">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={20} className="text-[var(--green)]" />
              <h3 className="font-semibold">프로 분석</h3>
              <span className="ml-auto text-sm font-bold text-[var(--green)]">건당 ₩39,900</span>
            </div>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-start gap-2"><Check size={14} className="text-[var(--green)] shrink-0 mt-0.5" /> 12개 공종별 상세비교</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-[var(--green)] shrink-0 mt-0.5" /> 구체적 협상 팁</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-[var(--green)] shrink-0 mt-0.5" /> 누락 항목 체크</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-[var(--green)] shrink-0 mt-0.5" /> PDF 상세 리포트</li>
            </ul>
            <Link
              href="/auth/login"
              className="w-full py-2.5 rounded-xl bg-[var(--green)] text-black font-semibold text-sm text-center block hover:opacity-90 transition-opacity"
            >
              프로 분석 받기
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-6">
          인테리어 업체이신가요? Pro 플랜에 가입하면 견적코치에서 접수되는 고객이 자동 연결됩니다.
        </p>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">자주 묻는 질문</h2>

        <div className="space-y-2">
          {FAQ_DATA.map((item, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium pr-4">{item.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-[var(--muted)] shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-b from-[var(--green)]/10 to-transparent">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">
          아직 고민되시나요?
          <br />
          14일 무료로 직접 써보세요.
        </h2>
        <p className="text-[var(--muted)] mt-3 max-w-lg mx-auto">
          카드 등록 후 Pro 플랜의 모든 기능을 14일간 무료로 체험하세요.
          체험 기간 내 해지하면 비용이 청구되지 않습니다.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-10 mb-8">
          <div className="text-center">
            <Wallet size={24} className="mx-auto text-[var(--green)] mb-1" />
            <p className="text-lg font-bold">월 90만원+</p>
            <p className="text-[10px] text-[var(--muted)]">비용 절감</p>
          </div>
          <div className="text-center">
            <Clock size={24} className="mx-auto text-[var(--green)] mb-1" />
            <p className="text-lg font-bold">주 10시간+</p>
            <p className="text-[10px] text-[var(--muted)]">시간 절약</p>
          </div>
          <div className="text-center">
            <FileText size={24} className="mx-auto text-[var(--green)] mb-1" />
            <p className="text-lg font-bold">월 2-3건</p>
            <p className="text-[10px] text-[var(--muted)]">추가 계약</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--green)] text-black font-semibold hover:opacity-90 transition-opacity"
          >
            Pro 14일 무료 체험
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)] transition-colors"
          >
            도입 문의하기
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ───

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <span className="text-black font-bold text-sm">IC</span>
            </div>
            <span className="font-bold text-lg">인테리어코치</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition-colors">
              로그인
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
          인테리어 업체를 위한 올인원 솔루션
          <br />
          <span className="text-[var(--green)]">현장관리부터 마케팅까지, 하나로.</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
          블로그 대행 50만원, 세무사 30만원, 현장관리앱 15만원…
          <br className="hidden sm:block" />
          따로따로 쓰시겠습니까?
        </p>

        <BillingToggle yearly={yearly} setYearly={setYearly} />
      </section>

      {/* Plan Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} yearly={yearly} />
          ))}
        </div>
      </section>

      {/* Cost Calculator */}
      <CostCalculator />

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Estimate Coach */}
      <EstimateCoachSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 text-xs text-[var(--muted)]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="font-medium text-sm text-white/80">스몰테이블</p>
              <p>사업자등록번호: 511-27-58367</p>
              <p>대표자명: 배다솜</p>
            </div>
            <div className="space-y-1.5">
              <p>인천광역시 연수구 인천타워대로 301, A동 1301호</p>
              <p>유선번호: 0507-1315-3173</p>
            </div>
          </div>
          <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
            <p>&copy; 2026 스몰테이블. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
