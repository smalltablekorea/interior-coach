"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp, TrendingDown, Wallet, Receipt, AlertTriangle,
  ArrowRight, Target, Banknote, PieChart, BarChart3,
  Calendar, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { fmtShort, cn } from "@/lib/utils";

const RechartsChart = dynamic(
  () => import("recharts").then((mod) => {
    const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } = mod;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fmt = ((value: any) => fmtShort(Number(value))) as any;
    // eslint-disable-next-line react/display-name
    return ({ data, type }: { data: MonthlyTrend[]; type: "area" | "bar" }) => {
      if (type === "area") {
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v) => v.slice(5) + "월"} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v) => fmtShort(v)} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                formatter={fmt}
                labelFormatter={(label) => label.slice(5) + "월"}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--green)" fill="url(#revGrad)" strokeWidth={2} name="매출" />
              <Area type="monotone" dataKey="expense" stroke="var(--red)" fill="url(#expGrad)" strokeWidth={2} name="비용" />
            </AreaChart>
          </ResponsiveContainer>
        );
      }
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v) => v.slice(5) + "월"} />
            <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v) => fmtShort(v)} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              formatter={fmt}
              labelFormatter={(label) => label.slice(5) + "월"}
            />
            <Legend />
            <Bar dataKey="revenue" fill="var(--green)" name="매출" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--red)" name="비용" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="var(--blue)" name="순이익" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[280px] animate-shimmer rounded-xl" /> },
);

// ── Types ──

interface MonthlyTrend {
  month: string;
  revenue: number;
  expense: number;
  materialCost: number;
  profit: number;
}

interface ProjectProfit {
  siteId: string;
  name: string;
  status: string;
  revenue: number;
  expense: number;
  profit: number;
  profitRate: number;
}

interface Receivable {
  siteId: string | null;
  siteName: string | null;
  type: string;
  amount: number;
  dueDate: string | null;
  isOverdue: boolean;
  daysOverdue: number;
}

interface ExpenseCategory {
  category: string;
  total: number;
  count: number;
}

interface CashFlowForecast {
  month: string;
  expectedRevenue: number;
  expectedExpense: number;
  netCashFlow: number;
}

interface KpiSummary {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  thisMonthExpense: number;
  thisMonthProfit: number;
  totalContractValue: number;
  totalCostValue: number;
  totalProfitValue: number;
  avgProfitRate: number;
  totalUnpaid: number;
  overdueAmount: number;
  annualTarget: number;
  ytdRevenue: number;
  targetProgress: number;
  expectedProgress: number;
}

interface FinanceData {
  kpiSummary: KpiSummary;
  monthlyTrend: MonthlyTrend[];
  projectProfits: ProjectProfit[];
  receivables: Receivable[];
  expenseByCategory: ExpenseCategory[];
  cashFlowForecast: CashFlowForecast[];
}

// ── KPI Card ──

function KpiCard({
  icon: Icon,
  label,
  value,
  subLabel,
  subValue,
  color = "var(--green)",
  trend,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  subLabel?: string;
  subValue?: string;
  color?: string;
  trend?: "up" | "down" | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-hover)] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs text-[var(--muted)]">{label}</span>
        {trend && (
          <div className={cn("ml-auto flex items-center gap-0.5 text-xs font-medium", trend === "up" ? "text-[var(--green)]" : "text-[var(--red)]")}>
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </div>
        )}
      </div>
      <p className="text-xl font-bold">{value}</p>
      {subLabel && (
        <p className="text-[10px] text-[var(--muted)] mt-1">
          {subLabel} <span className="font-medium text-[var(--foreground)]">{subValue}</span>
        </p>
      )}
    </div>
  );
}

// ── Progress Bar ──

function ProgressBar({ value, max, color = "var(--green)", label }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--muted)]">{label}</span>
          <span className="text-xs font-medium">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Category Colors ──

const CATEGORY_COLORS: Record<string, string> = {
  "자재비": "#3b82f6",
  "인건비": "#f59e0b",
  "운반비": "#8b5cf6",
  "장비비": "#06b6d4",
  "기타": "#6b7280",
};

// ── Main Page ──

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  useEffect(() => {
    apiFetch("/api/finance/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.kpiSummary) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}
        </div>
        <div className="h-[340px] rounded-2xl animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-64 rounded-2xl animate-shimmer" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--muted)]">
        <p>데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { kpiSummary: kpi, monthlyTrend, projectProfits, receivables, expenseByCategory, cashFlowForecast } = data;

  const totalExpenseThisMonth = expenseByCategory.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up stagger-1">
        <div>
          <h1 className="text-2xl font-bold">재무 대시보드</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">실시간 매출/비용/수익 분석</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/settlement"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)] transition-colors"
          >
            <BarChart3 size={14} />
            정산 상세
          </Link>
          <Link
            href="/tax"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)] transition-colors"
          >
            <Receipt size={14} />
            세무
          </Link>
        </div>
      </div>

      {/* ══ KPI Cards ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-up stagger-2">
        <KpiCard
          icon={TrendingUp}
          label="이번 달 매출"
          value={fmtShort(kpi.thisMonthRevenue)}
          subLabel="전월 대비"
          subValue={`${kpi.revenueGrowth >= 0 ? "+" : ""}${kpi.revenueGrowth}%`}
          color="var(--green)"
          trend={kpi.revenueGrowth >= 0 ? "up" : "down"}
        />
        <KpiCard
          icon={Receipt}
          label="이번 달 비용"
          value={fmtShort(kpi.thisMonthExpense)}
          color="var(--red)"
        />
        <KpiCard
          icon={Banknote}
          label="이번 달 순이익"
          value={fmtShort(kpi.thisMonthProfit)}
          subLabel="평균 마진율"
          subValue={`${kpi.avgProfitRate}%`}
          color={kpi.thisMonthProfit >= 0 ? "var(--green)" : "var(--red)"}
          trend={kpi.thisMonthProfit >= 0 ? "up" : "down"}
        />
        <KpiCard
          icon={AlertTriangle}
          label="미수금 합계"
          value={fmtShort(kpi.totalUnpaid)}
          subLabel="연체"
          subValue={fmtShort(kpi.overdueAmount)}
          color={kpi.overdueAmount > 0 ? "var(--red)" : "var(--orange)"}
        />
        <KpiCard
          icon={Target}
          label="연 목표 달성률"
          value={`${kpi.targetProgress}%`}
          subLabel="기대 달성률"
          subValue={`${kpi.expectedProgress}%`}
          color={kpi.targetProgress >= kpi.expectedProgress ? "var(--green)" : "var(--orange)"}
        />
      </div>

      {/* ══ Annual Target Progress ══ */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 animate-fade-up stagger-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Target size={16} style={{ color: "var(--green)" }} />
            연 매출 목표
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {fmtShort(kpi.ytdRevenue)} / {fmtShort(kpi.annualTarget)}
          </span>
        </div>
        <ProgressBar value={kpi.ytdRevenue} max={kpi.annualTarget} label="YTD 진행률" />
        <div className="mt-2">
          <ProgressBar value={kpi.expectedProgress} max={100} color="var(--muted)" label="기간 경과율" />
        </div>
      </div>

      {/* ══ 매출/비용 트렌드 차트 ══ */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 animate-fade-up stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 size={16} style={{ color: "var(--blue)" }} />
            월별 매출/비용 트렌드
          </h2>
          <div className="flex gap-1 bg-[var(--border)] rounded-lg p-0.5">
            <button
              onClick={() => setChartType("area")}
              className={cn("px-3 py-1 rounded-md text-xs transition-colors", chartType === "area" ? "bg-[var(--card)] text-white" : "text-[var(--muted)]")}
            >
              영역
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={cn("px-3 py-1 rounded-md text-xs transition-colors", chartType === "bar" ? "bg-[var(--card)] text-white" : "text-[var(--muted)]")}
            >
              막대
            </button>
          </div>
        </div>
        <RechartsChart data={monthlyTrend} type={chartType} />
      </div>

      {/* ══ 2-Column: 현장별 수익 + 비용 분석 ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-5">
        {/* 현장별 수익 분석 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Wallet size={16} style={{ color: "var(--green)" }} />
            현장별 수익 분석
          </h2>
          {projectProfits.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-8 text-center">계약 데이터가 없습니다</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {projectProfits.slice(0, 10).map((p) => (
                <Link
                  key={p.siteId}
                  href={`/sites/${p.siteId}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        p.status === "시공중" ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--muted)]/10 text-[var(--muted)]"
                      )}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[var(--muted)]">계약 {fmtShort(p.revenue)}</span>
                      <span className="text-xs text-[var(--muted)]">비용 {fmtShort(p.expense)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold", p.profitRate >= 15 ? "text-[var(--green)]" : p.profitRate >= 0 ? "text-[var(--orange)]" : "text-[var(--red)]")}>
                      {p.profitRate}%
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">{fmtShort(p.profit)}</p>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)] opacity-0 group-hover:opacity-100 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 비용 카테고리 분석 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <PieChart size={16} style={{ color: "var(--orange)" }} />
            이번 달 비용 카테고리
          </h2>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-8 text-center">이번 달 지출 내역이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory
                .sort((a, b) => b.total - a.total)
                .map((cat) => {
                  const pct = totalExpenseThisMonth > 0 ? Math.round((cat.total / totalExpenseThisMonth) * 100) : 0;
                  const color = CATEGORY_COLORS[cat.category] || "#6b7280";
                  return (
                    <div key={cat.category} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-sm">{cat.category}</span>
                          <span className="text-[10px] text-[var(--muted)]">{cat.count}건</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{fmtShort(cat.total)}</span>
                          <span className="text-[10px] text-[var(--muted)]">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-sm font-medium">합계</span>
                <span className="text-sm font-bold">{fmtShort(totalExpenseThisMonth)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ 2-Column: 미수금 + 캐시플로우 예측 ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-6">
        {/* 미수금 현황 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: "var(--orange)" }} />
              미수금 현황
            </h2>
            <Link href="/settlement" className="text-xs text-[var(--muted)] hover:text-white flex items-center gap-1">
              상세 <ArrowRight size={12} />
            </Link>
          </div>
          {receivables.length === 0 ? (
            <div className="flex items-center gap-2 py-8 justify-center text-[var(--green)]">
              <Banknote size={16} />
              <span className="text-sm">미수금이 없습니다 👏</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {receivables.slice(0, 10).map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border",
                    r.isOverdue
                      ? "border-[var(--red)]/20 bg-[var(--red)]/5"
                      : "border-[var(--border)]",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.siteName}</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {r.type} · {r.dueDate ? `납기 ${r.dueDate}` : "납기 미정"}
                      {r.isOverdue && (
                        <span className="text-[var(--red)] ml-1 font-medium">({r.daysOverdue}일 연체)</span>
                      )}
                    </p>
                  </div>
                  <span className={cn("text-sm font-bold shrink-0", r.isOverdue ? "text-[var(--red)]" : "")}>
                    {fmtShort(r.amount)}
                  </span>
                </div>
              ))}
              {receivables.length > 10 && (
                <p className="text-xs text-center text-[var(--muted)] py-2">+{receivables.length - 10}건 더</p>
              )}
            </div>
          )}
        </div>

        {/* 캐시플로우 예측 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Calendar size={16} style={{ color: "var(--blue)" }} />
            3개월 캐시플로우 예측
          </h2>
          <p className="text-[10px] text-[var(--muted)] mb-4">최근 3개월 이동 평균 기반 예측</p>
          <div className="space-y-3">
            {cashFlowForecast.map((cf) => (
              <div key={cf.month} className="p-3 rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cf.month.slice(5)}월</span>
                  <span className={cn("text-sm font-bold", cf.netCashFlow >= 0 ? "text-[var(--green)]" : "text-[var(--red)]")}>
                    {cf.netCashFlow >= 0 ? "+" : ""}{fmtShort(cf.netCashFlow)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-[var(--muted)]">
                  <span>예상 매출 {fmtShort(cf.expectedRevenue)}</span>
                  <span>예상 비용 {fmtShort(cf.expectedExpense)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 전체 수익 요약 ══ */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 animate-fade-up stagger-7">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Wallet size={16} style={{ color: "var(--green)" }} />
          전체 수익 요약
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-[var(--muted)] mb-1">총 계약금액</p>
            <p className="text-lg font-bold">{fmtShort(kpi.totalContractValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--muted)] mb-1">총 투입비용</p>
            <p className="text-lg font-bold text-[var(--red)]">{fmtShort(kpi.totalCostValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--muted)] mb-1">총 수익</p>
            <p className={cn("text-lg font-bold", kpi.totalProfitValue >= 0 ? "text-[var(--green)]" : "text-[var(--red)]")}>
              {fmtShort(kpi.totalProfitValue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--muted)] mb-1">평균 마진율</p>
            <p className={cn("text-lg font-bold", kpi.avgProfitRate >= 15 ? "text-[var(--green)]" : kpi.avgProfitRate >= 0 ? "text-[var(--orange)]" : "text-[var(--red)]")}>
              {kpi.avgProfitRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
