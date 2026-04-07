"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { ArrowLeft, Sparkles, Lock, AlertTriangle, CheckCircle2, Calendar, MapPin, Search, Plus, X, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { cn, fmtDate } from "@/lib/utils";
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

function BlurLock({ children, label = "스타터 플랜부터 이용 가능", onUnlock }: { children: React.ReactNode; label?: string; onUnlock: () => void }) {
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
          스타터 플랜 보기 →
        </button>
      </div>
    </div>
  );
}

// ─── Site type ───

interface Site {
  id: string;
  name: string;
  address: string | null;
  buildingType: string | null;
  areaPyeong: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  customerName: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  "상담중": "#8B8B8B", "견적중": "#3B82F6", "계약완료": "#8B5CF6",
  "시공중": "#F59E0B", "시공완료": "#10B981", "A/S": "#EC4899",
};

function pyeongToSize(py: number | null): string | null {
  if (!py) return null;
  if (py < 20) return "10s";
  if (py < 30) return "20s";
  if (py < 40) return "30s";
  if (py < 50) return "40s";
  return "50p";
}

// ─── Main ───

const SESSION_KEY = "schedule-generator-state";

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export default function ScheduleGeneratorPage() {
  const saved = useRef(loadSession());
  const [step, setStep] = useState<number>(saved.current?.step ?? 0);
  const [size, setSize] = useState<string | null>(saved.current?.size ?? null);
  const [selected, setSelected] = useState<string[]>(saved.current?.selected ?? []);
  const [budget, setBudget] = useState(saved.current?.budget ?? "");
  const [result, setResult] = useState<ScheduleResult | null>(saved.current?.result ?? null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>(saved.current?.tab ?? "schedule");
  const [selectedPkg, setSelectedPkg] = useState<string | null>(saved.current?.selectedPkg ?? null);
  const [season] = useState(getSeason());
  const [showModal, setShowModal] = useState(false);
  const [unlocked, setUnlocked] = useState(saved.current?.unlocked ?? false);
  const [startDate, setStartDate] = useState(() => {
    if (saved.current?.startDate) return saved.current.startDate;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const ref = useRef<HTMLDivElement>(null);

  // Site selection
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<Site | null>(saved.current?.selectedSite ?? null);
  const [siteSearch, setSiteSearch] = useState("");

  useEffect(() => {
    fetch("/api/sites", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setSites(Array.isArray(data) ? data : []); setSitesLoading(false); })
      .catch(() => setSitesLoading(false));
  }, []);

  const filteredSites = useMemo(() => {
    if (!siteSearch.trim()) return sites;
    const q = siteSearch.toLowerCase();
    return sites.filter(s => s.name.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q));
  }, [sites, siteSearch]);

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
    const autoSize = pyeongToSize(site.areaPyeong);
    if (autoSize) setSize(autoSize);
    if (site.startDate) setStartDate(site.startDate);
    if (site.endDate) setEndDate(site.endDate);
    go(1);
  };

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
      const res = buildSchedule(selected, sizeObj, season);
      setResult(res);
      if (res) setBlocks(res.scheduled.map(t => ({ ...t })));
      setStep(4);
      setTab("schedule");
      setLoading(false);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }, 1800);
  };

  // End date
  const [endDate, setEndDate] = useState(saved.current?.endDate ?? "");

  // Editable blocks — initialized from generated schedule, then freely editable
  const [blocks, setBlocks] = useState<ScheduledTrade[]>(saved.current?.blocks ?? []);

  // Persist state to sessionStorage
  useEffect(() => {
    const state = { step, size, selected, budget, result, tab, selectedPkg, unlocked, startDate, endDate, selectedSite, blocks };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [step, size, selected, budget, result, tab, selectedPkg, unlocked, startDate, endDate, selectedSite, blocks]);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockStart, setNewBlockStart] = useState(1);
  const [newBlockEnd, setNewBlockEnd] = useState(3);

  const usedTradeIds = useMemo(() => new Set(blocks.map(b => b.id)), [blocks]);
  const availableTrades = useMemo(() => TRADES.filter(t => !usedTradeIds.has(t.id)), [usedTradeIds]);

  const handleRemoveBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  const handleAddTrade = useCallback((tradeId: string) => {
    if (!sizeObj) return;
    const trade = TRADES.find(t => t.id === tradeId);
    if (!trade) return;
    const currentMax = blocks.length > 0 ? Math.max(...blocks.map(b => b.endDay)) : 0;
    const days = Math.round(trade.baseDays * sizeObj.mult);
    const startDay = currentMax + 1;
    const endDay = startDay + days - 1;
    const costLow = Math.round(trade.costMin * sizeObj.pyung);
    const costHigh = Math.round(trade.costMax * sizeObj.pyung);
    const newBlock: ScheduledTrade = {
      ...trade,
      startDay,
      endDay,
      days,
      costLow,
      costHigh,
      costPct: 0,
      isParallel: false,
      parallelWith: [],
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowAddTrade(false);
  }, [blocks, sizeObj]);

  const handleAddCustomBlock = useCallback(() => {
    if (!newBlockName.trim() || newBlockEnd < newBlockStart) return;
    const id = `custom-${Date.now()}`;
    const newBlock: ScheduledTrade = {
      id,
      name: newBlockName.trim(),
      icon: "📌",
      group: "기타",
      phase: 3,
      baseDays: newBlockEnd - newBlockStart + 1,
      costMin: 0,
      costMax: 0,
      unit: "",
      deps: [],
      parallel: [],
      requires: [],
      skipRisk: "low",
      desc: "사용자 추가 블록",
      notes: "",
      savingTip: "",
      qualityCheck: [],
      prework: [],
      materials: [],
      startDay: newBlockStart,
      endDay: newBlockEnd,
      days: newBlockEnd - newBlockStart + 1,
      costLow: 0,
      costHigh: 0,
      costPct: 0,
      isParallel: false,
      parallelWith: [],
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowAddBlock(false);
    setNewBlockName("");
  }, [newBlockName, newBlockStart, newBlockEnd]);

  // Drag & Resize — single block overlay approach
  const [interacting, setInteracting] = useState<{
    id: string;
    mode: "drag" | "resize-start" | "resize-end";
    startX: number;
    origStart: number;
    origEnd: number;
    cellWidth: number;
  } | null>(null);

  const maxDay = useMemo(() => {
    if (!blocks.length) return 1;
    return Math.max(...blocks.map(s => s.endDay));
  }, [blocks]);

  // Date helpers
  const addDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d;
  };
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const getDayOfWeek = (d: Date) => ["일","월","화","수","목","금","토"][d.getDay()];

  // Generate date tick marks for EVERY day
  const dateTicks = useMemo(() => {
    if (!maxDay) return [];
    const ticks: { day: number; label: string; dow: string; isWeekend: boolean }[] = [];
    for (let d = 1; d <= maxDay; d++) {
      const date = addDays(startDate, d - 1);
      const dow = getDayOfWeek(date);
      ticks.push({ day: d, label: formatDate(date), dow, isWeekend: date.getDay() === 0 || date.getDay() === 6 });
    }
    return ticks;
  }, [maxDay, startDate]);

  const startInteraction = (id: string, mode: "drag" | "resize-start" | "resize-end", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    // Measure cell width from the nearest gantt row
    const el = e.currentTarget as HTMLElement;
    const rowEl = el.closest("[data-gantt-row]") || el.parentElement?.closest("[data-gantt-row]");
    // Fallback: use any gantt row on the page
    const anyRow = rowEl || document.querySelector("[data-gantt-row]");
    const cw = anyRow ? (anyRow as HTMLElement).clientWidth / dateTicks.length : 44;
    setInteracting({ id, mode, startX: e.clientX, origStart: block.startDay, origEnd: block.endDay, cellWidth: cw });
  };

  useEffect(() => {
    if (!interacting) return;
    const { id, mode, startX, origStart, origEnd, cellWidth } = interacting;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dayDelta = Math.round(dx / cellWidth);

      setBlocks(prev => prev.map(b => {
        if (b.id !== id) return b;
        let s = origStart, en = origEnd;
        if (mode === "drag") {
          s = origStart + dayDelta;
          en = origEnd + dayDelta;
          if (s < 1) { en += (1 - s); s = 1; }
        } else if (mode === "resize-start") {
          s = Math.max(1, origStart + dayDelta);
          if (s > en) s = en;
        } else {
          en = Math.max(origStart, origEnd + dayDelta);
        }
        return { ...b, startDay: s, endDay: en, days: en - s + 1 };
      }));
    };
    const handleUp = () => setInteracting(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [interacting]);
  const budgetNum = parseInt(budget.replace(/,/g, "")) || 0;
  const budgetFit = budgetNum > 0 && result
    ? budgetNum < result.totalCostLow * 0.1 ? "invalid"
      : budgetNum >= result.totalCostLow ? (budgetNum >= result.totalCostHigh ? "ok" : "tight") : "over"
    : null;

  const resetAll = () => {
    setStep(0); setResult(null); setSelected([]); setSize(null);
    setSelectedPkg(null); setBudget("");
    setTab("schedule"); setUnlocked(false); setSelectedSite(null);
    setBlocks([]); setShowAddTrade(false); setShowAddBlock(false);
    setEndDate("");
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
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
      {step < 4 && (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                step > i ? "w-5 bg-[var(--green)]" : step === i ? "w-6 bg-[var(--green)]/60" : "w-4 bg-[var(--border)]"
              )}
            />
          ))}
        </div>
      )}

      {/* Selected site badge */}
      {selectedSite && step > 0 && step < 4 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
          <MapPin size={12} className="text-[var(--green)]" />
          <span className="text-[11px] font-bold text-[var(--foreground)]">{selectedSite.name}</span>
          {selectedSite.areaPyeong && <span className="text-[10px] text-[var(--muted)]">{selectedSite.areaPyeong}평</span>}
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${STATUS_COLORS[selectedSite.status] || "#888"}22`, color: STATUS_COLORS[selectedSite.status] || "#888" }}>{selectedSite.status}</span>
        </div>
      )}

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
        {/* STEP 0: 현장 선택 */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold">현장을 선택하세요</h2>
              <p className="text-xs text-[var(--muted)]">현장 정보로 평수·시작일이 자동 입력됩니다</p>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={siteSearch}
                onChange={e => setSiteSearch(e.target.value)}
                placeholder="현장명, 주소, 고객명 검색"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              />
            </div>

            {/* Site list */}
            <div className="space-y-1.5 mb-4 max-h-[360px] overflow-y-auto">
              {sitesLoading ? (
                <div className="text-center py-8">
                  <span className="w-5 h-5 border-2 border-[var(--green)]/30 border-t-[var(--green)] rounded-full animate-spin inline-block" />
                  <p className="text-xs text-[var(--muted)] mt-2">현장 불러오는 중...</p>
                </div>
              ) : filteredSites.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin size={24} className="mx-auto text-[var(--muted)] mb-2" />
                  <p className="text-xs text-[var(--muted)]">{siteSearch ? "검색 결과가 없습니다" : "등록된 현장이 없습니다"}</p>
                </div>
              ) : (
                filteredSites.map(site => (
                  <button
                    key={site.id}
                    onClick={() => handleSelectSite(site)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border transition-all",
                      selectedSite?.id === site.id
                        ? "border-[var(--green)] bg-[var(--green)]/[0.08]"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--green)]/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[var(--foreground)]">{site.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${STATUS_COLORS[site.status] || "#888"}22`, color: STATUS_COLORS[site.status] || "#888" }}>{site.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                      {site.address && <span>{site.address}</span>}
                      {site.areaPyeong && <span>{site.areaPyeong}평</span>}
                      {site.buildingType && <span>{site.buildingType}</span>}
                      {site.customerName && <span>· {site.customerName}</span>}
                    </div>
                    {site.startDate && (
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">시작일: {fmtDate(site.startDate)}</p>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Skip */}
            <button
              onClick={() => go(1)}
              className="w-full py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
            >
              현장 없이 진행 →
            </button>
          </div>
        )}

        {/* STEP 1: 평수 선택 */}
        {step === 1 && (
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
            <div className="flex gap-1.5">
              <button onClick={() => go(0)} className="px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] text-sm font-bold hover:bg-[var(--border)] transition-colors">
                ←
              </button>
              <button
                disabled={!size}
                onClick={() => go(2)}
                className="flex-1 py-3.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 공종 선택 */}
        {step === 2 && (
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
              <button onClick={() => go(1)} className="px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] text-sm font-bold hover:bg-[var(--border)] transition-colors">
                ←
              </button>
              <button
                disabled={!selected.length}
                onClick={() => go(3)}
                className="flex-1 py-3 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 예산 */}
        {step === 3 && (
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
              <button onClick={() => go(2)} className="px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] text-sm font-bold hover:bg-[var(--border)] transition-colors">
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

        {/* STEP 4: Results */}
        {step === 4 && result && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Summary */}
            <div className="text-center mb-5">
              <p className="text-[10px] font-bold text-[var(--green)] tracking-widest mb-1.5">AI 공정 분석 완료</p>
              <p className="text-4xl font-black">{maxDay}<span className="text-sm font-normal text-[var(--muted)]">일</span></p>
              <p className="text-xs text-[var(--muted)] mt-1">{selectedSite ? `${selectedSite.name} · ` : ""}{sizeObj?.label} · {selected.length}개 공종 · {SEASONS[season].label}</p>
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

            {/* Tabs + Refresh */}
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1 grid grid-cols-5 border-b border-white/[0.06]">
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
              <button
                onClick={() => window.location.reload()}
                className="shrink-0 mb-1 p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--green)] hover:border-[var(--green)]/30 transition-colors"
                title="새로고침"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* TAB: 공정표 */}
            {tab === "schedule" && (
              <div className="space-y-3">
                {/* Date pickers */}
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[var(--muted)]" />
                    <span className="text-xs text-[var(--muted)]">시작일</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">마감일</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
                    />
                    {endDate && result && (() => {
                      const endD = new Date(endDate + "T00:00:00");
                      const startD = new Date(startDate + "T00:00:00");
                      const availDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
                      const diff = availDays - result.totalDays;
                      return (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          diff >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {diff >= 0 ? `여유 ${diff}일` : `${Math.abs(diff)}일 초과`}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Add block / trade buttons — above chart for visibility */}
                <div className="flex items-center gap-2">
                  {availableTrades.length > 0 && (
                    <button
                      onClick={() => { setShowAddTrade(true); setShowAddBlock(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--green)]/40 bg-[var(--green)]/10 text-xs font-bold text-[var(--green)] hover:bg-[var(--green)]/20 transition-colors"
                    >
                      <Plus size={14} />
                      공종 추가
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowAddBlock(true);
                      setShowAddTrade(false);
                      setNewBlockStart(maxDay + 1);
                      setNewBlockEnd(maxDay + 3);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-400/40 bg-blue-500/10 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <Plus size={14} />
                    블록 추가
                  </button>
                </div>

                {/* Gantt chart with date axis — every day */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-x-auto">
                  <div style={{ minWidth: `${Math.max(700, maxDay * 44 + 160)}px` }}>
                    {/* Date axis header */}
                    <div className="flex border-b border-[var(--border)]">
                      <div className="w-32 shrink-0 px-3 py-2 border-r border-[var(--border)]">
                        <span className="text-xs text-[var(--muted)] font-semibold">공종</span>
                      </div>
                      <div className="flex-1 flex">
                        {dateTicks.map((tick) => (
                          <div
                            key={tick.day}
                            className={cn(
                              "flex-1 min-w-[36px] flex flex-col items-center py-1.5 border-r border-white/[0.03]",
                              tick.isWeekend && "bg-red-400/[0.04]"
                            )}
                          >
                            <span className={cn(
                              "text-[11px] font-bold leading-tight",
                              tick.isWeekend ? "text-red-400/80" : "text-[var(--foreground)]"
                            )}>
                              {tick.label}
                            </span>
                            <span className={cn(
                              "text-[10px] leading-tight",
                              tick.isWeekend ? "text-red-400/50" : "text-[var(--muted)]"
                            )}>
                              {tick.dow}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chart body rows — flat trade list */}
                    {blocks.map((item) => (
                      <div key={item.id} className="flex border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                        {/* Trade name + cost + delete */}
                        <div className="w-32 shrink-0 px-3 py-1.5 flex items-center gap-1.5 border-r border-[var(--border)]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{item.icon}</span>
                              <span className="text-xs font-semibold text-[var(--foreground)] truncate">{item.name}</span>
                            </div>
                            {(item.costLow > 0 || item.costHigh > 0) && (
                              <span className="text-[10px] text-yellow-400/80 font-medium">{formatCost(item.costLow)}~{formatCost(item.costHigh)}</span>
                            )}
                          </div>
                          {blocks.length > 1 && (
                            <button
                              onClick={() => handleRemoveBlock(item.id)}
                              className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="블록 제거"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {/* Day grid + block overlay */}
                        <div className="flex-1 relative h-10" data-gantt-row>
                          {/* Background grid — pointer-events-none so block receives events */}
                          <div className="absolute inset-0 flex pointer-events-none">
                            {dateTicks.map((tick) => (
                              <div key={tick.day} className={cn("flex-1 min-w-[36px] border-r border-white/[0.02]", tick.isWeekend && "bg-red-400/[0.02]")} />
                            ))}
                          </div>
                          {/* Block — single positioned element */}
                          <div
                            className={cn(
                              "absolute top-0.5 bottom-0.5 rounded-md flex items-center select-none z-10",
                              interacting?.id === item.id
                                ? interacting.mode === "drag" ? "cursor-grabbing opacity-70" : "opacity-80"
                                : "cursor-grab hover:brightness-125"
                            )}
                            style={{
                              left: `${((item.startDay - 1) / dateTicks.length) * 100}%`,
                              width: `${(item.days / dateTicks.length) * 100}%`,
                              background: `${PHASE_COLORS[item.phase]}55`,
                              minWidth: 16,
                            }}
                            onMouseDown={(e) => startInteraction(item.id, "drag", e)}
                          >
                            {/* Left resize handle — 20px wide */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-5 cursor-col-resize z-20 rounded-l-md hover:bg-white/20 transition-colors"
                              onMouseDown={(e) => startInteraction(item.id, "resize-start", e)}
                            />
                            {/* Label */}
                            <span className="text-[11px] font-bold text-white/90 whitespace-nowrap px-6 pointer-events-none select-none truncate flex-1 text-center">
                              {item.days}일
                            </span>
                            {/* Right resize handle — 20px wide */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-5 cursor-col-resize z-20 rounded-r-md hover:bg-white/20 transition-colors"
                              onMouseDown={(e) => startInteraction(item.id, "resize-end", e)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Trade Modal */}
                <Modal open={showAddTrade} onClose={() => setShowAddTrade(false)} title="공종 추가">
                  <div className="max-h-[400px] overflow-y-auto -mx-2">
                    {TRADE_GROUPS.map(g => {
                      const trades = availableTrades.filter(t => t.group === g);
                      if (!trades.length) return null;
                      return (
                        <div key={g}>
                          <p className="text-[10px] font-bold text-[var(--muted)] px-3 pt-3 pb-1 uppercase tracking-wider">{g}</p>
                          {trades.map(t => (
                            <button
                              key={t.id}
                              onClick={() => handleAddTrade(t.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--green)]/[0.06] transition-colors text-left rounded-lg"
                            >
                              <span className="text-base">{t.icon}</span>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-[var(--foreground)]">{t.name}</span>
                                <p className="text-[10px] text-[var(--muted)]">{t.desc.slice(0, 40)}</p>
                              </div>
                              <span className="text-xs text-[var(--muted)] shrink-0">{t.baseDays}일</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {availableTrades.length === 0 && (
                      <p className="text-center text-sm text-[var(--muted)] py-8">모든 공종이 추가되었습니다</p>
                    )}
                  </div>
                </Modal>

                {/* Add Custom Block Modal */}
                <Modal open={showAddBlock} onClose={() => setShowAddBlock(false)} title="블록 추가">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[var(--muted)] mb-1">블록 이름 *</label>
                      <input
                        value={newBlockName}
                        onChange={e => setNewBlockName(e.target.value)}
                        placeholder="예: 현장 청소, 추가 작업"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">시작 (일차)</label>
                        <input type="number" min={1} value={newBlockStart} onChange={e => setNewBlockStart(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">종료 (일차)</label>
                        <input type="number" min={newBlockStart} value={newBlockEnd} onChange={e => setNewBlockEnd(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors" />
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDate(addDays(startDate, newBlockStart - 1))} ~ {formatDate(addDays(startDate, newBlockEnd - 1))} ({newBlockEnd - newBlockStart + 1}일간)
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowAddBlock(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors">취소</button>
                      <button
                        onClick={handleAddCustomBlock}
                        disabled={!newBlockName.trim() || newBlockEnd < newBlockStart}
                        className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                </Modal>

                {/* Block detail list */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  {blocks.map(item => (
                    <div key={item.id} className="px-3.5 py-2.5 border-b border-white/[0.03] last:border-0 group/detail">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{item.icon}</span>
                          <span className="text-xs font-bold">{item.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--green)]/[0.08] text-[var(--green)]">{formatDate(addDays(startDate, item.startDay - 1))}~{formatDate(addDays(startDate, item.endDay - 1))} ({item.days}일)</span>
                          {item.isParallel && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/[0.08] text-purple-400">∥병렬</span>}
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${PHASE_COLORS[item.phase]}15`, color: PHASE_COLORS[item.phase] }}>{PHASE_LABELS[item.phase]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(item.costLow > 0 || item.costHigh > 0) && (
                            <span className="text-[11px] font-bold text-yellow-400 whitespace-nowrap">{formatCost(item.costLow)}~{formatCost(item.costHigh)}</span>
                          )}
                          {blocks.length > 1 && (
                            <button
                              onClick={() => handleRemoveBlock(item.id)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                              title="블록 제거"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      {item.desc && <p className="text-[10px] text-[var(--muted)] pl-6">{item.desc}</p>}
                      {item.notes && <p className="text-[10px] text-yellow-500 mt-0.5 pl-6">⚠ {item.notes}</p>}
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="rounded-xl border border-[var(--green)]/20 bg-[var(--green)]/[0.04] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold">합계</span>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-yellow-400">{formatCost(result.totalCostLow)} ~ {formatCost(result.totalCostHigh)}</p>
                      <p className="text-[10px] text-[var(--muted)]">{maxDay}일 · {blocks.length}블록</p>
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
                  { id: "free", name: "무료", price: "₩0", color: "var(--muted)", features: ["AI 공정표 + 간트차트", "총 비용 범위", "공종별 기본 정보"], cta: "현재 이용 중" },
                  { id: "starter", name: "스타터", price: "₩149,000/월", color: "var(--blue)", pop: false, features: ["현장 15개 관리", "공종별 정산", "견적서 템플릿 3개", "세무 기본 (캘린더, 장부)", "AI 세무 상담 10회/월", "Excel 내보내기"], cta: "스타터 시작 →" },
                  { id: "pro", name: "프로", price: "₩299,000/월", color: "var(--green)", pop: true, features: ["현장/고객 무제한", "마케팅 자동화 (5채널)", "전자 계약", "인력/자재 관리", "세무/회계 전체", "AI 세무 상담 무제한", "고객 포털", "OCR 영수증 스캔"], cta: "프로 시작 →" },
                ].map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => { setSelectedPkg(pkg.id); if (pkg.id !== "free") setUnlocked(true); }}
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
                {selectedPkg && selectedPkg !== "free" && (
                  <button className="w-full py-3 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity mt-2">
                    {selectedPkg === "starter" ? "스타터 시작하기 →" : "프로 시작하기 →"}
                  </button>
                )}
                {selectedPkg === "free" && (
                  <p className="text-center text-[11px] text-[var(--muted)] mt-2">현재 무료 플랜 이용 중 · 상세 분석은 스타터부터</p>
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
