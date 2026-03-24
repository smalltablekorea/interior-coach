"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BarChart3,
  Calculator,
  Clock,
  Home,
  Minus,
  Plus,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CATS,
  GRADES,
  GRADE_SPECS,
  calcCatTotal,
  rooms,
  baths,
  getDuration,
  CAT_DURATION,
} from "@/lib/estimate-engine";
import { fmtShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── 등급 이모지 ───
const GRADE_EMOJI: Record<string, string> = {
  basic: "🔧",
  economy: "💚",
  standard: "⭐",
  comfort: "✨",
  premium: "💎",
  highend: "🏆",
  luxury: "👑",
  ultralux: "🌟",
};

// ─── 건물 유형 ───
const BUILDING_TYPES = [
  { key: "apt", label: "아파트", adj: 1.0 },
  { key: "villa", label: "빌라", adj: 1.05 },
  { key: "officetel", label: "오피스텔", adj: 0.95 },
  { key: "house", label: "주택", adj: 1.1 },
  { key: "store", label: "상가", adj: 0.9 },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function EstimateCoachPage() {
  // ─── 시뮬레이터 상태 ───
  const [area, setArea] = useState(27);
  const [grade, setGrade] = useState("standard");
  const [buildingType, setBuildingType] = useState("apt");
  const [profitRate, setProfitRate] = useState(20);
  const [overheadRate, setOverheadRate] = useState(6);
  const [vatOn, setVatOn] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showAllGrades, setShowAllGrades] = useState(false);

  // ─── AI 채팅 상태 ───
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── 계산 ───
  const selectedGrade = useMemo(
    () => GRADES.find((g) => g.key === grade) || GRADES[2],
    [grade]
  );

  const buildingAdj = useMemo(
    () => BUILDING_TYPES.find((b) => b.key === buildingType)?.adj || 1.0,
    [buildingType]
  );

  const breakdown = useMemo(() => {
    return CATS.map((cat) => {
      const baseTotal = calcCatTotal(cat, area, grade);
      const total = Math.round(baseTotal * buildingAdj);
      const duration = getDuration(cat.id, area);
      const spec = GRADE_SPECS[cat.id]?.[grade] || "";
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        essential: cat.essential,
        total,
        duration,
        spec,
        subs: cat.subs,
        matOptions: cat.matOptions,
        gradeAdj: cat.gradeAdj,
      };
    });
  }, [area, grade, buildingAdj]);

  const directTotal = useMemo(
    () => breakdown.reduce((s, c) => s + c.total, 0),
    [breakdown]
  );

  const profit = Math.round(directTotal * (profitRate / 100));
  const overhead = Math.round(directTotal * (overheadRate / 100));
  const subtotal = directTotal + profit + overhead;
  const vat = vatOn ? Math.round(subtotal * 0.1) : 0;
  const grandTotal = subtotal + vat;

  // ─── 등급별 비교 ───
  const gradeComparison = useMemo(() => {
    return GRADES.map((g) => {
      const total = CATS.reduce(
        (s, cat) => s + Math.round(calcCatTotal(cat, area, g.key) * buildingAdj),
        0
      );
      return { ...g, total };
    });
  }, [area, buildingAdj]);

  // ─── 공사기간 ───
  const duration = useMemo(() => {
    const maxSeq = Math.max(
      ...Object.values(CAT_DURATION).map((d) => d.seq)
    );
    let min = 0;
    let max = 0;
    for (let seq = 1; seq <= maxSeq; seq++) {
      const catsInSeq = Object.entries(CAT_DURATION).filter(
        ([, d]) => d.seq === seq
      );
      min += Math.max(...catsInSeq.map(([id]) => getDuration(id, area).min));
      max += Math.max(...catsInSeq.map(([id]) => getDuration(id, area).max));
    }
    return { min, max };
  }, [area]);

  // ─── AI 채팅 ───
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const QUICK_QUESTIONS = [
    `${area}평 ${selectedGrade.label} 등급에서 비용 절감 포인트는?`,
    "자재 등급을 선택적으로 올리는 전략이 있을까요?",
    "업체 견적서를 비교할 때 주의할 점은?",
    "주방 리모델링 비용을 줄이는 방법은?",
    "욕실 방수 공사에서 절대 줄이면 안 되는 항목은?",
    "인건비가 오르는 시기를 피하는 방법은?",
  ];

  const handleAsk = async (q?: string) => {
    const text = q || input.trim();
    if (!text || asking) return;
    setAsking(true);
    setInput("");

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/estimate-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          area,
          grade,
          breakdown: breakdown.map((b) => ({ name: b.name, total: b.total })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.answer,
          timestamp: data.createdAt,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      // silent
    }
    setAsking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // ─── 상위 비용 공종 ───
  const topCats = useMemo(
    () => [...breakdown].sort((a, b) => b.total - a.total).slice(0, 5),
    [breakdown]
  );

  const maxCatTotal = topCats[0]?.total || 1;

  // ─── 표시용 등급 ───
  const visibleGrades = showAllGrades
    ? gradeComparison
    : gradeComparison.filter((g) =>
        ["economy", "standard", "comfort", "premium"].includes(g.key)
      );

  const selectedGradeTotal =
    gradeComparison.find((g) => g.key === grade)?.total || 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/estimates"
            className="p-2 rounded-lg hover:bg-[var(--border)] text-[var(--muted)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles size={24} className="text-[var(--green)]" />
              견적코치
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              AI 기반 인테리어 견적 시뮬레이션 & 코칭
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">PDF 저장</span>
          </button>
          <Link
            href="/estimates/builder"
            className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
          >
            견적서 작성하기
          </Link>
        </div>
      </div>

      {/* ─── 시뮬레이터 입력 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 평수 입력 */}
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <Home size={16} className="text-[var(--green)]" />
            <span className="text-sm font-medium">평수</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setArea(Math.max(10, area - 1))}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)] text-[var(--muted)]"
            >
              <Minus size={16} />
            </button>
            <div className="flex-1 text-center">
              <input
                type="range"
                min={10}
                max={100}
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full accent-[var(--green)]"
              />
              <p className="text-2xl font-bold mt-1">
                {area}
                <span className="text-sm font-normal text-[var(--muted)] ml-1">
                  평
                </span>
              </p>
            </div>
            <button
              onClick={() => setArea(Math.min(100, area + 1))}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)] text-[var(--muted)]"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1 px-1">
            <span>10평</span>
            <span>100평</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {[20, 27, 34, 45].map((v) => (
              <button
                key={v}
                onClick={() => setArea(v)}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  area === v
                    ? "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30"
                    : "bg-white/[0.04] text-[var(--muted)] hover:bg-white/[0.08]"
                )}
              >
                {v}평
              </button>
            ))}
          </div>
        </div>

        {/* 건물유형 & 등급 */}
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-[var(--green)]" />
            <span className="text-sm font-medium">건물유형 & 등급</span>
          </div>
          <div className="mb-3">
            <label className="text-[10px] text-[var(--muted)] mb-1 block">
              건물유형
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BUILDING_TYPES.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBuildingType(b.key)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    buildingType === b.key
                      ? "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30"
                      : "bg-white/[0.04] text-[var(--muted)] hover:bg-white/[0.08]"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[var(--muted)] mb-1 block">
              시공 등급
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none"
            >
              {GRADES.map((g) => (
                <option key={g.key} value={g.key}>
                  {GRADE_EMOJI[g.key]} {g.label} ({g.tag}) — 60평 기준{" "}
                  {fmtShort(g.target60)}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[var(--muted)] mt-1.5">
              {selectedGrade.desc}
            </p>
          </div>
        </div>

        {/* 이윤/경비/VAT */}
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={16} className="text-[var(--green)]" />
            <span className="text-sm font-medium">이윤 & 경비</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[var(--muted)]">
                  이윤
                </label>
                <span className="text-xs font-medium">{profitRate}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={profitRate}
                onChange={(e) => setProfitRate(Number(e.target.value))}
                className="w-full accent-[var(--green)]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[var(--muted)]">
                  경비
                </label>
                <span className="text-xs font-medium">{overheadRate}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={overheadRate}
                onChange={(e) => setOverheadRate(Number(e.target.value))}
                className="w-full accent-[var(--green)]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-[var(--muted)]">
                부가세(VAT 10%)
              </label>
              <button
                onClick={() => setVatOn(!vatOn)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  vatOn ? "bg-[var(--green)]" : "bg-[var(--border)]"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all",
                    vatOn ? "left-5.5" : "left-0.5"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 총 견적 요약 ─── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--green)]/5 to-[var(--green)]/[0.02] border border-[var(--green)]/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--muted)] mb-1">
              {area}평 · {selectedGrade.label} · {BUILDING_TYPES.find((b) => b.key === buildingType)?.label} · 이윤{profitRate}% · 경비{overheadRate}%
              {vatOn && " · VAT 포함"}
            </p>
            <p className="text-3xl font-bold">
              {fmtShort(grandTotal)}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted)]">
              <span>직접공사비 {fmtShort(directTotal)}</span>
              <span>이윤 {fmtShort(profit)}</span>
              <span>경비 {fmtShort(overhead)}</span>
              {vatOn && <span>VAT {fmtShort(vat)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center px-4 py-2 rounded-xl bg-white/[0.04]">
              <Clock size={16} className="mx-auto mb-1 text-[var(--muted)]" />
              <p className="font-medium">
                {duration.min}~{duration.max}일
              </p>
              <p className="text-[10px] text-[var(--muted)]">예상 공기</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/[0.04]">
              <Home size={16} className="mx-auto mb-1 text-[var(--muted)]" />
              <p className="font-medium">
                {rooms(area)}실 / {baths(area)}욕실
              </p>
              <p className="text-[10px] text-[var(--muted)]">구성</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/[0.04]">
              <Calculator size={16} className="mx-auto mb-1 text-[var(--muted)]" />
              <p className="font-medium">
                {fmtShort(Math.round(grandTotal / area))}
              </p>
              <p className="text-[10px] text-[var(--muted)]">평당</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── 왼쪽: 공종별 비용 + 등급 비교 ─── */}
        <div className="xl:col-span-2 space-y-6">
          {/* 상위 비용 공종 차트 */}
          <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-[var(--green)]" />
              공종별 비용 분석 (TOP 5)
            </h2>
            <div className="space-y-3">
              {topCats.map((cat) => {
                const pct = (cat.total / maxCatTotal) * 100;
                const sharePct = directTotal > 0 ? ((cat.total / directTotal) * 100).toFixed(1) : "0";
                return (
                  <div key={cat.id}>
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
                          {sharePct}%
                        </span>
                      </div>
                      <span className="text-sm font-medium tabular-nums">
                        {fmtShort(cat.total)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
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
          </div>

          {/* 전체 공종 상세 */}
          <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-[var(--green)]" />
              공종별 상세 내역
            </h2>
            <div className="space-y-1">
              {breakdown.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl border border-[var(--border)] overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedCat(expandedCat === cat.id ? null : cat.id)
                    }
                    className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: cat.color + "20",
                          color: cat.color,
                        }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-sm font-medium">{cat.name}</span>
                      {cat.essential && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--orange)]/10 text-[var(--orange)]">
                          필수
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {fmtShort(cat.total)}
                      </span>
                      {expandedCat === cat.id ? (
                        <ChevronUp size={14} className="text-[var(--muted)]" />
                      ) : (
                        <ChevronDown size={14} className="text-[var(--muted)]" />
                      )}
                    </div>
                  </button>
                  {expandedCat === cat.id && (
                    <div className="px-3 pb-3 space-y-2">
                      {/* 등급별 스펙 */}
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-[var(--border)]">
                        <p className="text-xs text-[var(--muted)] mb-0.5">
                          {selectedGrade.label} 등급 사양
                        </p>
                        <p className="text-xs">{cat.spec}</p>
                      </div>
                      {/* 자재 옵션 */}
                      {cat.matOptions && (
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-[var(--border)]">
                          <p className="text-xs text-[var(--muted)] mb-1.5">
                            자재 옵션 (등급별)
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {cat.matOptions
                              .filter((m) =>
                                ["economy", "standard", "comfort", "premium"].includes(
                                  m.grade
                                )
                              )
                              .map((m) => (
                                <div
                                  key={m.grade}
                                  className={cn(
                                    "px-2 py-1.5 rounded text-xs",
                                    m.grade === grade
                                      ? "bg-[var(--green)]/10 border border-[var(--green)]/20"
                                      : "bg-white/[0.02]"
                                  )}
                                >
                                  <span className="text-[var(--muted)]">
                                    {GRADES.find((g) => g.key === m.grade)?.label}:{" "}
                                  </span>
                                  <span className="font-medium">{m.name}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {/* 공사기간 */}
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <Clock size={12} />
                        <span>
                          예상 공사기간: {cat.duration.min}~{cat.duration.max}일
                          {cat.duration.note && ` (${cat.duration.note})`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 등급별 비교 차트 — recharts */}
          <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--green)]" />
                등급별 비용 비교 ({area}평 기준)
              </h2>
              <button
                onClick={() => setShowAllGrades(!showAllGrades)}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {showAllGrades ? "주요 등급만" : "전체 등급 보기"}
              </button>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visibleGrades.map((g) => ({
                    name: g.label,
                    key: g.key,
                    total: g.total,
                    color: g.color,
                    tag: g.tag,
                  }))}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    const key = state?.activePayload?.[0]?.payload?.key;
                    if (key) setGrade(key);
                  }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => fmtShort(v)}
                    tick={{ fill: "#888", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, _name: any, props: any) => {
                      const v = Number(value) || 0;
                      const diff = v - selectedGradeTotal;
                      const diffLabel = diff === 0 ? "(현재 선택)" : diff > 0 ? `+${fmtShort(diff)}` : fmtShort(diff);
                      return [`${fmtShort(v)} ${diffLabel}`, `${props?.payload?.tag || ""}`];
                    }}
                    labelFormatter={(label: any) => `${label} 등급`}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} cursor="pointer">
                    {visibleGrades.map((g) => (
                      <Cell
                        key={g.key}
                        fill={g.color}
                        fillOpacity={g.key === grade ? 0.9 : 0.35}
                        stroke={g.key === grade ? g.color : "transparent"}
                        strokeWidth={g.key === grade ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Selected grade info */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-[var(--green)]/[0.03] border border-[var(--green)]/20">
              <div className="flex items-center gap-2">
                <span className="text-sm">{GRADE_EMOJI[grade]} {selectedGrade.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[var(--muted)]">
                  {selectedGrade.tag}
                </span>
              </div>
              <span className="text-sm font-bold">{fmtShort(selectedGradeTotal)}</span>
            </div>
          </div>
        </div>

        {/* ─── 오른쪽: AI 코치 채팅 ─── */}
        <div className="xl:col-span-1">
          <div className="sticky top-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Bot size={16} className="text-[var(--green)]" />
              AI 견적 코치
            </h2>
            <p className="text-[10px] text-[var(--muted)] mb-3">
              현재 시뮬레이션 기반으로 맞춤 견적 상담을 받으세요
            </p>

            {/* Quick Questions */}
            {messages.length === 0 && (
              <div className="space-y-1.5 mb-3">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAsk(q)}
                    disabled={asking}
                    className="w-full text-left p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--border)] text-xs transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Messages */}
            {messages.length > 0 && (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-3 pr-1">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "")}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={12} className="text-[var(--green)]" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-tr-md"
                          : "bg-white/[0.03] border border-[var(--border)] rounded-tl-md"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                        <User size={12} className="text-[var(--muted)]" />
                      </div>
                    )}
                  </div>
                ))}

                {asking && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0">
                      <Bot size={12} className="text-[var(--green)]" />
                    </div>
                    <div className="p-2.5 rounded-xl rounded-tl-md bg-white/[0.03] border border-[var(--border)]">
                      <div className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-[var(--muted)]" />
                        <span className="text-xs text-[var(--muted)]">분석 중...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/[0.03] border border-[var(--border)]">
              <input
                type="text"
                placeholder="견적 관련 질문을 입력하세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={asking}
                className="flex-1 px-2 py-2 bg-transparent text-xs focus:outline-none placeholder:text-[var(--muted)] disabled:opacity-50"
              />
              <button
                onClick={() => handleAsk()}
                disabled={!input.trim() || asking}
                className="p-2 rounded-lg bg-[var(--green)] text-black disabled:opacity-30 transition-opacity"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 절약 팁 카드 ─── */}
      <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-yellow-400" />
          비용 절감 팁
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <TipCard
            title="자재 등급 혼합 전략"
            desc="거실·주방은 프리미엄, 알파룸·발코니는 스탠다드로 선택적 등급 적용 시 전체 비용의 15~20% 절감 가능"
            saving="15~20%"
          />
          <TipCard
            title="비수기 시공 활용"
            desc="1~2월, 7~8월 비수기에 시공 시작하면 인건비 협상 여지가 크고, 자재 납품도 빠름"
            saving="5~10%"
          />
          <TipCard
            title="창호 교체 vs 유지"
            desc="10년 미만 샷시는 유리만 교체(로이유리)해도 단열 성능 70% 확보 가능. 전체 교체 대비 비용 절감"
            saving="최대 800만"
          />
          <TipCard
            title="직접 시공 항목 확인"
            desc="입주청소, 폐기물 처리, 보양 등은 직접 수배 시 30~40% 저렴. 단, 품질 관리 필요"
            saving="30~40%"
          />
          <TipCard
            title="도배·마루 동시 시공"
            desc="도배와 마루를 한 업체에 묶으면 할인 가능. 개별 발주보다 세트 계약이 유리"
            saving="5~10%"
          />
          <TipCard
            title="타일 대형화 트렌드"
            desc="600×1200 대형타일은 줄눈 줄어 유지관리 쉽고, 시공 면적 대비 단가 절감 효과"
            saving="시공비 절감"
          />
        </div>
      </div>
    </div>
  );
}

function TipCard({
  title,
  desc,
  saving,
}: {
  title: string;
  desc: string;
  saving: string;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)] shrink-0">
          {saving} 절감
        </span>
      </div>
      <p className="text-xs text-[var(--muted)] leading-relaxed">{desc}</p>
    </div>
  );
}
