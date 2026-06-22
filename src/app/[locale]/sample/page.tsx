"use client";

import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Sparkles,
  TrendingDown,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  CATS,
  GRADES,
  calcCatTotal,
} from "@/lib/estimate-engine";
import { fmtShort, cn } from "@/lib/utils";

// ─── 32평 아파트 스탠다드 등급 샘플 데이터 ───
const SAMPLE_AREA = 32;
const SAMPLE_GRADE = "standard";

function BlurredText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("select-none blur-[6px] pointer-events-none", className)}>
      {children}
    </span>
  );
}

export default function SamplePage() {
  const selectedGrade = GRADES.find((g) => g.key === SAMPLE_GRADE) || GRADES[2];

  const breakdown = CATS.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    essential: cat.essential,
    total: calcCatTotal(cat, SAMPLE_AREA, SAMPLE_GRADE),
  }));

  const directTotal = breakdown.reduce((s, c) => s + c.total, 0);
  const topCats = [...breakdown].sort((a, b) => b.total - a.total).slice(0, 5);
  const maxCatTotal = topCats[0]?.total || 1;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <span className="text-black font-bold text-sm">IC</span>
            </div>
            <span className="font-bold text-lg">견적코치</span>
          </Link>
          <Link
            href="/auth/login"
            className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-semibold"
          >
            내 견적 분석하기
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-xs text-[var(--green)]">
            <Sparkles size={14} />
            실제 분석 샘플
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            서울 송파구 · 32평 아파트
          </h1>
          <p className="text-[var(--muted)]">
            {selectedGrade.label} 등급 · 전체 리모델링 견적 분석 결과
          </p>
        </div>

        {/* 면책 배너 */}
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
          <span className="text-amber-500 shrink-0 mt-0.5 text-sm">⚠️</span>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            본 분석은 참고용이며, 실제 시공 가격은 현장 조건에 따라 달라질 수 있습니다.
            견적코치는 가격을 보증하지 않으며, 본 분석을 근거로 한 의사결정에 대해 책임지지 않습니다.
          </p>
        </div>

        {/* ─── 공종별 분석 요약 (블러 처리) ─── */}
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--green)]" />
            공종별 비용 분석 (TOP 5)
          </h2>
          <div className="space-y-3">
            {topCats.map((cat, i) => {
              const pct = (cat.total / maxCatTotal) * 100;
              const sharePct = directTotal > 0 ? ((cat.total / directTotal) * 100).toFixed(1) : "0";
              const isBlurred = i >= 2;
              return (
                <div key={cat.id} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: cat.color + "20", color: cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-sm">{cat.name}</span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {isBlurred ? <BlurredText>{sharePct}%</BlurredText> : `${sharePct}%`}
                      </span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {isBlurred ? <BlurredText>{fmtShort(cat.total)}</BlurredText> : fmtShort(cat.total)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", isBlurred && "blur-[4px]")}
                      style={{ width: `${pct}%`, backgroundColor: cat.color, opacity: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 절감 포인트 미리보기 (블러) ─── */}
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-[var(--green)]" />
            절감 포인트 발견
          </h2>

          <div className="space-y-3">
            {/* 보이는 항목 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
              <CheckCircle2 size={16} className="text-[var(--green)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">타일공사 자재 등급 조정</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  현관·발코니는 스탠다드 유지, 욕실만 업그레이드 시
                </p>
                <p className="text-xs font-medium text-[var(--green)] mt-1">
                  예상 절감: 약 80~150만원
                </p>
              </div>
            </div>

            {/* 블러 항목들 */}
            <div className="relative">
              <div className="blur-[6px] pointer-events-none select-none space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">목공사 과다 견적 의심</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      기공 인건비가 시세 대비 높음 — 재협상 권장
                    </p>
                    <p className="text-xs font-medium text-amber-500 mt-1">예상 절감: 약 200~350만원</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
                  <CheckCircle2 size={16} className="text-[var(--green)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">도배·마루 묶음 계약 가능</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">동시 시공 시 할인 가능</p>
                    <p className="text-xs font-medium text-[var(--green)] mt-1">예상 절감: 약 50~100만원</p>
                  </div>
                </div>
              </div>

              {/* 잠금 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] shadow-lg">
                  <Lock size={24} className="text-[var(--muted)]" />
                  <p className="text-sm font-medium">전체 분석 결과는 결제 후 확인</p>
                  <p className="text-[10px] text-[var(--muted)]">절감 포인트 3건 더 발견됨</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 총 절감 가능 금액 ─── */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--green)]/10 to-[var(--green)]/[0.02] border border-[var(--green)]/20 text-center">
          <p className="text-sm text-[var(--muted)] mb-2">이 견적에서 발견된 예상 절감 가능 금액</p>
          <p className="text-4xl font-bold text-[var(--green)]">
            약 <BlurredText className="text-[var(--green)]">320만~580만</BlurredText>원
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            전체 분석 보고서에서 공종별 상세 절감 방법을 확인하세요
          </p>
        </div>

        {/* ─── CTA ─── */}
        <div className="text-center space-y-4 py-6">
          <h2 className="text-xl font-bold">내 견적서도 분석해보세요</h2>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
            견적서 사진만 찍어 올리면, AI가 공종별 과다/과소 항목을 분석하고
            절감 포인트를 알려드립니다.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--green)] text-black font-semibold hover:opacity-90 transition-opacity"
          >
            내 견적 분석하기
            <ArrowRight size={18} />
          </Link>
          <p className="text-[10px] text-[var(--muted)]">
            1건 39,900원 · 분석 완료 후 24시간 이내 전액 환불 가능
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 text-xs text-[var(--muted)]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-2">
          <p>
            본 분석은 참고용이며, 실제 시공 가격은 현장 조건에 따라 달라질 수 있습니다.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/refund-policy" className="hover:text-[var(--foreground)] transition-colors">환불 정책</Link>
            <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">이용약관</Link>
          </div>
          <p>&copy; 2026 스몰테이블. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
