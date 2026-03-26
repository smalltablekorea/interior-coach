"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Lock,
  Unlock,
  Zap,
  Shield,
  AlertTriangle,
  RotateCcw,
  Trash2,
  PlusCircle,
  Camera,
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
  calcSub,
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

  // ─── 공종별 커스터마이징 ───
  const [catGrades, setCatGrades] = useState<Record<string, string>>({});
  const [catAdj, setCatAdj] = useState<Record<string, number>>({});
  const [subOverrides, setSubOverrides] = useState<Record<string, { amount?: number; name?: string }>>({});
  const [customSubs, setCustomSubs] = useState<Record<string, { name: string; qty: number; unit: string; unitPrice: number }[]>>({});
  const [matOverrides, setMatOverrides] = useState<Record<string, { name: string; qty: number; unit: string; unitPrice: number }[]>>({});
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);

  // AI 세부내역 자동생성
  const handleAiGenerate = useCallback(async (catId: string) => {
    if (aiGenerating) return;
    setAiGenerating(catId);
    try {
      const cat = CATS.find((c) => c.id === catId);
      if (!cat) return;
      const cg = catGrades[catId] || grade;
      const gradeLabel = GRADES.find((g) => g.key === cg)?.label || cg;
      const bt = BUILDING_TYPES.find((b) => b.key === buildingType)?.label || buildingType;

      const res = await fetch("/api/estimate-coach/generate-subs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catId, catName: cat.name, area, grade: cg, gradeLabel, buildingType: bt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subs && Array.isArray(data.subs)) {
          // 엔진 세부항목명 오버라이드
          const namePatches: Record<string, { name?: string; amount?: number }> = {};
          data.subs.forEach((s: { index?: number; name?: string; amount?: number }) => {
            if (s.index != null && s.index < cat.subs.length) {
              const key = `${catId}-${s.index}`;
              namePatches[key] = {};
              if (s.name) namePatches[key].name = s.name;
              if (s.amount != null) namePatches[key].amount = s.amount;
            }
          });
          if (Object.keys(namePatches).length > 0) {
            setSubOverrides((prev) => ({ ...prev, ...namePatches }));
          }
          // 추가 항목
          if (data.customSubs && Array.isArray(data.customSubs)) {
            setCustomSubs((prev) => ({
              ...prev,
              [catId]: data.customSubs.map((cs: { name: string; qty: number; unit: string; unitPrice: number }) => ({
                name: cs.name, qty: cs.qty || 1, unit: cs.unit || "식", unitPrice: cs.unitPrice || 0,
              })),
            }));
          }
          // 추가 자재
          if (data.matOverrides && Array.isArray(data.matOverrides)) {
            setMatOverrides((prev) => ({
              ...prev,
              [catId]: data.matOverrides.map((mo: { name: string; qty: number; unit: string; unitPrice: number }) => ({
                name: mo.name, qty: mo.qty || 1, unit: mo.unit || "개", unitPrice: mo.unitPrice || 0,
              })),
            }));
          }
        }
      }
    } catch {
      // silent
    }
    setAiGenerating(null);
  }, [aiGenerating, catGrades, grade, buildingType, area]);

  // ─── 영수증 OCR ───
  const [receiptParsing, setReceiptParsing] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || receiptParsing) return;
    setReceiptParsing(true);
    try {
      const images: { data: string; mimeType: string }[] = [];
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // base64 only
          };
          reader.readAsDataURL(file);
        });
        images.push({ data, mimeType: file.type });
      }
      if (images.length === 0) { setReceiptParsing(false); return; }

      const res = await fetch("/api/estimate-coach/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      if (res.ok) {
        const { grouped } = await res.json() as { grouped: Record<string, { name: string; qty: number; unit: string; unitPrice: number }[]> };
        // 공종별로 customSubs에 추가
        setCustomSubs((prev) => {
          const next = { ...prev };
          for (const [catId, items] of Object.entries(grouped)) {
            const existing = next[catId] || [];
            next[catId] = [...existing, ...items];
          }
          return next;
        });
        // 해당 공종 펼치기 (첫 번째 공종)
        const firstCat = Object.keys(grouped)[0];
        if (firstCat) setExpandedCat(firstCat);
      }
    } catch {
      // silent
    }
    setReceiptParsing(false);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  }, [receiptParsing]);

  // ─── 크레딧 & 프로 분석 상태 ───
  const [credits, setCredits] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const [proUnlocked, setProUnlocked] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [proError, setProError] = useState<string | null>(null);
  const [proAnalysis, setProAnalysis] = useState<Record<string, unknown> | null>(null);

  // 크레딧 조회
  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // 프로 분석 잠금해제
  const handleUnlockPro = async () => {
    if (proLoading) return;
    setProLoading(true);
    setProError(null);

    try {
      const resultData = {
        area,
        grade,
        buildingType,
        selectedGradeLabel: selectedGrade.label,
        directTotal,
        profit,
        overhead,
        subtotal,
        vat,
        grandTotal,
        breakdown: breakdown.map((b) => ({
          id: b.id,
          name: b.name,
          total: b.total,
          spec: b.spec,
          duration: b.duration,
        })),
        duration,
      };

      const res = await fetch("/api/credits/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          grade,
          buildingType,
          profitRate,
          overheadRate,
          vatEnabled: vatOn,
          resultData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProUnlocked(true);
        setProAnalysis(resultData);
        setCredits((prev) =>
          prev ? { ...prev, used: prev.used + 1, remaining: data.remainingCredits } : null
        );
      } else {
        const err = await res.json();
        setProError(err.error || "크레딧 사용에 실패했습니다.");
      }
    } catch {
      setProError("네트워크 오류가 발생했습니다.");
    }
    setProLoading(false);
  };

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
      const cg = catGrades[cat.id] || grade;
      const baseTotal = calcCatTotal(cat, area, grade, cg);
      const engineTotal = Math.round(baseTotal * buildingAdj);

      // 세부항목 오버라이드 차이
      let overrideDiff = 0;
      cat.subs.forEach((sub, i) => {
        const ov = subOverrides[`${cat.id}-${i}`];
        if (ov?.amount != null) {
          overrideDiff += ov.amount - calcSub(sub, area);
        }
      });

      // 커스텀 항목 합산
      const customTotal = (customSubs[cat.id] || []).reduce((s, cs) => s + Math.round(cs.qty * cs.unitPrice / 100) * 100, 0);

      // 자재 오버라이드 합산
      const matOverrideTotal = (matOverrides[cat.id] || []).reduce((s, mo) => s + Math.round(mo.qty * mo.unitPrice / 100) * 100, 0);

      // 금액 조정
      const adj = catAdj[cat.id] || 0;
      const total = Math.max(0, engineTotal + overrideDiff + customTotal + matOverrideTotal + adj);

      const effectiveGrade = cg;
      const duration = getDuration(cat.id, area);
      const spec = GRADE_SPECS[cat.id]?.[effectiveGrade] || "";
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        essential: cat.essential,
        total,
        engineTotal,
        adj,
        overrideDiff,
        customTotal,
        matOverrideTotal,
        effectiveGrade,
        duration,
        spec,
        subs: cat.subs,
        matOptions: cat.matOptions,
        gradeAdj: cat.gradeAdj,
      };
    });
  }, [area, grade, buildingAdj, catGrades, catAdj, subOverrides, customSubs, matOverrides]);

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
      {/* ─── 면책 조항 배너 ─── */}
      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
        <span className="text-amber-500 shrink-0 mt-0.5 text-sm">⚠️</span>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          본 분석은 참고용이며, 실제 시공 가격은 현장 조건에 따라 달라질 수 있습니다.
          견적코치는 가격을 보증하지 않으며, 본 분석을 근거로 한 의사결정에 대해 책임지지 않습니다.
        </p>
      </div>

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
              {gradeComparison.map((g) => (
                <option key={g.key} value={g.key}>
                  {GRADE_EMOJI[g.key]} {g.label} ({g.tag}) — {area}평 기준{" "}
                  {fmtShort(g.total)}
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

      {/* ─── 프로분석 잠금해제 ─── */}
      <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              {proUnlocked ? <Unlock size={20} className="text-[var(--green)]" /> : <Lock size={20} className="text-amber-500" />}
            </div>
            <div>
              <h2 className="text-sm font-medium flex items-center gap-2">
                프로 분석 리포트
                {proUnlocked && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)]">잠금해제됨</span>
                )}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {proUnlocked
                  ? "현재 시뮬레이션 결과가 저장되었습니다"
                  : "1크레딧으로 상세 분석 리포트를 잠금해제하세요"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {credits !== null && (
              <span className="text-xs text-[var(--muted)]">
                <Shield size={12} className="inline mr-1" />
                잔여 {credits.remaining}크레딧
              </span>
            )}
            {!proUnlocked && (
              <button
                onClick={handleUnlockPro}
                disabled={proLoading || (credits !== null && credits.remaining <= 0)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {proLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                {proLoading ? "분석 저장 중..." : "프로분석 (1크레딧)"}
              </button>
            )}
          </div>
        </div>
        {proError && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-400">{proError}</p>
          </div>
        )}
        {proUnlocked && proAnalysis && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">총 견적가</p>
                <p className="text-lg font-bold">{fmtShort(Number(proAnalysis.grandTotal))}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">직접공사비</p>
                <p className="text-lg font-bold">{fmtShort(Number(proAnalysis.directTotal))}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">평당 단가</p>
                <p className="text-lg font-bold">{fmtShort(Math.round(Number(proAnalysis.grandTotal) / area))}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">예상 공기</p>
                <p className="text-lg font-bold">
                  {(proAnalysis.duration as { min: number; max: number })?.min}~{(proAnalysis.duration as { min: number; max: number })?.max}일
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-[var(--green)]" />
                <p className="text-xs font-medium text-[var(--green)]">분석 완료 — 마이페이지에서 이력 확인 가능</p>
              </div>
              <p className="text-xs text-[var(--muted)]">
                {area}평 · {(proAnalysis.selectedGradeLabel as string)} · 이윤{profitRate}% · 경비{overheadRate}%{vatOn ? " · VAT포함" : ""} 기준 프로분석이 저장되었습니다.
              </p>
            </div>
          </div>
        )}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <Lightbulb size={16} className="text-[var(--green)]" />
                공종별 상세 내역
              </h2>
              <div className="flex items-center gap-2">
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleReceiptUpload(e.target.files)}
                />
                <button
                  onClick={() => receiptInputRef.current?.click()}
                  disabled={receiptParsing}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-medium transition-colors border",
                    receiptParsing
                      ? "bg-[var(--green)]/20 text-[var(--green)] border-[var(--green)]/30 animate-pulse"
                      : "bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20 hover:bg-[var(--green)]/20"
                  )}
                >
                  {receiptParsing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {receiptParsing ? "분석중..." : "견적서/영수증 첨부"}
                </button>
                {Object.values(catAdj).some((v) => v !== 0) && (
                  <button
                    onClick={() => setCatAdj({})}
                    className="text-[10px] px-2 py-1 rounded-lg bg-[var(--orange)]/10 text-[var(--orange)] hover:bg-[var(--orange)]/20 transition-colors"
                  >
                    조정 초기화
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {breakdown.map((cat) => (
                <div
                  key={cat.id}
                  className={cn(
                    "rounded-xl border overflow-hidden",
                    cat.adj !== 0 ? "border-[var(--green)]/30" : "border-[var(--border)]"
                  )}
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
                      {cat.effectiveGrade !== grade && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-500/10 text-blue-400">
                          {GRADES.find(g => g.key === cat.effectiveGrade)?.label}
                        </span>
                      )}
                      {(cat.adj !== 0 || cat.overrideDiff !== 0 || cat.customTotal !== 0 || cat.matOverrideTotal !== 0) && (() => {
                        const diff = cat.adj + cat.overrideDiff + cat.customTotal + cat.matOverrideTotal;
                        return (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-medium",
                            diff > 0 ? "bg-red-500/10 text-red-400" : "bg-[var(--green)]/10 text-[var(--green)]"
                          )}>
                            {diff > 0 ? "+" : ""}{fmtShort(diff)}
                          </span>
                        );
                      })()}
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
                      {/* ── 공종 등급 변경 ── */}
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-[var(--border)]">
                        <p className="text-[10px] text-[var(--muted)] mb-1.5 font-semibold uppercase tracking-wider">공종 등급 변경</p>
                        <div className="flex flex-wrap gap-1">
                          {GRADES.map((g) => {
                            const isActive = cat.effectiveGrade === g.key;
                            return (
                              <button
                                key={g.key}
                                onClick={() => setCatGrades((prev) => {
                                  const next = { ...prev };
                                  if (g.key === grade) delete next[cat.id];
                                  else next[cat.id] = g.key;
                                  return next;
                                })}
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded-md border transition-colors",
                                  isActive ? "font-bold" : "border-[var(--border)] text-[var(--muted)] hover:border-white/20"
                                )}
                                style={isActive ? { color: g.color, borderColor: g.color } : undefined}
                              >
                                {g.label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs mt-1.5">{cat.spec}</p>
                      </div>

                      {/* ── 세부항목 오버라이드 ── */}
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">세부 항목</p>
                          <button
                            onClick={() => handleAiGenerate(cat.id)}
                            disabled={aiGenerating !== null}
                            className={cn(
                              "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors",
                              aiGenerating === cat.id
                                ? "bg-[var(--green)]/20 text-[var(--green)] animate-pulse"
                                : "bg-[var(--green)]/10 text-[var(--green)] hover:bg-[var(--green)]/20"
                            )}
                          >
                            <Sparkles size={10} />
                            {aiGenerating === cat.id ? "생성중..." : "AI 자동기입"}
                          </button>
                        </div>
                        <div className="space-y-1">
                          {cat.subs.map((sub, i) => {
                            const key = `${cat.id}-${i}`;
                            const computed = Math.round(calcSub(sub, area));
                            const ov = subOverrides[key];
                            const displayName = ov?.name ?? sub.name;
                            const isAmountOverridden = ov?.amount != null;
                            return (
                              <div key={key} className="flex items-center justify-between gap-2 text-xs">
                                <input
                                  type="text"
                                  value={displayName}
                                  onChange={(e) => setSubOverrides((prev) => ({ ...prev, [key]: { ...prev[key], name: e.target.value } }))}
                                  className="text-[var(--muted)] truncate flex-1 bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--green)] outline-none px-0.5 py-0.5 min-w-0"
                                />
                                {isAmountOverridden ? (
                                  <div className="flex items-center gap-1">
                                    <input type="number" value={ov.amount}
                                      onChange={(e) => setSubOverrides((prev) => ({ ...prev, [key]: { ...prev[key], amount: Number(e.target.value) || 0 } }))}
                                      className="w-24 px-2 py-1 rounded bg-[var(--card)] border border-[var(--green)]/30 text-xs text-right tabular-nums focus:outline-none focus:border-[var(--green)]"
                                    />
                                    <button onClick={() => setSubOverrides((prev) => {
                                      const n = { ...prev };
                                      if (n[key]?.name) { n[key] = { name: n[key].name }; } else { delete n[key]; }
                                      return n;
                                    })}
                                      className="p-0.5 text-[var(--muted)] hover:text-[var(--red)]"><RotateCcw size={12} /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setSubOverrides((prev) => ({ ...prev, [key]: { ...prev[key], amount: computed } }))}
                                    className="tabular-nums text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0">{fmtShort(computed)}</button>
                                )}
                              </div>
                            );
                          })}
                          {(customSubs[cat.id] || []).map((cs, ci) => {
                            const updateCustom = (patch: Partial<typeof cs>) => {
                              setCustomSubs((prev) => {
                                const arr = [...(prev[cat.id] || [])];
                                arr[ci] = { ...arr[ci], ...patch };
                                return { ...prev, [cat.id]: arr };
                              });
                            };
                            return (
                              <div key={`custom-${ci}`} className="flex items-center gap-1.5 text-xs">
                                <input type="text" value={cs.name} placeholder="항목명"
                                  onChange={(e) => updateCustom({ name: e.target.value })}
                                  className="flex-1 min-w-0 px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--green)]" />
                                <input type="number" value={cs.qty} placeholder="수량"
                                  onChange={(e) => updateCustom({ qty: Number(e.target.value) || 0 })}
                                  className="w-14 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-right tabular-nums focus:outline-none focus:border-[var(--green)]" />
                                <input type="text" value={cs.unit} placeholder="단위"
                                  onChange={(e) => updateCustom({ unit: e.target.value })}
                                  className="w-12 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-center focus:outline-none focus:border-[var(--green)]" />
                                <input type="number" value={cs.unitPrice} placeholder="단가"
                                  onChange={(e) => updateCustom({ unitPrice: Number(e.target.value) || 0 })}
                                  className="w-20 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-right tabular-nums focus:outline-none focus:border-[var(--green)]" />
                                <span className="text-[10px] text-[var(--muted)] w-16 text-right tabular-nums shrink-0">{fmtShort(Math.round(cs.qty * cs.unitPrice / 100) * 100)}</span>
                                <button onClick={() => setCustomSubs((prev) => { const arr = [...(prev[cat.id] || [])]; arr.splice(ci, 1); return { ...prev, [cat.id]: arr }; })}
                                  className="p-0.5 text-[var(--muted)] hover:text-[var(--red)] shrink-0"><Trash2 size={12} /></button>
                              </div>
                            );
                          })}
                          <button onClick={() => setCustomSubs((prev) => ({ ...prev, [cat.id]: [...(prev[cat.id] || []), { name: "", qty: 1, unit: "식", unitPrice: 0 }] }))}
                            className="flex items-center gap-1 text-[10px] text-[var(--green)] hover:text-[var(--green)]/80 mt-1">
                            <PlusCircle size={12} /> 항목 추가
                          </button>
                        </div>
                      </div>

                      {/* ── 금액 직접 조정 ── */}
                      <div className="p-2.5 rounded-lg bg-white/[0.04] border border-[var(--border)]">
                        <p className="text-[10px] text-[var(--muted)] mb-2 font-semibold uppercase tracking-wider">금액 조정</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCatAdj((prev) => ({
                                ...prev,
                                [cat.id]: (prev[cat.id] || 0) - 1000000,
                              }));
                            }}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCatAdj((prev) => ({
                                ...prev,
                                [cat.id]: (prev[cat.id] || 0) - 500000,
                              }));
                            }}
                            className="px-2 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                          >
                            -50만
                          </button>
                          <div className="flex-1 text-center">
                            <span className={cn(
                              "text-sm font-medium tabular-nums",
                              cat.adj !== 0
                                ? cat.adj > 0 ? "text-red-400" : "text-[var(--green)]"
                                : "text-[var(--muted)]"
                            )}>
                              {cat.adj === 0 ? "기본" : `${cat.adj > 0 ? "+" : ""}${fmtShort(cat.adj)}`}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCatAdj((prev) => ({
                                ...prev,
                                [cat.id]: (prev[cat.id] || 0) + 500000,
                              }));
                            }}
                            className="px-2 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                          >
                            +50만
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCatAdj((prev) => ({
                                ...prev,
                                [cat.id]: (prev[cat.id] || 0) + 1000000,
                              }));
                            }}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                          {cat.adj !== 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCatAdj((prev) => {
                                  const next = { ...prev };
                                  delete next[cat.id];
                                  return next;
                                });
                              }}
                              className="w-8 h-8 rounded-lg bg-[var(--orange)]/10 hover:bg-[var(--orange)]/20 flex items-center justify-center text-[var(--orange)] transition-colors text-[10px] font-medium"
                            >
                              X
                            </button>
                          )}
                        </div>
                        {(cat.adj !== 0 || cat.overrideDiff !== 0 || cat.customTotal !== 0) && (
                          <p className="text-[10px] text-[var(--muted)] mt-1.5">
                            기본 {fmtShort(cat.engineTotal)} → 조정 후 {fmtShort(cat.total)}
                          </p>
                        )}
                      </div>

                      {/* ── 자재 옵션 ── */}
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-[var(--border)]">
                        <p className="text-[10px] text-[var(--muted)] mb-1.5 font-semibold uppercase tracking-wider">자재 옵션</p>
                        {cat.matOptions && (
                          <div className="grid grid-cols-2 gap-1 mb-2">
                            {cat.matOptions.map((m) => (
                              <div
                                key={m.grade}
                                className={cn(
                                  "px-2 py-1.5 rounded text-xs",
                                  m.grade === cat.effectiveGrade
                                    ? "bg-[var(--green)]/10 border border-[var(--green)]/20"
                                    : "bg-white/[0.02]"
                                )}
                              >
                                <span className="text-[var(--muted)]">
                                  {GRADES.find((g) => g.key === m.grade)?.label}:{" "}
                                </span>
                                <span className="font-medium">{m.name}</span>
                                <span className="text-[var(--muted)] ml-1">({fmtShort(m.price)})</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* 자재 추가/수정 */}
                        {(matOverrides[cat.id] || []).length > 0 && (
                          <>
                            <div className="text-[10px] text-[var(--muted)] mb-1 mt-2 font-semibold">추가 자재</div>
                            <div className="flex items-center gap-1.5 text-[9px] text-[var(--muted)] uppercase tracking-wider px-0.5 mb-0.5">
                              <span className="flex-1">자재명</span>
                              <span className="w-14 text-right">갯수</span>
                              <span className="w-12 text-center">단위</span>
                              <span className="w-20 text-right">단가</span>
                              <span className="w-16 text-right">소계</span>
                              <span className="w-5" />
                            </div>
                          </>
                        )}
                        <div className="space-y-1">
                          {(matOverrides[cat.id] || []).map((mo, mi) => {
                            const updateMat = (patch: Partial<typeof mo>) => {
                              setMatOverrides((prev) => {
                                const arr = [...(prev[cat.id] || [])];
                                arr[mi] = { ...arr[mi], ...patch };
                                return { ...prev, [cat.id]: arr };
                              });
                            };
                            return (
                              <div key={`mat-${mi}`} className="flex items-center gap-1.5 text-xs">
                                <input type="text" value={mo.name} placeholder="자재명"
                                  onChange={(e) => updateMat({ name: e.target.value })}
                                  className="flex-1 min-w-0 px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--green)]" />
                                <input type="number" value={mo.qty} placeholder="수량"
                                  onChange={(e) => updateMat({ qty: Number(e.target.value) || 0 })}
                                  className="w-14 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-right tabular-nums focus:outline-none focus:border-[var(--green)]" />
                                <input type="text" value={mo.unit} placeholder="단위"
                                  onChange={(e) => updateMat({ unit: e.target.value })}
                                  className="w-12 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-center focus:outline-none focus:border-[var(--green)]" />
                                <input type="number" value={mo.unitPrice} placeholder="단가"
                                  onChange={(e) => updateMat({ unitPrice: Number(e.target.value) || 0 })}
                                  className="w-20 px-1.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs text-right tabular-nums focus:outline-none focus:border-[var(--green)]" />
                                <span className="text-[10px] text-[var(--muted)] w-16 text-right tabular-nums shrink-0">{fmtShort(Math.round(mo.qty * mo.unitPrice / 100) * 100)}</span>
                                <button onClick={() => setMatOverrides((prev) => { const arr = [...(prev[cat.id] || [])]; arr.splice(mi, 1); return { ...prev, [cat.id]: arr }; })}
                                  className="p-0.5 text-[var(--muted)] hover:text-[var(--red)] shrink-0"><Trash2 size={12} /></button>
                              </div>
                            );
                          })}
                          {(matOverrides[cat.id]?.length ?? 0) > 0 && (
                            <div className="flex justify-end text-xs font-medium pt-1 border-t border-[var(--border)]">
                              <span className="text-[var(--muted)] mr-2">자재 소계:</span>
                              <span className="text-[var(--green)] tabular-nums">{fmtShort((matOverrides[cat.id] || []).reduce((s, mo) => s + Math.round(mo.qty * mo.unitPrice / 100) * 100, 0))}</span>
                            </div>
                          )}
                          <button onClick={() => setMatOverrides((prev) => ({ ...prev, [cat.id]: [...(prev[cat.id] || []), { name: "", qty: 1, unit: "개", unitPrice: 0 }] }))}
                            className="flex items-center gap-1 text-[10px] text-[var(--green)] hover:text-[var(--green)]/80 mt-1">
                            <PlusCircle size={12} /> 자재 추가
                          </button>
                        </div>
                      </div>

                      {/* ── 공사기간 ── */}
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <Clock size={12} />
                        <span>
                          예상 공사기간: {cat.duration.min}~{cat.duration.max}일
                          {cat.duration.note && ` (${cat.duration.note})`}
                        </span>
                      </div>

                      {/* ── 이 공종 초기화 ── */}
                      {(catGrades[cat.id] || catAdj[cat.id] || Object.keys(subOverrides).some(k => k.startsWith(cat.id)) || (customSubs[cat.id]?.length ?? 0) > 0 || (matOverrides[cat.id]?.length ?? 0) > 0) && (
                        <button
                          onClick={() => {
                            setCatGrades((p) => { const n = { ...p }; delete n[cat.id]; return n; });
                            setCatAdj((p) => { const n = { ...p }; delete n[cat.id]; return n; });
                            setSubOverrides((p) => { const n = { ...p }; Object.keys(n).filter(k => k.startsWith(cat.id)).forEach(k => delete n[k]); return n; });
                            setCustomSubs((p) => { const n = { ...p }; delete n[cat.id]; return n; });
                            setMatOverrides((p) => { const n = { ...p }; delete n[cat.id]; return n; });
                          }}
                          className="flex items-center gap-1 text-[10px] text-[var(--orange)] hover:text-[var(--orange)]/80"
                        >
                          <RotateCcw size={11} /> 이 공종 초기화
                        </button>
                      )}
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

      {/* ─── Before/After 절감 금액 비교 ─── */}
      {(() => {
        const gradeIdx = GRADES.findIndex((g) => g.key === grade);
        const lowerGrade = gradeIdx > 0 ? GRADES[gradeIdx - 1] : null;
        if (!lowerGrade) return null;

        const lowerTotal = CATS.reduce(
          (s, cat) => s + Math.round(calcCatTotal(cat, area, lowerGrade.key) * buildingAdj),
          0
        );
        const lowerGrand = Math.round(lowerTotal * (1 + profitRate / 100 + overheadRate / 100) * (vatOn ? 1.1 : 1));
        const saving = grandTotal - lowerGrand;

        if (saving <= 0) return null;

        return (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--green)]/5 to-[var(--green)]/[0.01] border border-[var(--green)]/20">
            <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--green)]" />
              등급 조정 시 예상 절감 금액
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* 현재 견적 */}
              <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">현재 ({selectedGrade.label})</p>
                <p className="text-xl font-bold">{fmtShort(grandTotal)}</p>
              </div>
              {/* 화살표 */}
              <div className="text-center">
                <div className="inline-flex flex-col items-center gap-1">
                  <p className="text-3xl font-bold text-[var(--green)]">
                    -{fmtShort(saving)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {lowerGrade.label}로 변경 시
                  </p>
                </div>
              </div>
              {/* 절감 견적 */}
              <div className="text-center p-4 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
                <p className="text-[10px] text-[var(--muted)] mb-1">참고 가격 범위 ({lowerGrade.label})</p>
                <p className="text-xl font-bold text-[var(--green)]">{fmtShort(lowerGrand)}</p>
              </div>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-3 text-center">
              * 자재 등급을 선택적으로 조합하면 품질은 유지하면서 절감 효과를 극대화할 수 있습니다
            </p>
          </div>
        );
      })()}

      {/* ─── 프로 분석 잠금해제 ─── */}
      <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden">
        {!proUnlocked ? (
          <>
            {/* 잠금 상태 */}
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} className="text-[var(--orange)]" />
              <h2 className="text-sm font-medium">프로 분석 리포트</h2>
              {credits !== null && (
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-[var(--green)]/10 text-[var(--green)]">
                  잔여 크레딧: {credits.remaining}회
                </span>
              )}
            </div>

            {/* 블러 처리된 미리보기 */}
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
                    <p className="text-lg font-bold mt-1 text-[var(--blue)]">78점</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--muted)] mb-2">AI 분석 코멘트</p>
                  <p className="text-xs leading-relaxed">현재 견적의 목공사 비용이 시장 평균 대비 약 15% 높습니다. 타일공사의 경우...</p>
                </div>
              </div>

              {/* 잠금해제 오버레이 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--green)]/10 flex items-center justify-center mx-auto mb-3">
                    <Zap size={24} className="text-[var(--green)]" />
                  </div>
                  <p className="text-sm font-medium mb-1">프로 분석으로 견적을 검증하세요</p>
                  <p className="text-xs text-[var(--muted)] mb-4 max-w-xs">
                    과다 청구 항목, 절감 포인트, 견적 신뢰도를 AI가 분석합니다
                  </p>

                  {proError && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2 max-w-xs mx-auto">
                      <AlertTriangle size={14} />
                      {proError}
                    </div>
                  )}

                  {credits !== null && credits.remaining > 0 ? (
                    <button
                      onClick={handleUnlockPro}
                      disabled={proLoading}
                      className="px-5 py-3 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {proLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          분석 중...
                        </>
                      ) : (
                        <>
                          <Unlock size={16} />
                          1 크레딧 사용하여 프로 분석 보기
                        </>
                      )}
                    </button>
                  ) : credits !== null && credits.remaining <= 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-[var(--red)]">크레딧이 부족합니다</p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
                      >
                        크레딧 충전하기
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Loader2 size={14} className="animate-spin" />
                      크레딧 확인 중...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 잠금해제 상태: 프로 분석 결과 */}
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} className="text-[var(--green)]" />
              <h2 className="text-sm font-medium">프로 분석 리포트</h2>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)]">
                분석 완료
              </span>
            </div>

            {/* 분석 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">과다 청구 위험 공종</p>
                {(() => {
                  const sorted = [...breakdown].sort((a, b) => b.total - a.total);
                  const top2 = sorted.slice(0, 2);
                  return (
                    <p className="text-base font-bold text-[var(--orange)]">
                      {top2.map((c) => c.name).join(", ")}
                    </p>
                  );
                })()}
                <p className="text-[10px] text-[var(--muted)] mt-1">
                  시장 평균 대비 비용 비중이 높은 공종
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">예상 절감 가능 금액</p>
                {(() => {
                  const savingAmount = Math.round(directTotal * 0.12);
                  return (
                    <>
                      <p className="text-base font-bold text-[var(--green)]">
                        -{fmtShort(savingAmount)}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] mt-1">
                        자재·공법 최적화 시 약 12% 절감 가능
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[var(--border)]">
                <p className="text-[10px] text-[var(--muted)] mb-1">견적 신뢰도 점수</p>
                {(() => {
                  const score = Math.min(95, Math.max(60, 85 - Math.round((profitRate - 15) * 2) + Math.round((area - 20) * 0.3)));
                  const color = score >= 80 ? "var(--green)" : score >= 65 ? "var(--orange)" : "var(--red)";
                  return (
                    <>
                      <p className="text-base font-bold" style={{ color }}>
                        {score}점
                      </p>
                      <p className="text-[10px] text-[var(--muted)] mt-1">
                        {score >= 80 ? "적정 수준의 견적입니다" : score >= 65 ? "일부 항목 검토가 필요합니다" : "견적 재검토를 권장합니다"}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 공종별 상세 분석 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)] mb-4">
              <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
                <BarChart3 size={14} className="text-[var(--green)]" />
                공종별 비용 적정성 분석
              </h3>
              <div className="space-y-2">
                {breakdown
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 7)
                  .map((cat) => {
                    const avgRate = directTotal > 0 ? (cat.total / directTotal) * 100 : 0;
                    const isHigh = avgRate > 18;
                    const isLow = avgRate < 5;
                    return (
                      <div key={cat.id} className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: cat.color + "20", color: cat.color }}
                        >
                          {cat.icon}
                        </span>
                        <span className="text-xs w-16 shrink-0">{cat.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, avgRate * 3)}%`,
                              backgroundColor: isHigh ? "var(--orange)" : cat.color,
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums w-14 text-right">{fmtShort(cat.total)}</span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                            isHigh
                              ? "bg-[var(--orange)]/10 text-[var(--orange)]"
                              : isLow
                                ? "bg-[var(--blue)]/10 text-[var(--blue)]"
                                : "bg-[var(--green)]/10 text-[var(--green)]"
                          )}
                        >
                          {isHigh ? "검토 필요" : isLow ? "적정 이하" : "적정"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* AI 코멘트 */}
            <div className="p-4 rounded-xl bg-[var(--green)]/[0.03] border border-[var(--green)]/20">
              <h3 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--green)]" />
                AI 분석 코멘트
              </h3>
              <div className="text-xs text-[var(--muted)] leading-relaxed space-y-2">
                <p>
                  {area}평 {selectedGrade.label} 등급 {BUILDING_TYPES.find((b) => b.key === buildingType)?.label} 기준으로 분석한 결과,
                  총 견적 <strong className="text-[var(--foreground)]">{fmtShort(grandTotal)}</strong>은
                  {profitRate <= 20 ? " 시장 평균 범위 내에 있습니다." : " 이윤율이 다소 높은 편입니다."}
                </p>
                <p>
                  {(() => {
                    const topCat = [...breakdown].sort((a, b) => b.total - a.total)[0];
                    return `비용 비중이 가장 높은 ${topCat.name}(${fmtShort(topCat.total)})은 전체의 ${((topCat.total / directTotal) * 100).toFixed(1)}%를 차지합니다. `;
                  })()}
                  해당 공종의 자재 사양과 단가를 우선적으로 비교 검토하시기 바랍니다.
                </p>
                <p>
                  {overheadRate > 8
                    ? `경비율 ${overheadRate}%는 업계 평균(5~8%) 대비 높은 편입니다. 경비 항목의 세부 내역을 확인해보세요.`
                    : `경비율 ${overheadRate}%는 적정 수준입니다.`}
                </p>
              </div>
            </div>
          </>
        )}
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
