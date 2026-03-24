"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Clock,
  Package,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── 타입 ───

interface Analysis {
  id: string;
  createdAt: string;
  address: string;
  areaPyeong: number;
  categoryCount: number;
  totalAmount: number;
  grade: string;
  status: "completed" | "processing" | "pending";
}

interface Credit {
  total: number;
  used: number;
  remaining: number;
}

// ─── 마이페이지 ───

export default function MyPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [credit, setCredit] = useState<Credit>({ total: 0, used: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: API 연동 — 현재는 빈 상태
    const timer = setTimeout(() => {
      setAnalyses([]);
      setCredit({ total: 0, used: 0, remaining: 0 });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const fmtAmount = (n: number) => {
    if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
    return Math.round(n / 10000).toLocaleString() + "만원";
  };

  const STATUS_LABEL: Record<string, { text: string; color: string }> = {
    completed: { text: "분석 완료", color: "text-[var(--green)]" },
    processing: { text: "분석 중", color: "text-amber-500" },
    pending: { text: "결제 대기", color: "text-[var(--muted)]" },
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
            href="/analyze"
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
          분석 이력
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
              견적서를 업로드하면 AI가 공종별 상세 분석을 제공합니다
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
            >
              첫 분석 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {analyses.map((a) => {
              const st = STATUS_LABEL[a.status] || STATUS_LABEL.pending;
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
                      <p className="text-sm font-medium truncate">{a.address}</p>
                      <span className={cn("text-[10px] font-medium", st.color)}>{st.text}</span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {fmtDate(a.createdAt)} · {a.areaPyeong}평 · {a.categoryCount}공종 · {fmtAmount(a.totalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.status === "completed" && (
                      <button
                        className="p-2 rounded-lg hover:bg-white/[0.04] text-[var(--muted)]"
                        title="PDF 다운로드"
                      >
                        <Download size={16} />
                      </button>
                    )}
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
