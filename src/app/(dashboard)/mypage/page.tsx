"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Package,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Lock,
  Unlock,
  Zap,
  Shield,
  AlertTriangle,
  Loader2,
  BarChart3,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtShort } from "@/lib/utils";

// ─── 타입 ───

interface AnalysisResult {
  id: string;
  createdAt: string;
  area: number;
  grade: string;
  buildingType: string | null;
  profitRate: number | null;
  overheadRate: number | null;
  vatEnabled: boolean | null;
  resultData: Record<string, unknown> | null;
  creditUsed: boolean;
}

interface Credit {
  total: number;
  used: number;
  remaining: number;
}

const GRADE_LABELS: Record<string, string> = {
  basic: "베이직",
  economy: "이코노미",
  standard: "스탠다드",
  comfort: "컴포트",
  premium: "프리미엄",
  highend: "하이엔드",
  luxury: "럭셔리",
  ultralux: "울트라럭스",
};

const BUILDING_LABELS: Record<string, string> = {
  apt: "아파트",
  villa: "빌라",
  officetel: "오피스텔",
  house: "주택",
  store: "상가",
};

// ─── 마이페이지 ───

export default function MyPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [credit, setCredit] = useState<Credit>({ total: 0, used: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [creditData, analysesData] = await Promise.all([
        fetch("/api/credits").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/credits/analyses").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (creditData) setCredit(creditData);
      if (Array.isArray(analysesData)) setAnalyses(analysesData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 분석권으로 프로분석 잠금해제
  const handleUnlockPro = async (analysis: AnalysisResult) => {
    if (unlocking) return;
    setUnlocking(analysis.id);
    setUnlockError(null);

    try {
      const res = await fetch("/api/credits/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: analysis.area,
          grade: analysis.grade,
          buildingType: analysis.buildingType || "apt",
          profitRate: analysis.profitRate ?? 20,
          overheadRate: analysis.overheadRate ?? 6,
          vatEnabled: analysis.vatEnabled ?? false,
          resultData: analysis.resultData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCredit((prev) => ({
          ...prev,
          used: prev.used + 1,
          remaining: data.remainingCredits,
        }));
        // 데이터 새로고침
        await fetchData();
        setExpandedId(analysis.id);
      } else {
        const err = await res.json();
        setUnlockError(err.error || "분석권 사용에 실패했습니다.");
      }
    } catch {
      setUnlockError("네트워크 오류가 발생했습니다.");
    }
    setUnlocking(null);
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const fmtAmount = (n: number) => {
    if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
    return Math.round(n / 10000).toLocaleString() + "만원";
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 분석 내역</h1>
          <p className="text-xs text-[var(--muted)] mt-1">분석 이력 및 분석권 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">보유 분석권</span>
          <span className="px-3 py-1.5 rounded-full bg-[var(--green)]/10 text-[var(--green)] font-bold text-sm">
            {credit.remaining}회
          </span>
          <Link
            href="/pricing"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            구매
          </Link>
        </div>
      </div>

      {/* 분석권 현황 */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--green)]/5 to-[var(--green)]/[0.02] border border-[var(--green)]/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-[var(--green)]" />
              <span className="text-sm font-medium">보유 분석권</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">{credit.remaining}</span>
              <span className="text-sm text-[var(--muted)]">/ {credit.total}건 남음</span>
            </div>
          </div>
          <Link
            href="/estimates/coach"
            className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
          >
            새 분석하기
          </Link>
        </div>
        {credit.total > 0 && (
          <div className="mt-3 h-2 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--green)]"
              style={{ width: `${(credit.remaining / credit.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* 프로분석 잠금해제 안내 */}
      {credit.remaining > 0 && analyses.length === 0 && !loading && (
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <Lock size={18} className="text-amber-500" />
            <h2 className="text-sm font-medium">프로 분석 리포트</h2>
          </div>
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none space-y-3 opacity-60">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--muted)]">과다 청구 위험 공종</p>
                  <p className="text-lg font-bold mt-1">목공사, 타일공사</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--muted)]">절감 가능 금액</p>
                  <p className="text-lg font-bold mt-1 text-[var(--green)]">-850만원</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--muted)]">견적 신뢰도</p>
                  <p className="text-lg font-bold mt-1">78점</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[var(--green)]/10 flex items-center justify-center mx-auto mb-3">
                <Zap size={24} className="text-[var(--green)]" />
              </div>
              <p className="text-sm font-medium mb-1">견적코치에서 시뮬레이션 후 프로분석을 시작하세요</p>
              <p className="text-xs text-[var(--muted)] mb-3">분석권 1회로 상세 분석 리포트를 받을 수 있습니다</p>
              <Link
                href="/estimates/coach"
                className="px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
              >
                견적 시뮬레이션 시작
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {unlockError && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-400">{unlockError}</p>
        </div>
      )}

      {/* 분석 이력 */}
      <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[var(--green)]" />
          분석 이력 ({analyses.length}건)
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles size={32} className="mx-auto mb-3 text-[var(--muted)]/30" />
            <p className="text-sm text-[var(--muted)]">아직 분석 이력이 없습니다</p>
            <p className="text-xs text-[var(--muted)]/60 mt-1">
              견적코치에서 프로분석 버튼을 눌러 분석권 1회로 분석을 저장하세요
            </p>
            <Link
              href="/estimates/coach"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
            >
              첫 분석 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => {
              const rd = a.resultData as Record<string, unknown> | null;
              const grandTotal = Number(rd?.grandTotal) || 0;
              const directTotal = Number(rd?.directTotal) || 0;
              const breakdownArr = (rd?.breakdown as Array<Record<string, unknown>>) || [];
              const isExpanded = expandedId === a.id;
              const dur = rd?.duration as { min: number; max: number } | undefined;

              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-[var(--border)] overflow-hidden"
                >
                  {/* 분석 요약 행 */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[var(--muted)]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {a.area}평 · {GRADE_LABELS[a.grade] || a.grade} · {BUILDING_LABELS[a.buildingType || "apt"] || a.buildingType}
                        </p>
                        <span className="text-[10px] font-medium text-[var(--green)]">분석 완료</span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        {fmtDate(a.createdAt)} · {breakdownArr.length}공종 · {fmtAmount(grandTotal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {grandTotal > 0 && (
                        <span className="text-sm font-bold">{fmtShort(grandTotal)}</span>
                      )}
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-[var(--muted)]" />
                      ) : (
                        <ChevronRight size={16} className="text-[var(--muted)]" />
                      )}
                    </div>
                  </button>

                  {/* 프로 분석 잠금해제 버튼 — 접힌 상태에서도 표시 */}
                  {!isExpanded && (
                    <div className="px-4 pb-3 border-t border-[var(--border)]">
                      {credit.remaining > 0 ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUnlockPro(a); }}
                          disabled={unlocking === a.id}
                          className="mt-3 w-full py-3 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {unlocking === a.id ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              분석 중...
                            </>
                          ) : (
                            <>
                              <Unlock size={16} />
                              분석권 1회 사용하여 프로 분석 보기
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href="/pricing"
                          className="mt-3 w-full py-3 rounded-xl bg-[var(--green)] text-black font-medium text-sm flex items-center justify-center gap-2"
                        >
                          분석권 구매하기
                        </Link>
                      )}
                    </div>
                  )}

                  {/* 확장된 프로분석 상세 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-[var(--border)]">
                      {/* 분석 요약 카드 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--muted)] mb-1">총 견적가</p>
                          <p className="text-lg font-bold">{fmtShort(grandTotal)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--muted)] mb-1">직접공사비</p>
                          <p className="text-lg font-bold">{fmtShort(directTotal)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--muted)] mb-1">평당 단가</p>
                          <p className="text-lg font-bold">
                            {a.area > 0 ? fmtShort(Math.round(grandTotal / a.area)) : "-"}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--muted)] mb-1">예상 공기</p>
                          <p className="text-lg font-bold">
                            {dur ? `${dur.min}~${dur.max}일` : "-"}
                          </p>
                        </div>
                      </div>

                      {/* 공종별 비용 */}
                      {breakdownArr.length > 0 && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)]">
                          <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                            <BarChart3 size={14} className="text-[var(--green)]" />
                            공종별 비용 분석
                          </h3>
                          <div className="space-y-2">
                            {breakdownArr
                              .sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0))
                              .slice(0, 7)
                              .map((cat, i) => {
                                const catTotal = Number(cat.total) || 0;
                                const pct = directTotal > 0 ? (catTotal / directTotal) * 100 : 0;
                                return (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs w-16 shrink-0 truncate">{String(cat.name)}</span>
                                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-[var(--green)]"
                                        style={{ width: `${Math.min(100, pct * 3)}%`, opacity: 0.7 }}
                                      />
                                    </div>
                                    <span className="text-xs tabular-nums w-14 text-right">{fmtShort(catTotal)}</span>
                                    <span className="text-[10px] text-[var(--muted)] w-10 text-right">{pct.toFixed(1)}%</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* 프로분석 블러 미리보기 — 분석권 1회 잠금해제 */}
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)] relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield size={14} className="text-[var(--green)]" />
                          <h3 className="text-xs font-medium">프로 분석 리포트</h3>
                        </div>

                        {/* 블러 처리된 미리보기 */}
                        <div className="relative">
                          <div className="blur-sm pointer-events-none select-none space-y-3 opacity-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border)]">
                                <p className="text-[10px] text-[var(--muted)]">과다 청구 위험 공종</p>
                                <p className="text-sm font-bold mt-1">목공사, 타일공사</p>
                              </div>
                              <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border)]">
                                <p className="text-[10px] text-[var(--muted)]">절감 가능 금액</p>
                                <p className="text-sm font-bold mt-1 text-[var(--green)]">~{fmtAmount(Math.round(directTotal * 0.12))} 절감</p>
                              </div>
                              <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border)]">
                                <p className="text-[10px] text-[var(--muted)]">견적 신뢰도</p>
                                <p className="text-sm font-bold mt-1">78점</p>
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border)]">
                              <p className="text-[10px] text-[var(--muted)] mb-1">AI 분석 코멘트</p>
                              <p className="text-xs leading-relaxed">현재 견적의 비용 비중이 시장 평균 대비 일부 높은 항목이 발견되었습니다...</p>
                            </div>
                          </div>

                          {/* 잠금해제 오버레이 */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 flex items-center justify-center mx-auto mb-3">
                                <Zap size={20} className="text-[var(--green)]" />
                              </div>
                              <p className="text-sm font-medium mb-1">프로 분석으로 견적을 검증하세요</p>
                              <p className="text-xs text-[var(--muted)] mb-4 max-w-xs">
                                과다 청구 항목, 절감 포인트, 견적 신뢰도를 AI가 분석합니다
                              </p>

                              {credit.remaining > 0 ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUnlockPro(a); }}
                                  disabled={unlocking === a.id}
                                  className="px-5 py-3 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
                                >
                                  {unlocking === a.id ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin" />
                                      분석 중...
                                    </>
                                  ) : (
                                    <>
                                      <Unlock size={16} />
                                      분석권 1회 사용하여 프로 분석 보기
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-red-400">분석권이 부족합니다</p>
                                  <Link
                                    href="/pricing"
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
                                  >
                                    분석권 구매하기
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 절감 가능 금액 미리보기 */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
                        <TrendingDown size={16} className="text-[var(--green)] shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-[var(--green)]">
                            ~{fmtAmount(Math.round(directTotal * 0.12))} 절감 가능
                          </p>
                          <p className="text-[10px] text-[var(--muted)]">
                            공종별 절감 방법은 프로 분석에서 확인
                          </p>
                        </div>
                        <Lock size={14} className="text-[var(--muted)] shrink-0 ml-auto" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
