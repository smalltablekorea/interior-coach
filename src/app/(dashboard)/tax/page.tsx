"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  AlertCircle,
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  Users,
  Calculator,
  Loader2,
  HardHat,
  Bot,
} from "lucide-react";
import { fmt, fmtShort, fmtDate } from "@/lib/utils";

interface MonthData {
  month: string;
  total: number;
  supply: number;
  vat: number;
}

interface CategoryData {
  category: string;
  total: number;
}

interface CalendarItem {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  status: string;
  description: string | null;
  amount: number | null;
}

interface DashboardData {
  revenueByMonth: MonthData[];
  expensesByMonth: MonthData[];
  expensesByCategory: CategoryData[];
  uncollected: { total: number; count: number };
  upcoming: CalendarItem[];
  summary: {
    yearRevenue: number;
    yearExpense: number;
    yearProfit: number;
    estimatedVat: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  material: "자재비",
  subcontract: "외주인건비",
  salary: "직원인건비",
  vehicle: "차량유지비",
  office: "사무실경비",
  welfare: "접대/복리",
  depreciation: "감가상각",
  transport: "이동/폐기물",
  insurance: "보험/보증",
  other: "기타",
};

const CATEGORY_COLORS: Record<string, string> = {
  material: "var(--blue)",
  subcontract: "var(--green)",
  salary: "var(--orange)",
  vehicle: "var(--purple, #a78bfa)",
  office: "var(--red)",
  welfare: "#f472b6",
  depreciation: "#94a3b8",
  transport: "#fbbf24",
  insurance: "#34d399",
  other: "#6b7280",
};

const TAX_SCHEDULE = [
  { month: 1, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 1, day: 25, title: "부가세 확정신고 (2기)", type: "vat" },
  { month: 2, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 3, day: 10, title: "원천세 신고/납부, 지급명세서 제출", type: "withholding" },
  { month: 3, day: 31, title: "법인세 신고 (법인)", type: "corporate_tax" },
  { month: 4, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 4, day: 25, title: "부가세 예정신고 (1기)", type: "vat" },
  { month: 5, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 5, day: 31, title: "종합소득세 신고 (개인)", type: "income_tax" },
  { month: 6, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 7, day: 10, title: "원천세 신고/납부, 반기별 지급명세서", type: "withholding" },
  { month: 7, day: 25, title: "부가세 확정신고 (1기)", type: "vat" },
  { month: 7, day: 31, title: "재산세 납부", type: "other" },
  { month: 8, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 9, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 9, day: 30, title: "재산세 납부", type: "other" },
  { month: 10, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 10, day: 25, title: "부가세 예정신고 (2기)", type: "vat" },
  { month: 11, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 12, day: 10, title: "원천세 신고/납부", type: "withholding" },
  { month: 12, day: 15, title: "종합부동산세 납부", type: "other" },
];

const TYPE_COLORS: Record<string, string> = {
  vat: "var(--blue)",
  withholding: "var(--orange)",
  income_tax: "var(--green)",
  corporate_tax: "var(--red)",
  insurance: "#a78bfa",
  other: "#6b7280",
};

export default function TaxDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch(`/api/tax?type=dashboard&year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year]);

  // Build upcoming schedule from static + DB
  const upcomingSchedule = useMemo(() => {
    const now = new Date();
    const items: { date: string; title: string; type: string; daysLeft: number; status: string }[] = [];

    TAX_SCHEDULE.forEach((s) => {
      const d = new Date(year, s.month - 1, s.day);
      if (d < now) {
        // Check if it's this year but past — try next year
        const nextD = new Date(year + 1, s.month - 1, s.day);
        const diff = Math.ceil((nextD.getTime() - now.getTime()) / 86400000);
        if (diff <= 90) {
          items.push({ date: nextD.toISOString().slice(0, 10), title: s.title, type: s.type, daysLeft: diff, status: "upcoming" });
        }
      } else {
        const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
        if (diff <= 90) {
          items.push({ date: d.toISOString().slice(0, 10), title: s.title, type: s.type, daysLeft: diff, status: diff <= 7 ? "urgent" : "upcoming" });
        }
      }
    });

    // Add DB calendar items
    data?.upcoming?.forEach((c) => {
      const d = new Date(c.dueDate);
      const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
      items.push({ date: c.dueDate, title: c.title, type: c.type || "other", daysLeft: diff, status: c.status });
    });

    return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 8);
  }, [data, year]);

  // Current month data
  const currentMonth = useMemo(() => {
    const m = new Date().toISOString().slice(0, 7);
    const rev = data?.revenueByMonth?.find((r) => r.month === m);
    const exp = data?.expensesByMonth?.find((r) => r.month === m);
    return {
      revenue: Number(rev?.total || 0),
      expense: Number(exp?.total || 0),
    };
  }, [data]);

  // Previous month for comparison
  const prevMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const m = d.toISOString().slice(0, 7);
    const rev = data?.revenueByMonth?.find((r) => r.month === m);
    const exp = data?.expensesByMonth?.find((r) => r.month === m);
    return {
      revenue: Number(rev?.total || 0),
      expense: Number(exp?.total || 0),
    };
  }, [data]);

  // Monthly chart data (fill 12 months)
  const chartData = useMemo(() => {
    const months: { label: string; revenue: number; expense: number; profit: number }[] = [];
    for (let i = 1; i <= 12; i++) {
      const m = `${year}-${String(i).padStart(2, "0")}`;
      const rev = Number(data?.revenueByMonth?.find((r) => r.month === m)?.total || 0);
      const exp = Number(data?.expensesByMonth?.find((r) => r.month === m)?.total || 0);
      months.push({ label: `${i}월`, revenue: rev, expense: exp, profit: rev - exp });
    }
    return months;
  }, [data, year]);

  const maxChart = useMemo(() => {
    return Math.max(...chartData.map((d) => Math.max(d.revenue, d.expense)), 1);
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  const pctChange = (curr: number, prev: number) => {
    if (!prev) return curr > 0 ? "+100%" : "0%";
    const p = Math.round(((curr - prev) / prev) * 100);
    return p >= 0 ? `+${p}%` : `${p}%`;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">세무/회계</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{year}년 세무/회계 현황</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tax/revenue" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04] transition-colors">
            <TrendingUp size={16} />
            매출
          </Link>
          <Link href="/tax/expenses" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04] transition-colors">
            <TrendingDown size={16} />
            매입/경비
          </Link>
          <Link href="/tax/vendors" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04] transition-colors">
            <Users size={16} />
            거래처
          </Link>
          <Link href="/tax/payroll" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04] transition-colors">
            <HardHat size={16} />
            급여
          </Link>
        </div>
      </div>

      {/* Tax Calendar Timeline */}
      {upcomingSchedule.length > 0 && (
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock size={18} className="text-[var(--blue)]" />
            <h3 className="font-semibold text-sm">세무 일정</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcomingSchedule.map((item, i) => (
              <div
                key={i}
                className={`shrink-0 px-4 py-3 rounded-xl border ${
                  item.status === "urgent" || item.daysLeft <= 7
                    ? "border-[var(--red)]/40 bg-[var(--red)]/5"
                    : item.status === "completed"
                    ? "border-[var(--green)]/30 bg-[var(--green)]/5"
                    : "border-[var(--border)] bg-white/[0.02]"
                }`}
                style={{ minWidth: 160 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[item.type] || "#6b7280" }} />
                  <span className="text-xs text-[var(--muted)]">{fmtDate(item.date)}</span>
                  {item.daysLeft <= 7 && item.daysLeft > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--red)]/10 text-[var(--red)]">
                      D-{item.daysLeft}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium leading-tight">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Monthly Revenue */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)]/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-[var(--green)]" />
            </div>
            <span className="text-xs text-[var(--muted)]">이번 달 매출</span>
          </div>
          <p className="text-lg font-bold">{fmtShort(currentMonth.revenue)}</p>
          <p className={`text-xs mt-1 ${currentMonth.revenue >= prevMonth.revenue ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            전월 대비 {pctChange(currentMonth.revenue, prevMonth.revenue)}
          </p>
        </div>

        {/* Monthly Expense */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--red)]/10 flex items-center justify-center">
              <TrendingDown size={16} className="text-[var(--red)]" />
            </div>
            <span className="text-xs text-[var(--muted)]">이번 달 매입/경비</span>
          </div>
          <p className="text-lg font-bold">{fmtShort(currentMonth.expense)}</p>
          <p className={`text-xs mt-1 ${currentMonth.expense <= prevMonth.expense ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            전월 대비 {pctChange(currentMonth.expense, prevMonth.expense)}
          </p>
        </div>

        {/* Estimated VAT */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--blue)]/10 flex items-center justify-center">
              <Calculator size={16} className="text-[var(--blue)]" />
            </div>
            <span className="text-xs text-[var(--muted)]">예상 부가세</span>
          </div>
          <p className="text-lg font-bold">{fmtShort(data?.summary?.estimatedVat || 0)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">올해 누적</p>
        </div>

        {/* Uncollected */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--orange)]/10 flex items-center justify-center">
              <AlertCircle size={16} className="text-[var(--orange)]" />
            </div>
            <span className="text-xs text-[var(--muted)]">미수금</span>
          </div>
          <p className="text-lg font-bold">{fmtShort(data?.uncollected?.total || 0)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{data?.uncollected?.count || 0}건</p>
        </div>
      </div>

      {/* Year Summary Card */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <h3 className="font-semibold mb-4">{year}년 누적 현황</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-[var(--muted)] mb-1">총 매출</p>
            <p className="text-xl font-bold text-[var(--green)]">{fmtShort(data?.summary?.yearRevenue || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)] mb-1">총 매입/경비</p>
            <p className="text-xl font-bold text-[var(--red)]">{fmtShort(data?.summary?.yearExpense || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)] mb-1">순이익</p>
            <p className={`text-xl font-bold ${(data?.summary?.yearProfit || 0) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
              {fmtShort(data?.summary?.yearProfit || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <h3 className="font-semibold mb-4">월별 매출/매입 추이</h3>
        <div className="flex items-end gap-1 h-40">
          {chartData.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: 120 }}>
                <div
                  className="flex-1 rounded-t bg-[var(--green)]/60 transition-all"
                  style={{ height: `${(d.revenue / maxChart) * 100}%`, minHeight: d.revenue > 0 ? 2 : 0 }}
                  title={`매출: ${fmt(d.revenue)}`}
                />
                <div
                  className="flex-1 rounded-t bg-[var(--red)]/60 transition-all"
                  style={{ height: `${(d.expense / maxChart) * 100}%`, minHeight: d.expense > 0 ? 2 : 0 }}
                  title={`매입: ${fmt(d.expense)}`}
                />
              </div>
              <span className="text-[10px] text-[var(--muted)]">{d.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[var(--green)]/60" />
            <span className="text-xs text-[var(--muted)]">매출</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[var(--red)]/60" />
            <span className="text-xs text-[var(--muted)]">매입/경비</span>
          </div>
        </div>
      </div>

      {/* Expense by Category */}
      {data?.expensesByCategory && data.expensesByCategory.length > 0 && (
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h3 className="font-semibold mb-4">경비 카테고리별 비중</h3>
          <div className="space-y-2">
            {(() => {
              const total = data.expensesByCategory.reduce((s, c) => s + Number(c.total), 0);
              return data.expensesByCategory
                .sort((a, b) => Number(b.total) - Number(a.total))
                .map((c) => {
                  const pct = total > 0 ? (Number(c.total) / total) * 100 : 0;
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="text-sm w-24 shrink-0">{CATEGORY_LABELS[c.category] || c.category}</span>
                      <div className="flex-1 h-6 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: CATEGORY_COLORS[c.category] || "#6b7280", opacity: 0.7 }}
                        />
                      </div>
                      <span className="text-sm font-medium w-20 text-right tabular-nums">{fmtShort(Number(c.total))}</span>
                      <span className="text-xs text-[var(--muted)] w-12 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/tax/revenue" className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--green)]/10 flex items-center justify-center">
            <DollarSign size={20} className="text-[var(--green)]" />
          </div>
          <div>
            <p className="text-sm font-medium">매출 관리</p>
            <p className="text-xs text-[var(--muted)]">매출 등록/조회</p>
          </div>
        </Link>
        <Link href="/tax/expenses" className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--red)]/10 flex items-center justify-center">
            <Receipt size={20} className="text-[var(--red)]" />
          </div>
          <div>
            <p className="text-sm font-medium">매입/경비</p>
            <p className="text-xs text-[var(--muted)]">경비 등록/영수증 분석</p>
          </div>
        </Link>
        <Link href="/tax/vendors" className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center">
            <Users size={20} className="text-[var(--blue)]" />
          </div>
          <div>
            <p className="text-sm font-medium">거래처 관리</p>
            <p className="text-xs text-[var(--muted)]">거래처 등록/조회</p>
          </div>
        </Link>
        <Link href="/tax/invoices" className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center">
            <FileText size={20} className="text-[var(--orange)]" />
          </div>
          <div>
            <p className="text-sm font-medium">세금계산서</p>
            <p className="text-xs text-[var(--muted)]">발행/수취 관리</p>
          </div>
        </Link>
        <Link href="/tax/payroll" className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <HardHat size={20} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium">급여 관리</p>
            <p className="text-xs text-[var(--muted)]">급여/원천징수 관리</p>
          </div>
        </Link>
        <Link href="/tax/ai-advisor" className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Bot size={20} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-medium">AI 세무상담</p>
            <p className="text-xs text-[var(--muted)]">세무/회계 AI 상담</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
