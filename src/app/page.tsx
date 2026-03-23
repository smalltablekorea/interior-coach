"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  Megaphone,
  Calculator,
  ArrowRight,
  Play,
  Users,
  Minus,
  Plus,
} from "lucide-react";
import {
  CATS,
  GRADES,
  calcCatTotal,
} from "@/lib/estimate-engine";
import { fmtShort, cn } from "@/lib/utils";

// ─── Counter Animation Hook ───

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { value, ref };
}

// ─── 견적코치 미니 데모 ───

function EstimateCoachMiniDemo() {
  const [area, setArea] = useState(27);
  const [grade, setGrade] = useState("standard");

  const gradeOptions = GRADES.filter((g) =>
    ["economy", "standard", "comfort", "premium"].includes(g.key)
  );

  const selectedGrade = GRADES.find((g) => g.key === grade) || GRADES[2];

  const breakdown = CATS.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    total: calcCatTotal(cat, area, grade),
  }));

  const directTotal = breakdown.reduce((s, c) => s + c.total, 0);
  const topCats = [...breakdown].sort((a, b) => b.total - a.total).slice(0, 5);
  const maxCatTotal = topCats[0]?.total || 1;

  return (
    <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs text-[var(--muted)] mb-1.5 block">
            평수
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setArea(Math.max(10, area - 1))}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white/[0.06] text-[var(--muted)]"
            >
              <Minus size={14} />
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={10}
                max={80}
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full accent-[var(--green)]"
              />
            </div>
            <button
              onClick={() => setArea(Math.min(80, area + 1))}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white/[0.06] text-[var(--muted)]"
            >
              <Plus size={14} />
            </button>
            <span className="text-lg font-bold min-w-[60px] text-right">
              {area}평
            </span>
          </div>
        </div>
        <div className="sm:w-48">
          <label className="text-xs text-[var(--muted)] mb-1.5 block">
            등급
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {gradeOptions.map((g) => (
              <button
                key={g.key}
                onClick={() => setGrade(g.key)}
                className={cn(
                  "px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                  grade === g.key
                    ? "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30"
                    : "bg-white/[0.04] text-[var(--muted)] hover:bg-white/[0.08]"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--green)]/5 to-transparent border border-[var(--green)]/20 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--muted)]">
              {area}평 · {selectedGrade.label} 등급 예상 총 공사비
            </p>
            <p className="text-2xl font-bold mt-1">{fmtShort(directTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted)]">평당</p>
            <p className="text-lg font-bold">
              {fmtShort(Math.round(directTotal / area))}
            </p>
          </div>
        </div>
      </div>

      {/* Top Categories Chart */}
      <div className="space-y-2.5">
        {topCats.map((cat) => {
          const pct = (cat.total / maxCatTotal) * 100;
          const sharePct =
            directTotal > 0 ? ((cat.total / directTotal) * 100).toFixed(1) : "0";
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: cat.color + "20",
                      color: cat.color,
                    }}
                  >
                    {cat.icon}
                  </span>
                  <span className="text-sm">{cat.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {sharePct}%
                  </span>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {fmtShort(cat.total)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cat.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-center">
        <Link
          href="/estimates/coach"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          전체 분석 보기
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ─── Feature Cards ───

const FEATURES = [
  {
    icon: Building2,
    title: "현장관리",
    desc: "공정/일정/사진/수금을 현장별로 통합 관리. 헬스 스코어로 위험 현장을 한눈에 파악합니다.",
    color: "var(--blue)",
    highlights: ["공정별 진행률", "현장 헬스 스코어", "사진 기록"],
  },
  {
    icon: Sparkles,
    title: "견적코치 AI",
    desc: "평수·등급별 실시간 견적 시뮬레이션. AI가 비용 절감 포인트와 업체 비교 팁을 코칭합니다.",
    color: "var(--green)",
    highlights: ["12공종 분석", "등급별 비교", "AI 맞춤 상담"],
  },
  {
    icon: Megaphone,
    title: "마케팅 자동화",
    desc: "스레드·인스타·블로그·유튜브 콘텐츠를 AI가 생성하고 자동 발행합니다.",
    color: "var(--orange)",
    highlights: ["5채널 자동화", "AI 콘텐츠 생성", "메타 광고 대시보드"],
  },
  {
    icon: Calculator,
    title: "세무/회계",
    desc: "OCR 영수증 스캔, 부가세 자동 산출, AI 세무 상담으로 세무사 비용을 절감합니다.",
    color: "var(--red)",
    highlights: ["OCR 영수증", "부가세 자동", "AI 세무 상담"],
  },
];

// ─── Cost Comparison ───

const COST_ITEMS = [
  { label: "네이버 블로그 대행", cost: 700000 },
  { label: "세무사 기장료", cost: 350000 },
  { label: "현장관리 앱", cost: 150000 },
  { label: "SNS 대행", cost: 500000 },
];

// ─── Main Landing Page ───

export default function LandingPage() {
  const stats1 = useCountUp(1247);
  const stats2 = useCountUp(38500);
  const stats3 = useCountUp(92);

  const totalCurrent = COST_ITEMS.reduce((s, c) => s + c.cost, 0);
  const proPrice = 299000;
  const savings = totalCurrent - proPrice;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ─── Header ─── */}
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <span className="text-black font-bold text-sm">IC</span>
            </div>
            <span className="font-bold text-lg">인테리어코치</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted)]">
            <a href="#features" className="hover:text-white transition-colors">
              기능
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              데모
            </a>
            <a href="#pricing-compare" className="hover:text-white transition-colors">
              비용 비교
            </a>
            <Link href="/pricing" className="hover:text-white transition-colors">
              요금제
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition-colors"
            >
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

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--green)]/[0.04] rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-xs text-[var(--green)] mb-6">
            <Sparkles size={14} />
            AI 기반 인테리어 업체 올인원 SaaS
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            인테리어 업체의
            <br />
            <span className="text-[var(--green)]">모든 업무, 하나로.</span>
          </h1>

          <p className="mt-5 text-base md:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            현장관리 · 견적 · 마케팅 · 세무회계까지
            <br className="hidden sm:block" />
            월 30만원 하나로 블로그 대행 + 세무사 + 현장앱을 대체하세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--green)] text-black font-semibold hover:opacity-90 transition-opacity text-base"
            >
              무료로 시작하기
              <ArrowRight size={18} />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04] transition-colors"
            >
              <Play size={16} />
              견적코치 데모 보기
            </a>
          </div>

          <p className="text-xs text-[var(--muted)] mt-3">
            카드 등록 불필요 · 영구 무료 플랜 포함 · 3분 만에 시작
          </p>
        </div>
      </section>

      {/* ─── Social Proof / Stats ─── */}
      <section className="py-12 border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div ref={stats1.ref}>
              <p className="text-3xl md:text-4xl font-bold text-[var(--green)]">
                {stats1.value.toLocaleString()}+
              </p>
              <p className="text-sm text-[var(--muted)] mt-1">사용 업체</p>
            </div>
            <div ref={stats2.ref}>
              <p className="text-3xl md:text-4xl font-bold text-[var(--green)]">
                {stats2.value.toLocaleString()}+
              </p>
              <p className="text-sm text-[var(--muted)] mt-1">견적 분석 건수</p>
            </div>
            <div ref={stats3.ref}>
              <p className="text-3xl md:text-4xl font-bold text-[var(--green)]">
                {stats3.value}%
              </p>
              <p className="text-sm text-[var(--muted)] mt-1">고객 만족도</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              하나의 플랫폼, 네 가지 핵심 기능
            </h2>
            <p className="text-[var(--muted)] mt-3 max-w-lg mx-auto">
              인테리어 업체 운영에 필요한 모든 도구를 하나로 통합했습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all hover:-translate-y-0.5"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: f.color + "15" }}
                >
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                  {f.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {f.highlights.map((h) => (
                    <span
                      key={h}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.04] text-[var(--muted)]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Estimate Coach Mini Demo ─── */}
      <section id="demo" className="py-20 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              견적코치 AI를 직접 체험해보세요
            </h2>
            <p className="text-[var(--muted)] mt-3">
              평수와 등급만 조절하면 AI가 12개 공종별 상세 견적을 즉시
              분석합니다.
            </p>
          </div>

          <EstimateCoachMiniDemo />
        </div>
      </section>

      {/* ─── Cost Comparison ─── */}
      <section id="pricing-compare" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              매달 이만큼 쓰고 계시진 않나요?
            </h2>
            <p className="text-[var(--muted)] mt-3">
              인테리어코치 Pro 하나면 전부 해결됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Current Cost */}
            <div className="space-y-3">
              {COST_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="text-sm font-medium text-[var(--red)]">
                    월 {fmtShort(item.cost)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/5">
                <span className="text-sm font-semibold">합계</span>
                <span className="text-xl font-bold text-[var(--red)]">
                  월 {fmtShort(totalCurrent)}
                </span>
              </div>
            </div>

            {/* Solution */}
            <div className="flex flex-col items-center">
              <div className="text-center p-8 rounded-2xl border-2 border-[var(--green)] bg-[var(--green)]/5 w-full">
                <p className="text-sm text-[var(--muted)] mb-1">
                  인테리어코치 Pro
                </p>
                <p className="text-4xl font-bold text-[var(--green)]">
                  월 {fmtShort(proPrice)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-2">
                  위 서비스 전부 + 현장관리 + 견적 AI + 고객관리
                </p>
              </div>

              <div className="mt-5 p-4 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/20 w-full text-center">
                <p className="text-sm text-[var(--muted)]">연간 절감액</p>
                <p className="text-3xl font-bold text-[var(--green)] mt-1">
                  {fmtShort(savings * 12)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  매달 {fmtShort(savings)}을 아끼면서 더 많은 기능을!
                </p>
              </div>

              <Link
                href="/pricing"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04] transition-colors"
              >
                전체 요금제 비교하기
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              3분이면 시작할 수 있습니다
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "회원가입",
                desc: "이메일 하나로 즉시 가입. 카드 등록 없이 무료 플랜을 바로 시작합니다.",
                icon: Users,
              },
              {
                step: "02",
                title: "첫 현장 등록",
                desc: "현장 이름과 주소만 입력하면 끝. 공정/일정/예산 관리가 자동 세팅됩니다.",
                icon: Building2,
              },
              {
                step: "03",
                title: "AI 코칭 시작",
                desc: "견적코치 AI가 비용 분석, 마케팅 자동화, 세무 상담을 즉시 지원합니다.",
                icon: Sparkles,
              },
            ].map((s) => (
              <div
                key={s.step}
                className="text-center p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]"
              >
                <div className="text-3xl font-bold text-[var(--green)]/30 mb-3">
                  {s.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--green)]/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon size={24} className="text-[var(--green)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 bg-gradient-to-b from-[var(--green)]/10 to-transparent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            인테리어 사업의 모든 업무,
            <br />
            지금 바로 하나로 관리하세요.
          </h2>
          <p className="text-[var(--muted)] mt-4 max-w-lg mx-auto">
            영구 무료 플랜으로 시작하세요. 카드 등록이 필요 없습니다.
            <br />
            Pro 플랜은 14일 무료 체험 후 결정하세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--green)] text-black font-semibold hover:opacity-90 transition-opacity text-base"
            >
              무료로 시작하기
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04] transition-colors"
            >
              요금제 비교하기
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border)] py-12 text-xs text-[var(--muted)]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="font-medium text-sm text-white/80">스몰테이블</p>
              <p>사업자등록번호: 511-27-58367</p>
              <p>대표자명: 배다솜</p>
            </div>
            <div className="space-y-1.5">
              <p>인천광역시 연수구 인천타워대로 301, A동 1301호</p>
              <p>유선번호: 0507-1315-3173</p>
            </div>
            <div className="space-y-1.5">
              <Link href="/pricing" className="hover:text-white transition-colors block">
                요금제
              </Link>
              <Link href="/auth/login" className="hover:text-white transition-colors block">
                로그인
              </Link>
              <Link href="/estimates/coach" className="hover:text-white transition-colors block">
                견적코치 AI
              </Link>
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
