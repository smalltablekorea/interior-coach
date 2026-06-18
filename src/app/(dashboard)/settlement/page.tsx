"use client";

import { useEffect, useState } from "react";
import { fmtShort, fmtDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import KPICard from "@/components/ui/KPICard";

interface SettlementSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitRate: number;
}

interface SiteListItem {
  siteId: string;
  siteName: string;
  status: string;
  contractAmount: number;
}

interface SiteDetail {
  site: { id: string; name: string; status: string };
  financials: {
    contractAmount: number;
    estimateAmount: number;
    totalExpense: number;
    materialExpense: number;
    otherExpenses: { category: string; total: number; count: number }[];
    collected: number;
    outstanding: number;
    profit: number;
    profitRate: number;
    budgetVariance: number;
  };
  payments: {
    type: string;
    amount: number;
    dueDate: string | null;
    paidDate: string | null;
    status: string;
  }[];
  progress: { totalPhases: number; completedPhases: number; avgProgress: number };
}

export default function SettlementPage() {
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [siteList, setSiteList] = useState<SiteListItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1단계: 요약 + 현장 목록
  useEffect(() => {
    fetch("/api/reports/settlement", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const payload = data?.data ?? data; // ok() 래퍼 / 원시 응답 모두 호환
        setSummary(payload?.summary ?? null);
        const sites: SiteListItem[] = payload?.sites ?? [];
        setSiteList(sites);
        if (sites.length > 0) setSelectedSiteId(sites[0].siteId);
        setLoading(false);
      })
      .catch((e) => {
        console.error("[settlement] summary fetch failed", e);
        setError("정산 데이터를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  // 2단계: 선택된 현장 상세
  useEffect(() => {
    if (!selectedSiteId) return;
    setDetailLoading(true);
    fetch(`/api/reports/settlement?siteId=${selectedSiteId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const payload = (data?.data ?? data) as SiteDetail;
        setDetail(payload);
        setDetailLoading(false);
      })
      .catch((e) => {
        console.error("[settlement] detail fetch failed", e);
        setDetail(null);
        setDetailLoading(false);
      });
  }, [selectedSiteId]);

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

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">정산 리포트</h1>
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (siteList.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">정산 리포트</h1>
        <div className="p-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center text-sm text-[var(--muted)]">
          <BarChart3 size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-base">아직 등록된 현장이 없습니다.</p>
          <p className="mt-1 text-xs opacity-70">
            현장을 등록하고 견적·계약·지출을 입력하시면 정산 리포트가 자동으로 집계됩니다.
          </p>
        </div>
      </div>
    );
  }

  const fin = detail?.financials;
  const totalContract = siteList.reduce((s, sl) => s + (sl.contractAmount || 0), 0);
  const profitGaugeDeg = fin ? Math.min(Math.max(fin.profitRate, 0), 50) * 3.6 : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold">정산 리포트</h1>

      {/* 전체 KPI (요약) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 계약액"
          value={fmtShort(totalContract)}
          subtitle={`${siteList.length}건`}
          icon={Wallet}
        />
        <KPICard
          title="기간 매출(수금)"
          value={fmtShort(summary?.totalRevenue ?? 0)}
          icon={TrendingDown}
          color="var(--blue)"
        />
        <KPICard
          title="기간 지출"
          value={fmtShort(summary?.totalExpenses ?? 0)}
          icon={TrendingDown}
          color="var(--orange)"
        />
        <KPICard
          title="기간 순이익"
          value={fmtShort(summary?.netProfit ?? 0)}
          subtitle={`${summary?.profitRate ?? 0}%`}
          icon={TrendingUp}
          color="var(--green)"
        />
      </div>

      {/* 현장 선택 */}
      <div className="flex gap-2 flex-wrap">
        {siteList.map((s) => (
          <button
            key={s.siteId}
            onClick={() => setSelectedSiteId(s.siteId)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              selectedSiteId === s.siteId
                ? "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {s.siteName}
            <span className="ml-2 text-[10px] opacity-70">{s.status}</span>
          </button>
        ))}
      </div>

      {/* 현장 상세 */}
      {detailLoading && !detail ? (
        <div className="h-48 rounded-2xl animate-shimmer" />
      ) : !fin ? (
        <div className="p-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center text-sm text-[var(--muted)]">
          상세 데이터를 불러오지 못했습니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 이익률 게이지 */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col items-center">
              <h3 className="text-sm text-[var(--muted)] mb-6">이익률</h3>
              <div className="relative w-48 h-24 overflow-hidden">
                <div
                  className="absolute inset-0 rounded-t-full border-[12px] border-white/[0.06]"
                  style={{ borderBottomColor: "transparent", borderBottomWidth: 0 }}
                />
                <div
                  className="absolute inset-0 rounded-t-full border-[12px]"
                  style={{
                    borderColor: fin.profitRate >= 0 ? "var(--green)" : "var(--red)",
                    borderBottomColor: "transparent",
                    borderBottomWidth: 0,
                    clipPath: `polygon(0 100%, 0 0, ${50 + profitGaugeDeg / 3.6}% 0, 50% 100%)`,
                  }}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                  <div className={`text-3xl font-bold ${fin.profitRate >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {fin.profitRate}%
                  </div>
                </div>
              </div>
              <div className="mt-6 w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">계약액</span>
                  <span className="font-medium">{fmtShort(fin.contractAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">총 지출</span>
                  <span className="font-medium text-[var(--orange)]">{fmtShort(fin.totalExpense)}</span>
                </div>
                {fin.materialExpense > 0 && (
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <span>· 자재비</span>
                    <span>{fmtShort(fin.materialExpense)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-2">
                  <span className="font-medium">순이익</span>
                  <span className={`font-bold ${fin.profit >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {fmtShort(fin.profit)}
                  </span>
                </div>
              </div>
            </div>

            {/* 카테고리별 지출 */}
            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm text-[var(--muted)] mb-4">공종/카테고리별 지출</h3>
              {fin.otherExpenses.length === 0 && fin.materialExpense === 0 ? (
                <div className="py-10 text-center text-sm text-[var(--muted)]">
                  <BarChart3 size={28} className="mx-auto mb-3 opacity-40" />
                  <p>지출 데이터가 없습니다.</p>
                  <p className="text-xs mt-1 opacity-70">
                    지출·자재 발주를 입력하면 카테고리별로 자동 집계됩니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const max = Math.max(fin.materialExpense, ...fin.otherExpenses.map((e) => e.total), 1);
                    return (
                      <>
                        {fin.materialExpense > 0 && (
                          <CategoryBar name="자재" amount={fin.materialExpense} max={max} count={undefined} />
                        )}
                        {fin.otherExpenses.map((e) => (
                          <CategoryBar
                            key={e.category}
                            name={e.category || "(미분류)"}
                            amount={e.total}
                            max={max}
                            count={e.count}
                          />
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}

              {fin.estimateAmount > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">견적({fmtShort(fin.estimateAmount)}) 대비</span>
                  <span className={fin.budgetVariance > 0 ? "text-[var(--red)]" : "text-[var(--green)]"}>
                    {fin.budgetVariance > 0 ? "초과" : "절감"} {fmtShort(Math.abs(fin.budgetVariance))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 수금 현황 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="text-sm text-[var(--muted)] mb-4">수금 현황</h3>
            {detail.payments.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--muted)]">
                계약 결제 일정이 없습니다.
                <p className="text-xs mt-1 opacity-70">
                  계약을 등록하고 계약금/중도금/잔금을 입력하면 자동 표시됩니다.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {detail.payments.map((p, idx) => (
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
                        {p.paidDate
                          ? `${fmtDate(p.paidDate)} 수금`
                          : p.dueDate
                            ? `${fmtDate(p.dueDate)} 예정`
                            : "미정"}
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
                          width: `${fin.contractAmount > 0 ? Math.min(100, (fin.collected / fin.contractAmount) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {fin.contractAmount > 0
                        ? Math.round((fin.collected / fin.contractAmount) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                  <div className="px-3 py-2 rounded-lg bg-[var(--green)]/5 border border-[var(--green)]/15">
                    <span className="text-[var(--muted)]">수금 완료 </span>
                    <span className="float-right font-medium text-[var(--green)]">{fmtShort(fin.collected)}</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                    <span className="text-[var(--muted)]">미수금 </span>
                    <span className="float-right font-medium text-amber-400">{fmtShort(fin.outstanding)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryBar({
  name, amount, max, count,
}: {
  name: string; amount: number; max: number; count: number | undefined;
}) {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{name}</span>
        <div className="flex items-center gap-2">
          {typeof count === "number" && (
            <span className="text-[10px] text-[var(--muted)]">{count}건</span>
          )}
          <span className="text-xs text-[var(--muted)]">{fmtShort(amount)}</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--green)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
