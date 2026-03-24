"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Package,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    Promise.all([
      fetch("/api/credits").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/credits/analyses").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([creditData, analysesData]) => {
        if (creditData) setCredit(creditData);
        if (Array.isArray(analysesData)) setAnalyses(analysesData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="text-xs text-[var(--muted)] mt-1">분석 이력 및 크레딧 관리</p>
      </div>

      {/* 크레딧 현황 */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--green)]/5 to-[var(--green)]/[0.02] border border-[var(--green)]/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-[var(--green)]" />
              <span className="text-sm font-medium">분석 크레딧</span>
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
              견적코치에서 프로분석 버튼을 눌러 1크레딧으로 분석을 저장하세요
            </p>
            <Link
              href="/estimates/coach"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
            >
              첫 분석 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {analyses.map((a) => {
              const rd = a.resultData as Record<string, unknown> | null;
              const grandTotal = Number(rd?.grandTotal) || 0;
              const breakdownArr = (rd?.breakdown as Array<Record<string, unknown>>) || [];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[var(--muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {a.area}평 · {GRADE_LABELS[a.grade] || a.grade} · {BUILDING_LABELS[a.buildingType || "apt"] || a.buildingType}
                      </p>
                      <span className={cn("text-[10px] font-medium text-[var(--green)]")}>분석 완료</span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {fmtDate(a.createdAt)} · {breakdownArr.length}공종 · {fmtAmount(grandTotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight size={16} className="text-[var(--muted)]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
