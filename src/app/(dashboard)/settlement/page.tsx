"use client";

import { useEffect, useState } from "react";
import { fmtShort, fmt, fmtDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import KPICard from "@/components/ui/KPICard";

interface ProjectSettlement {
  siteId: string;
  siteName: string;
  contractAmount: number;
  totalExpense: number;
  profit: number;
  profitRate: number;
  categories: {
    name: string;
    budget: number;
    actual: number;
    diff: number;
  }[];
  payments: {
    type: string;
    amount: number;
    status: string;
    date: string | null;
  }[];
}

// 더미 데이터 제거 — API에서 실제 데이터 로드

export default function SettlementPage() {
  const [settlements, setSettlements] = useState<ProjectSettlement[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/settlement")
      .then((r) => r.json())
      .then((data) => {
        // API 응답: { summary, sites: [{ siteId, siteName, status, contractAmount }] }
        const siteList = data?.sites || [];
        const mapped: ProjectSettlement[] = siteList.map((s: { siteId: string; siteName: string; contractAmount: number }) => ({
          siteId: s.siteId,
          siteName: s.siteName,
          contractAmount: s.contractAmount || 0,
          totalExpense: 0,
          profit: s.contractAmount || 0,
          profitRate: 0,
          categories: [],
          payments: [],
        }));
        setSettlements(mapped);
        setLoading(false);
      })
      .catch(() => {
        setSettlements([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">정산 리포트</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">정산 리포트</h1>
        <div className="text-center py-20 text-[var(--muted)]">
          정산 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const current = settlements[selectedIdx];
  const totalContract = settlements.reduce((s, p) => s + p.contractAmount, 0);
  const totalExpense = settlements.reduce((s, p) => s + p.totalExpense, 0);
  const totalProfit = settlements.reduce((s, p) => s + p.profit, 0);
  const avgProfitRate = totalContract > 0 ? Math.round((totalProfit / totalContract) * 100 * 10) / 10 : 0;

  // Profit gauge angle calculation (0-100% mapped to circle)
  const gaugePercent = Math.min(current.profitRate / 50, 1); // 50% max
  const gaugeDeg = gaugePercent * 180;

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold">정산 리포트</h1>

      {/* Total KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 계약액"
          value={fmtShort(totalContract)}
          subtitle={`${settlements.length}건`}
          icon={Wallet}
        />
        <KPICard
          title="총 지출"
          value={fmtShort(totalExpense)}
          icon={TrendingDown}
          color="var(--orange)"
        />
        <KPICard
          title="총 이익"
          value={fmtShort(totalProfit)}
          icon={TrendingUp}
          color="var(--green)"
        />
        <KPICard
          title="평균 이익률"
          value={`${avgProfitRate}%`}
          icon={BarChart3}
          color="var(--blue)"
        />
      </div>

      {/* Project Selector */}
      <div className="flex gap-2">
        {settlements.map((s, idx) => (
          <button
            key={s.siteId}
            onClick={() => setSelectedIdx(idx)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              selectedIdx === idx
                ? "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {s.siteName}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profit Gauge */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col items-center">
          <h3 className="text-sm text-[var(--muted)] mb-6">이익률</h3>
          <div className="relative w-48 h-24 overflow-hidden">
            {/* Background arc */}
            <div
              className="absolute inset-0 rounded-t-full border-[12px] border-white/[0.06]"
              style={{ borderBottomColor: "transparent", borderBottomWidth: 0 }}
            />
            {/* Filled arc */}
            <div
              className="absolute inset-0 rounded-t-full border-[12px]"
              style={{
                borderColor: "var(--green)",
                borderBottomColor: "transparent",
                borderBottomWidth: 0,
                clipPath: `polygon(0 100%, 0 0, ${50 + gaugeDeg / 3.6}% 0, 50% 100%)`,
              }}
            />
            {/* Center label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <div className="text-3xl font-bold text-[var(--green)]">{current.profitRate}%</div>
            </div>
          </div>
          <div className="mt-6 w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">계약액</span>
              <span className="font-medium">{fmtShort(current.contractAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">총 지출</span>
              <span className="font-medium text-[var(--orange)]">{fmtShort(current.totalExpense)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2">
              <span className="font-medium">순이익</span>
              <span className="font-bold text-[var(--green)]">{fmtShort(current.profit)}</span>
            </div>
          </div>
        </div>

        {/* Category Budget vs Actual */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm text-[var(--muted)] mb-4">공종별 예산 vs 실제</h3>
          <div className="space-y-3">
            {current.categories.map((cat) => {
              const maxVal = Math.max(cat.budget, cat.actual);
              const budgetPct = maxVal > 0 ? (cat.budget / maxVal) * 100 : 0;
              const actualPct = maxVal > 0 ? (cat.actual / maxVal) * 100 : 0;
              const isSaved = cat.diff > 0;
              const isOver = cat.diff < 0;

              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium w-12">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      {cat.diff !== 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            isSaved
                              ? "bg-[var(--green)]/10 text-[var(--green)]"
                              : "bg-[var(--red)]/10 text-[var(--red)]"
                          }`}
                        >
                          {isSaved ? "절감" : "초과"} {fmtShort(Math.abs(cat.diff))}
                        </span>
                      )}
                      <span className="text-xs text-[var(--muted)] w-16 text-right">
                        {fmtShort(cat.actual)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--muted)] w-8">예산</span>
                      <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--blue)]/60"
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--muted)] w-8">실제</span>
                      <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isOver ? "bg-[var(--red)]" : "bg-[var(--green)]"}`}
                          style={{ width: `${actualPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm text-[var(--muted)] mb-4">수금 현황</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {current.payments.map((p, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-4 border ${
                p.status === "완납"
                  ? "border-[var(--green)]/20 bg-[var(--green)]/5"
                  : "border-[var(--border)] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{p.type}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    p.status === "완납"
                      ? "bg-[var(--green)]/10 text-[var(--green)]"
                      : "bg-[var(--red)]/10 text-[var(--red)]"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-lg font-bold">{fmtShort(p.amount)}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {p.date ? fmtDate(p.date) : "미정"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03]">
          <span className="text-sm text-[var(--muted)]">수금률</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--green)]"
                style={{
                  width: `${current.contractAmount > 0 ? (current.payments.filter((p) => p.status === "완납").reduce((s, p) => s + p.amount, 0) / current.contractAmount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-sm font-bold">
              {current.contractAmount > 0 ? Math.round(
                (current.payments.filter((p) => p.status === "완납").reduce((s, p) => s + p.amount, 0) / current.contractAmount) * 100
              ) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
