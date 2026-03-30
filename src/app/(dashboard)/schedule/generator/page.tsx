"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { ArrowLeft, ChevronDown, Sparkles, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  TRADES, DEP_WARNINGS, SIZES, SEASONS, TRADE_GROUPS,
  PHASE_LABELS, PHASE_COLORS,
  getSeason, buildSchedule, formatCost, riskColor,
  type SizeOption, type ScheduleResult, type ScheduledTrade,
} from "@/lib/schedule-engine";

// ─── Tabs ───

const TABS = [
  { id: "schedule", label: "공정표", icon: "📋" },
  { id: "budget", label: "비용분석", icon: "💰" },
  { id: "procurement", label: "발주·준비", icon: "📦" },
  { id: "quality", label: "품질체크", icon: "✅" },
  { id: "package", label: "패키지", icon: "🎯" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── BlurLock ───

function BlurLock({ children, label = "스탠다드 패키지부터 이용 가능", onUnlock }: { children: React.ReactNode; label?: string; onUnlock: () => void }) {
  return (
    <div className="relative">
      <div className="blur-[6px] pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[var(--card)]/60 backdrop-blur-sm">
        <Lock size={24} className="text-[var(--muted)] mb-2" />
        <div className="text-sm font-bold text-[var(--foreground)] mb-1">{label}</div>
        <div className="text-[11px] text-[var(--muted)] mb-3 text-center px-5">
          상세 비용 분석, 절약 팁, 발주 일정,<br />품질 체크포인트를 확인하세요
        </div>
        <button onClick={onUnlock} className="px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity">
          스탠다드 패키지 보기 →
        </button>
      </div>
    </div>
  );
}

// ─── Main ───

export default function ScheduleGeneratorPage() {
  const [step, setStep] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>("schedule");
  const [expandPhase, setExpandPhase] = useState<number | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [season] = useState(getSeason());
  const [showModal, setShowModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sizeObj = SIZES.find(s => s.id === size) ?? null;

  const go = (s: number) => {
    setStep(s);
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const toggle = useCallback((id: string) => setSelected(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id])), []);
  const selectAll = () => setSelected(TRADES.map(t => t.id));

  const warnings = useMemo(() => DEP_WARNINGS.filter(w => selected.includes(w.if) && !selected.includes(w.needs)), [selected]);
  const criticalWarnings = useMemo(() => warnings.filter(w => w.severity === "critical"), [warnings]);
  const suggestions = useMemo(() => {
    const m = new Set<string>();
    warnings.forEach(w => m.add(w.needs));
    return [...m].map(id => TRADES.find(t => t.id === id)).filter(Boolean);
  }, [warnings]);

  const tryGenerate = () => {
    if (criticalWarnings.length > 0) { setShowModal(true); return; }
    doGenerate();
  };

  const doGenerate = () => {
    if (!sizeObj) return;
    setShowModal(false);
    setLoading(true);
    setTimeout(() => {
      setResult(buildSchedule(selected, sizeObj, season));
      setStep(3);
      setTab("schedule");
      setLoading(false);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }, 1800);
  };

  const grouped = useMemo(() => {
    if (!result) return {};
    const g: Record<number, { phase: number; items: ScheduledTrade[] }> = {};
    result.scheduled.forEach(t => {
      if (!g[t.phase]) g[t.phase] = { phase: t.phase, items: [] };
      g[t.phase].items.push(t);
    });
    return g;
  }, [result]);

  const maxDay = result?.totalDays || 1;
  const budgetNum = parseInt(budget.replace(/,/g, "")) || 0;
  const budgetFit = budgetNum > 0 && result
    ? budgetNum < result.totalCostLow * 0.1 ? "invalid"
      : budgetNum >= result.totalCostLow ? (budgetNum >= result.totalCostHigh ? "ok" : "tight") : "over"
    : null;

  const resetAll = () => {
    setStep(0); setResult(null); setSelected([]); setSize(null);
    setSelectedPkg(null); setExpandPhase(null); setBudget("");
    setTab("schedule"); setUnlocked(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={24} className="text-[var(--green)]" />
          <div>
            <h1 className="text-xl font-bold">AI 공정매니저</h1>
            <p className="text-xs text-[var(--muted)]">평수·공종 선택만으로 맞춤 공정표 생성</p>
          </div>
        </div>
        <Link
          href="/schedule"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={14} />
          일정 관리
        </Link>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              step > i ? "w-5 bg-[var(--green)]" : step === i ? "w-6 bg-[var(--green)]/60" : "w-4 bg-[var(--border)]"
            )}
          />
        ))}
      </div>

      {/* Dependency Warning Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-5" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-[400px] w-full animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-3">
              <AlertTriangle size={32} className="mx-auto text-[var(--red)] mb-2" />
              <p className="text-base font-extrabold">필수 공종이 빠져있어요</p>
            </div>
            <div className="space-y-1.5 mb-4">
              {criticalWarnings.map((w, i) => (
                <div key={i} className="text-xs text-red-300 p-2.5 bg-red-500/[0.08] rounded-lg border-l-[3px] border-red-500">
                  <span className="font-bold">{TRADES.find(t => t.id === w.needs)?.icon} {TRADES.find(t => t.id === w.needs)?.name}</span> — {w.msg}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const ids = criticalWarnings.map(w => w.needs);
                  setSelected(p => [...new Set([...p, ...ids])]);
                  setShowModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity"
              >
                필수 공종 추가 후 생성
              </button>
              <button
                onClick={doGenerate}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-300 text-sm font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                그대로 생성
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={ref}>
        {/* STEP 0: 평수 선택 */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold">평수를 선택하세요</h2>
              <p className="text-xs text-[var(--muted)]">공사 기간·비용·자재량이 모두 달라집니다</p>
            </div>
            <div className="space-y-1.5 mb-5">
              {SIZES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all",
                    size === s.id
                      ? "border-[var(--green)] bg-[var(--green)]/[0.08] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--green)]/30"
                  )}
                >
                  <span className="text-sm font-bold">{s.label}</span>
                  <span className="text-xs text-[var(--muted)]">약 {s.pyung}평</span>
                </button>
              ))}
            </div>
            <button
              disabled={!size}
              onClick={() => go(1)}
              className="w-full py-3.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음 →
            </button>
          </div>
        )}

        {/* STEP 1: 공종 선택 */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-extrabold">공종을 선택하세요</h2>
              <button onClick={selectAll} className="text-[11px] text-[var(--green)] font-bold px-2.5 py-1 rounded-lg bg-[var(--green)]/10 hover:bg-[var(--green)]/20 transition-colors">
                전체선택
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-4">{selected.length}개 선택됨</p>

            {TRADE_GROUPS.map(g => {
              const gt = TRADES.filter(t => t.group === g);
              return (
                <div key={g} className="mb-3">
                  <p className="text-[10px] font-bold text-[var(--muted)] mb-1.5 tracking-wider uppercase">{g}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gt.map(t => {
                      const isCritMissing = criticalWarnings.some(w => w.needs === t.id) && !selected.includes(t.id);
                      const isMissing = suggestions.some(s => s?.id === t.id) && !selected.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggle(t.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                            selected.includes(t.id)
                              ? "border-[var(--green)] bg-[var(--green)]/10 text-[var(--green)]"
                              : isCritMissing
                                ? "border-red-500 bg-red-500/[0.08] text-red-300 animate-pulse"
                                : isMissing
                                  ? "border-yellow-500 bg-yellow-500/[0.06] text-yellow-300"
                                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--green)]/30"
                          )}
                        >
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                          {isCritMissing && <span className="text-red-500 font-extrabold text-[10px]">!</span>}
                          {isMissing && !isCritMissing && <span className="text-yellow-500 text-[10px]">!</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className={cn(
                "rounded-xl p-3 mb-3 border",
                criticalWarnings.length ? "bg-red-500/[0.04] border-red-500/15" : "bg-yellow-500/[0.04] border-yellow-500/15"
              )}>
                <p className={cn("text-[11px] font-bold mb-1.5", criticalWarnings.length ? "text-red-500" : "text-yellow-500")}>
                  {criticalWarnings.length ? `필수 공종 ${criticalWarnings.length}개 누락` : `권장 공종 ${warnings.length}개 누락`}
                </p>
                {warnings.slice(0, 4).map((w, i) => (
                  <div key={i} className={cn("text-[11px] text-[var(--muted)] mb-0.5 pl-2.5 border-l-2", w.severity === "critical" ? "border-red-500/40" : "border-yellow-500/30")}>
                    <span className={cn("font-bold", w.severity === "critical" ? "text-red-300" : "text-yellow-300")}>{TRADES.find(t => t.id === w.needs)?.name}</span> — {w.msg}
                  </div>
                ))}
                <button
                  onClick={() => { const ids = suggestions.map(s => s!.id); setSelected(p => [...new Set([...p, ...ids])]); }}
                  className="mt-2 text-[11px] text-[var(--green)] font-bold"
                >
                  → 누락 공종 {suggestions.length}개 한번에 추가
                </button>
              </div>
            )}

            {selected.length > 0 && warnings.length === 0 && (
              <div className="rounded-xl p-2.5 mb-3 bg-emerald-500/[0.04] border border-emerald-500/12">
                <p className="text-[11px] font-bold text-emerald-500">✅ {selected.length}개 공종 — 의존성 문제 없음</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">{selected.map(id => TRADES.find(t => t.id === id)?.name).join(" → ")}</p>
              </div>
            )}

            <div className="flex gap-1.5">
              <button onClick={() => go(0)} className="px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] text-sm font-bold hover:bg-[var(--border)] transition-colors">
                ←
              </button>
              <button
                disabled={!selected.length}
                onClick={() => go(2)}
                className="flex-1 py-3 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 예산 */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold">예산 입력</h2>
              <p className="text-xs text-[var(--muted)]">입력하면 공종별 예산 배분과 절약 포인트를 분석합니다</p>
            </div>
            <div className="relative mb-4">
              <input
                value={budget}
                onChange={e => setBudget(e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
                placeholder="예: 30,000,000"
                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-base font-bold placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">원</span>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 mb-4">
              <p className="text-[10px] font-bold text-[var(--muted)] mb-2">입력 요약</p>
              {[
                ["평수", sizeObj?.label ?? "-"],
                ["공종", `${selected.length}개`],
                ["시즌", SEASONS[season].label],
                ["예산", budget ? budget + "원" : "미입력"],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between py-1 border-b border-white/[0.03] last:border-0">
                  <span className="text-[11px] text-[var(--muted)]">{k}</span>
                  <span className="text-[11px] font-bold text-[var(--foreground)]">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              <button onClick={() => go(1)} className="px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] text-sm font-bold hover:bg-[var(--border)] transition-colors">
                ←
              </button>
              <button
                disabled={loading}
                onClick={tryGenerate}
                className="flex-1 py-3 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    AI 분석 중...
                  </span>
                ) : (
                  "공정표 생성"
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 3 && result && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Summary */}
            <div className="text-center mb-5">
              <p className="text-[10px] font-bold text-[var(--green)] tracking-widest mb-1.5">AI 공정 분석 완료</p>
              <p className="text-4xl font-black">{result.totalDays}<span className="text-sm font-normal text-[var(--muted)]">일</span></p>
              <p className="text-xs text-[var(--muted)] mt-1">{sizeObj?.label} · {selected.length}개 공종 · {SEASONS[season].label}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
                <p className="text-[9px] text-[var(--muted)] font-semibold">예상 비용 범위</p>
                <p className="text-base font-extrabold text-yellow-400 mt-0.5">{formatCost(result.totalCostLow)}<span className="text-[10px] text-[var(--muted)]"> ~ </span>{formatCost(result.totalCostHigh)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
                <p className="text-[9px] text-[var(--muted)] font-semibold">리스크 · 품질체크</p>
                <div className="mt-0.5">
                  <span className="text-base font-extrabold" style={{ color: result.risk > 50 ? "#EF4444" : result.risk > 25 ? "#F59E0B" : "#10B981" }}>{result.risk}점</span>
                  <span className="text-[11px] text-[var(--muted)] ml-1.5">{result.totalChecks}개 항목</span>
                </div>
              </div>
            </div>

            {/* Budget fit */}
            {budgetFit && budgetFit !== "invalid" && (
              <div className={cn(
                "rounded-xl p-2.5 mb-4 border",
                budgetFit === "ok" ? "bg-emerald-500/[0.04] border-emerald-500/15" :
                  budgetFit === "tight" ? "bg-yellow-500/[0.04] border-yellow-500/15" :
                    "bg-red-500/[0.04] border-red-500/15"
              )}>
                <span className={cn("text-xs font-bold", budgetFit === "ok" ? "text-emerald-500" : budgetFit === "tight" ? "text-yellow-500" : "text-red-500")}>
                  {budgetFit === "ok" ? "✅ 예산 여유" : budgetFit === "tight" ? "⚠️ 빠듯" : "🚨 예산 초과"}
                </span>
                <span className="text-[11px] text-[var(--muted)] ml-2">{budget}원 vs {formatCost(result.totalCostLow)}~{formatCost(result.totalCostHigh)}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="grid grid-cols-5 mb-4 border-b border-white/[0.06]">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "py-2 text-center text-[10px] font-semibold border-b-2 transition-all",
                    tab === t.id ? "text-[var(--green)] border-[var(--green)]" : "text-[var(--muted)] border-transparent hover:text-[var(--foreground)]"
                  )}
                >
                  {t.icon}<br />{t.label}
                  {!unlocked && t.id !== "schedule" && t.id !== "package" && <span className="text-[7px] ml-0.5">🔒</span>}
                </button>
              ))}
            </div>

            {/* TAB: 공정표 */}
            {tab === "schedule" && (
              <div className="space-y-3">
                {/* Gantt chart */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 overflow-x-auto">
                  {Object.values(grouped).map(({ phase, items }) => (
                    <div key={phase} className="mb-2.5 last:mb-0">
                      <p className="text-[9px] font-extrabold mb-1" style={{ color: PHASE_COLORS[phase] }}>{phase}단계: {PHASE_LABELS[phase]}</p>
                      {items.map((item, idx) => {
                        const l = ((item.startDay - 1) / maxDay) * 100;
                        const w = Math.max((item.days / maxDay) * 100, 4);
                        return (
                          <div key={item.id} className="flex items-center mb-0.5 h-6">
                            <div className="w-20 shrink-0 text-[10px] font-semibold text-[var(--muted)] flex items-center gap-1 truncate">
                              <span className="text-xs">{item.icon}</span>
                              <span className="truncate">{item.name}</span>
                            </div>
                            <div className="flex-1 relative h-full">
                              <div
                                className="absolute h-[18px] top-[3px] rounded flex items-center justify-center text-[8px] font-bold text-white transition-all"
                                style={{
                                  left: `${l}%`,
                                  width: `${w}%`,
                                  background: `linear-gradient(90deg, ${PHASE_COLORS[phase]}BB, ${PHASE_COLORS[phase]}55)`,
                                  animationDelay: `${idx * 0.06}s`,
                                }}
                              >
                                {item.days >= 2 ? `${item.days}일` : ""}
                              </div>
                            </div>
                            <div className="w-14 shrink-0 text-[9px] text-[var(--muted)] text-right">D{item.startDay}-D{item.endDay}</div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Phase accordions */}
                {Object.values(grouped).map(({ phase, items }) => (
                  <div key={phase} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <button
                      onClick={() => setExpandPhase(expandPhase === phase ? null : phase)}
                      className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: PHASE_COLORS[phase] }} />
                        <span className="text-xs font-bold">{phase}단계: {PHASE_LABELS[phase]}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--green)]/[0.08] text-[var(--green)]">{items.length}공종</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-yellow-400">{formatCost(items.reduce((s, i) => s + i.costLow, 0))}~{formatCost(items.reduce((s, i) => s + i.costHigh, 0))}</span>
                        <ChevronDown size={14} className={cn("text-[var(--muted)] transition-transform", expandPhase === phase && "rotate-180")} />
                      </div>
                    </button>
                    {expandPhase === phase && (
                      <div className="px-3.5 pb-3">
                        {items.map(item => (
                          <div key={item.id} className="py-2 border-t border-white/[0.03]">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{item.icon}</span>
                                <span className="text-xs font-bold">{item.name}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--green)]/[0.08] text-[var(--green)]">D{item.startDay}~D{item.endDay}</span>
                                {item.isParallel && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/[0.08] text-purple-400">∥병렬</span>}
                              </div>
                              <span className="text-[11px] font-bold text-[var(--muted)] whitespace-nowrap">{formatCost(item.costLow)}~{formatCost(item.costHigh)}</span>
                            </div>
                            <p className="text-[10px] text-[var(--muted)]">{item.desc}</p>
                            {item.notes && <p className="text-[10px] text-yellow-500 mt-0.5">⚠ {item.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Total */}
                <div className="rounded-xl border border-[var(--green)]/20 bg-[var(--green)]/[0.04] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold">합계</span>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-yellow-400">{formatCost(result.totalCostLow)} ~ {formatCost(result.totalCostHigh)}</p>
                      <p className="text-[10px] text-[var(--muted)]">{result.totalDays}일 · {result.scheduled.length}공종</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: 비용분석 */}
            {tab === "budget" && (
              <div>
                {unlocked ? (
                  <>
                    <p className="text-sm font-extrabold mb-2.5">공종별 비용 비중</p>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 mb-4">
                      {[...result.scheduled].sort((a, b) => b.costPct - a.costPct).map(item => (
                        <div key={item.id} className="mb-2 last:mb-0">
                          <div className="flex justify-between mb-0.5">
                            <div className="flex items-center gap-1"><span className="text-xs">{item.icon}</span><span className="text-[11px] font-semibold">{item.name}</span></div>
                            <div className="flex items-center gap-1.5"><span className="text-[10px] text-[var(--muted)]">{(item.costPct * 100).toFixed(1)}%</span><span className="text-[11px] font-bold text-yellow-400">{formatCost(item.costLow)}~{formatCost(item.costHigh)}</span></div>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${item.costPct * 100}%`, background: `${PHASE_COLORS[item.phase]}88` }} /></div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-extrabold text-emerald-500 mb-2.5">💡 절약 포인트</p>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                      {result.scheduled.filter(t => t.savingTip).map(item => (
                        <div key={item.id} className="px-3.5 py-2.5 border-b border-white/[0.03] last:border-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{item.icon}</span>
                            <span className="text-xs font-bold">{item.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${riskColor(item.skipRisk)}15`, color: riskColor(item.skipRisk) }}>
                              {item.skipRisk === "critical" ? "절대 아끼지 마세요" : item.skipRisk === "high" ? "신중하게" : "절약 가능"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-6">{item.savingTip}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <BlurLock onUnlock={() => setTab("package")}>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 mb-4">
                      {[...result.scheduled].sort((a, b) => b.costPct - a.costPct).slice(0, 5).map(item => (
                        <div key={item.id} className="mb-2">
                          <div className="flex justify-between mb-0.5"><span className="text-[11px]">{item.icon} {item.name}</span><span className="text-[11px]">██만~██만</span></div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full"><div className="h-full bg-[var(--border)] rounded-full" style={{ width: `${item.costPct * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5">
                      <p className="text-sm font-extrabold mb-2.5">💡 절약 포인트</p>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="py-2.5 border-b border-white/[0.03]">
                          <div className="h-3 bg-[var(--border)] rounded w-[60%] mb-1" />
                          <div className="h-2.5 bg-[var(--border)] rounded w-[40%]" />
                        </div>
                      ))}
                    </div>
                  </BlurLock>
                )}
              </div>
            )}

            {/* TAB: 발주·준비 */}
            {tab === "procurement" && (
              <div>
                {unlocked ? (
                  <>
                    <p className="text-sm font-extrabold text-red-500 mb-2">🚨 공사 전 사전 준비</p>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-4">
                      {result.pre.map((p, i) => (
                        <div key={i} className="px-3.5 py-2.5 border-b border-white/[0.03] last:border-0 flex items-start gap-2.5">
                          <div className="min-w-[45px] text-center">
                            <p className={cn("text-[11px] font-extrabold", p.orderDay < 1 ? "text-red-500" : "text-yellow-500")}>D{p.orderDay}</p>
                            <p className="text-[8px] text-[var(--muted)]">까지</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                              <span className="text-[11px]">{p.icon}</span>
                              <span className={cn("text-[11px] font-bold", p.critical ? "text-red-300" : "")}>{p.type === "material" ? p.name : p.task}</span>
                              {p.critical && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/[0.12] text-red-300">필수</span>}
                            </div>
                            <p className="text-[10px] text-[var(--muted)]">{p.trade} · {p.type === "material" ? p.costRange : p.category} · {p.leadDays}일</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-extrabold text-blue-400 mb-2">📦 공사 중 발주</p>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                      {result.during.slice(0, 20).map((p, i) => (
                        <div key={i} className="px-3.5 py-2.5 border-b border-white/[0.03] last:border-0 flex items-start gap-2.5">
                          <div className="min-w-[45px] text-center">
                            <p className="text-[11px] font-extrabold text-blue-400">D{p.orderDay}</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                              <span className="text-[11px]">{p.icon}</span>
                              <span className="text-[11px] font-bold">{p.type === "material" ? p.name : p.task}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/[0.08] text-blue-400">D{p.dueByDay}</span>
                            </div>
                            <p className="text-[10px] text-[var(--muted)]">{p.trade} · {p.type === "material" ? p.costRange : p.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <BlurLock label="발주 타이밍 · 자재 리스트" onUnlock={() => setTab("package")}>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="px-3.5 py-2.5 border-b border-white/[0.03] flex gap-2.5">
                          <div className="w-[45px] h-[30px] bg-[var(--border)] rounded" />
                          <div className="flex-1"><div className="h-3 bg-[var(--border)] rounded mb-1" style={{ width: `${80 - i * 8}%` }} /><div className="h-2.5 bg-[var(--border)] rounded" style={{ width: `${50 - i * 5}%` }} /></div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="px-3.5 py-2.5 border-b border-white/[0.03] flex gap-2.5">
                          <div className="w-[45px] h-[30px] bg-[var(--border)] rounded" />
                          <div className="flex-1"><div className="h-3 bg-[var(--border)] rounded" style={{ width: `${70 - i * 10}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </BlurLock>
                )}
              </div>
            )}

            {/* TAB: 품질체크 */}
            {tab === "quality" && (
              <div>
                {unlocked ? (
                  <>
                    <p className="text-sm font-extrabold mb-1">공종별 품질 체크포인트</p>
                    <p className="text-[11px] text-[var(--muted)] mb-3">총 {result.totalChecks}개 — 각 공종 완료 시 반드시 확인</p>
                    {result.scheduled.filter(t => (t.qualityCheck || []).length > 0).map(item => (
                      <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{item.icon}</span>
                            <span className="text-sm font-bold">{item.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${riskColor(item.skipRisk)}15`, color: riskColor(item.skipRisk) }}>
                              {item.skipRisk === "critical" ? "필수" : item.skipRisk === "high" ? "중요" : "권장"}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--muted)]">D{item.endDay}</span>
                        </div>
                        {item.qualityCheck.map((c, ci) => (
                          <div key={ci} className="flex items-center gap-2 py-1 border-b border-white/[0.03] last:border-0">
                            <div className="w-[18px] h-[18px] rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                              <span className="text-[8px] text-[var(--muted)]">☐</span>
                            </div>
                            <span className="text-[11px] text-[var(--muted)]">{c}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                ) : (
                  <BlurLock label="품질 체크포인트 · 하자 방지" onUnlock={() => setTab("package")}>
                    <p className="text-sm font-extrabold mb-3">공종별 품질 체크포인트</p>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 mb-2">
                        <div className="h-4 bg-[var(--border)] rounded w-[60%] mb-2.5" />
                        {[1, 2, 3].map(j => (
                          <div key={j} className="flex gap-2 mb-1.5"><div className="w-[18px] h-[18px] rounded bg-[var(--border)]" /><div className="h-3 bg-[var(--border)] rounded flex-1" /></div>
                        ))}
                      </div>
                    ))}
                  </BlurLock>
                )}
              </div>
            )}

            {/* TAB: 패키지 */}
            {tab === "package" && (
              <div className="space-y-2">
                {[
                  { id: "light", name: "라이트", price: "무료", color: "var(--muted)", features: ["AI 공정표 + 간트차트", "총 비용 범위", "공종별 기본 정보"], cta: "현재 이용 중" },
                  { id: "standard", name: "스탠다드", price: `${formatCost(Math.round(result.totalCostHigh * 0.05 / 10000) * 10000)}~${formatCost(Math.round(result.totalCostHigh * 0.07 / 10000) * 10000)}`, color: "var(--green)", pop: true, features: ["공종별 상세 비용 분석", "절약 팁 · 예산 배분 가이드", "발주 타이밍 · 자재 리스트", "품질 체크포인트", "검증 업체 매칭", "자동 일정 알림 · 리마인더"], cta: "스탠다드 시작 →" },
                  { id: "premium", name: "프리미엄", price: `${formatCost(Math.round(result.totalCostHigh * 0.10 / 10000) * 10000)}~${formatCost(Math.round(result.totalCostHigh * 0.12 / 10000) * 10000)}`, color: "#F59E0B", features: ["스탠다드 전체", "전담 코디네이터 배정", "자재 현장 검수", "하자 점검 · 준공 검사", "AS 6개월 보증"], cta: "코디네이터 배정 →" },
                ].map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => { setSelectedPkg(pkg.id); if (pkg.id !== "light") setUnlocked(true); }}
                    className={cn(
                      "w-full text-left rounded-xl border p-3.5 transition-all relative",
                      selectedPkg === pkg.id ? "border-[var(--green)] bg-[var(--green)]/[0.04]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--green)]/30"
                    )}
                  >
                    {pkg.pop && (
                      <div className="absolute -top-px right-3.5 px-2 py-0.5 rounded-b text-[8px] font-extrabold bg-[var(--green)] text-black">추천</div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[7px] h-[7px] rounded-full" style={{ background: pkg.color }} />
                        <span className="text-sm font-extrabold">{pkg.name}</span>
                      </div>
                      <span className="text-sm font-extrabold" style={{ color: pkg.color }}>{pkg.price}</span>
                    </div>
                    {pkg.features.map((f, i) => (
                      <div key={i} className="text-[11px] text-[var(--muted)] flex items-center gap-1.5 mb-0.5">
                        <CheckCircle2 size={10} style={{ color: pkg.color }} />
                        {f}
                      </div>
                    ))}
                  </button>
                ))}
                {selectedPkg && selectedPkg !== "light" && (
                  <button className="w-full py-3 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity mt-2">
                    {selectedPkg === "standard" ? "스탠다드 시작하기 →" : "코디네이터 배정 요청 →"}
                  </button>
                )}
                {selectedPkg === "light" && (
                  <p className="text-center text-[11px] text-[var(--muted)] mt-2">현재 라이트(무료) 이용 중 · 상세 분석은 스탠다드부터</p>
                )}
              </div>
            )}

            {/* Reset */}
            <div className="text-center mt-5">
              <button onClick={resetAll} className="text-[11px] text-[var(--muted)] underline hover:text-[var(--foreground)] transition-colors">
                처음부터 다시
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
