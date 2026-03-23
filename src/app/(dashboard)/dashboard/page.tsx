"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import {
  Building2,
  Wallet,
  TrendingDown,
  CalendarDays,
  ArrowRight,
  Receipt,
  FileCheck,
  CircleCheck,
  Pencil,
  Plus,
  TrendingUp,
  AlertTriangle,
  Clock,
  PackageOpen,
  ChevronRight,
} from "lucide-react";
import { fmtShort, fmtDate, cn } from "@/lib/utils";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ──

interface DashboardData {
  kpi: {
    activeSites: { count: number; total: number };
    monthlyRevenue: {
      amount: number;
      collectionRate: number;
      lastMonthAmount: number;
      trend: "up" | "down";
    };
    monthlyExpenses: {
      amount: number;
      budgetTotal: number;
      burnRate: number;
      overBudget: boolean;
    };
    weeklySchedule: {
      count: number;
      todayCount: number;
      todayTasks: { category: string; siteName: string | null }[];
    };
  };
  healthScores: {
    siteId: string;
    siteName: string;
    score: number;
    progressScore: number;
    budgetScore: number;
    paymentScore: number;
    issueScore: number;
    responseScore: number;
  }[];
  projectProfits: {
    siteId: string | null;
    name: string | null;
    revenue: number;
    expense: number;
    profit: number;
    profitRate: number;
    isLowMargin: boolean;
    estimateId: string | null;
  }[];
  actionItems: {
    overduePayments: {
      siteId: string | null;
      siteName: string | null;
      type: string;
      amount: number;
      dueDate: string | null;
      daysOverdue: number;
    }[];
    delayedPhases: {
      siteId: string | null;
      siteName: string | null;
      category: string;
      plannedEnd: string | null;
      daysDelayed: number;
      progress: number;
    }[];
    needsOrdering: {
      siteId: string | null;
      siteName: string | null;
      category: string;
      plannedStart: string | null;
    }[];
  };
  recentActivity: {
    id: string;
    type: string;
    message: string;
    date: string;
    icon: string;
    siteId: string | null;
    siteName: string | null;
  }[];
  monthlyTrend?: {
    month: string;
    revenue: number;
    expense: number;
  }[];
}

interface DrilldownData {
  siteId: string;
  siteName: string;
  contractAmount: number;
  totalEstimate: number;
  totalActual: number;
  expectedProfit: number;
  expectedProfitRate: number;
  comparison: {
    category: string;
    estimate: number;
    actual: number;
    diff: number;
    rate: number;
    isOver: boolean;
  }[];
  totalMaterialCost: number;
}

interface Site {
  id: string;
  name: string;
  status: string;
  customerName: string | null;
  startDate: string | null;
  address: string | null;
}

const ACTIVITY_ICONS: Record<string, typeof Wallet> = {
  wallet: Wallet,
  check: CircleCheck,
  receipt: Receipt,
  file: FileCheck,
  edit: Pencil,
};

// ── Mock trend generator (until API supports monthlyTrend) ──

function generateMockTrend(kpi: DashboardData["kpi"]) {
  const now = new Date();
  const months: { month: string; revenue: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getMonth() + 1}월`;
    if (i === 0) {
      months.push({ month: label, revenue: kpi.monthlyRevenue.amount, expense: kpi.monthlyExpenses.amount });
    } else {
      const factor = 0.6 + Math.random() * 0.8;
      const rev = Math.round(kpi.monthlyRevenue.amount * factor);
      const exp = Math.round(kpi.monthlyExpenses.amount * (0.5 + Math.random() * 0.7));
      months.push({ month: label, revenue: rev, expense: exp });
    }
  }
  return months;
}

// ── Health Gauge Component ──

function HealthGauge({ score, size = 80 }: { score: number; size?: number }) {
  const color =
    score >= 70 ? "var(--green)" : score >= 40 ? "var(--orange)" : "var(--red)";
  const radius = (size - 8) / 2;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 12 }}>
      <svg
        width={size}
        height={size / 2 + 4}
        viewBox={`0 0 ${size} ${size / 2 + 4}`}
      >
        {/* Background arc */}
        <path
          d={`M 4 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 4 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ bottom: 0 }}
      >
        <span className="text-lg font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState<DrilldownData | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ])
      .then(([siteData, dashData]) => {
        setSites(siteData);
        setDashboard(dashData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openDrilldown = async (siteId: string | null) => {
    if (!siteId) return;
    setDrilldownLoading(true);
    try {
      const res = await fetch(`/api/dashboard/drilldown?siteId=${siteId}`);
      const data = await res.json();
      setDrilldown(data);
    } catch {
      /* ignore */
    } finally {
      setDrilldownLoading(false);
    }
  };

  const statusCounts: Record<string, number> = {};
  sites.forEach((s) => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });

  if (loading || !dashboard) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const { kpi, healthScores, projectProfits, actionItems, recentActivity } =
    dashboard;

  const hasActions =
    actionItems.overduePayments.length > 0 ||
    actionItems.delayedPhases.length > 0 ||
    actionItems.needsOrdering.length > 0;

  const maxRevenue =
    projectProfits.length > 0
      ? Math.max(...projectProfits.map((p) => p.revenue))
      : 1;

  const trendLabel =
    kpi.monthlyRevenue.trend === "up"
      ? `전월 대비 +${fmtShort(kpi.monthlyRevenue.amount - kpi.monthlyRevenue.lastMonthAmount)}`
      : `전월 대비 -${fmtShort(kpi.monthlyRevenue.lastMonthAmount - kpi.monthlyRevenue.amount)}`;

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "좋은 아침이에요"
      : today.getHours() < 18
        ? "오늘도 화이팅"
        : "수고하셨습니다";
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 ${"일월화수목금토"[today.getDay()]}요일`;

  const monthlyTrend = dashboard.monthlyTrend ?? generateMockTrend(kpi);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{greeting}</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/sites/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={16} />
            현장 등록
          </Link>
          <Link
            href="/estimates/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
          >
            <Plus size={16} />
            견적 작성
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="진행중 현장"
          value={`${kpi.activeSites.count}건`}
          subtitle={`전체 ${kpi.activeSites.total}건`}
          icon={Building2}
        />
        <KPICard
          title="이번달 수금"
          value={fmtShort(kpi.monthlyRevenue.amount)}
          icon={Wallet}
          color="var(--blue)"
          trend={{ direction: kpi.monthlyRevenue.trend, label: trendLabel }}
          badge={`수금률 ${kpi.monthlyRevenue.collectionRate}%`}
        />
        <KPICard
          title="이번달 지출"
          value={fmtShort(kpi.monthlyExpenses.amount)}
          subtitle={`예산 소진 ${kpi.monthlyExpenses.burnRate}%`}
          icon={TrendingDown}
          color="var(--orange)"
          warning={kpi.monthlyExpenses.overBudget}
        />
        <KPICard
          title="이번주 공정"
          value={`${kpi.weeklySchedule.count}건`}
          subtitle={`오늘 ${kpi.weeklySchedule.todayCount}건`}
          icon={CalendarDays}
          color="var(--green)"
        />
      </div>

      {/* Today's Schedule + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays size={18} style={{ color: "var(--green)" }} />
              오늘의 일정
            </h2>
            <Link
              href="/schedule"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          {kpi.weeklySchedule.todayTasks.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-4 text-center">
              오늘 예정된 공정이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {kpi.weeklySchedule.todayTasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] shrink-0" />
                  <span className="text-sm">
                    <span className="font-medium">{task.siteName}</span>
                    <span className="text-[var(--muted)] mx-1.5">·</span>
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Revenue/Expense Trend */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={18} style={{ color: "var(--blue)" }} />
              월별 수금/지출 추이
            </h2>
            <Link
              href="/settlement"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              정산 리포트 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} barGap={2}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  tickFormatter={(v: number) => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${v}`}
                  width={45}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    `${(Number(value) / 10000).toFixed(0)}만원`,
                    name === "revenue" ? "수금" : "지출",
                  ]}
                />
                <Bar dataKey="revenue" fill="var(--green)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--green)]" /> 수금
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--orange)]" /> 지출
            </span>
          </div>
        </div>
      </div>

      {/* Action Items - only show if there are any */}
      {hasActions && (
        <div className="rounded-2xl border border-[var(--orange)]/40 bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} style={{ color: "var(--orange)" }} />
            오늘의 액션 아이템
          </h2>
          <div className="space-y-2">
            {actionItems.overduePayments.map((item, i) => (
              <Link
                key={`pay-${i}`}
                href={item.siteId ? `/sites/${item.siteId}` : "#"}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--red)]/10 flex items-center justify-center shrink-0">
                  <Wallet size={16} style={{ color: "var(--red)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.siteName}</span>{" "}
                    {item.type} 미수금{" "}
                    <span className="text-[var(--red)] font-medium">
                      D+{item.daysOverdue}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {fmtShort(item.amount)} · 납기 {fmtDate(item.dueDate)}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[var(--muted)] shrink-0"
                />
              </Link>
            ))}
            {actionItems.delayedPhases.map((item, i) => (
              <Link
                key={`delay-${i}`}
                href={item.siteId ? `/sites/${item.siteId}` : "#"}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--orange)]/10 flex items-center justify-center shrink-0">
                  <Clock size={16} style={{ color: "var(--orange)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.siteName}</span>{" "}
                    {item.category} 공정 지연{" "}
                    <span className="text-[var(--orange)] font-medium">
                      D+{item.daysDelayed}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    진행률 {item.progress}% · 예정 완료{" "}
                    {fmtDate(item.plannedEnd)}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[var(--muted)] shrink-0"
                />
              </Link>
            ))}
            {actionItems.needsOrdering.map((item, i) => (
              <Link
                key={`order-${i}`}
                href={item.siteId ? `/sites/${item.siteId}` : "#"}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                  <PackageOpen size={16} style={{ color: "var(--blue)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.siteName}</span>{" "}
                    {item.category} 자재 발주 필요
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    공정 시작 {fmtDate(item.plannedStart)}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[var(--muted)] shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Health Score Board */}
      {healthScores.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">현장 헬스 스코어</h2>
            <Link
              href="/sites"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthScores.map((h) => (
              <Link
                key={h.siteId}
                href={`/sites/${h.siteId}`}
                className="rounded-xl border border-[var(--border)] p-4 hover:border-[var(--border-hover)] hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {h.siteName}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <ScoreBar label="공정" score={h.progressScore} max={30} />
                      <ScoreBar label="예산" score={h.budgetScore} max={30} />
                      <ScoreBar label="수금" score={h.paymentScore} max={20} />
                      <ScoreBar
                        label="이슈"
                        score={h.issueScore + h.responseScore}
                        max={20}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <HealthGauge score={h.score} size={72} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Project Profit + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Profit */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">프로젝트별 수익</h2>
            <Link
              href="/settlement"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              정산 리포트 <ArrowRight size={14} />
            </Link>
          </div>
          {projectProfits.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              계약된 프로젝트가 없습니다.
            </p>
          ) : (
            <div className="space-y-5">
              {projectProfits.map((p) => (
                <div
                  key={p.siteId}
                  className={cn(
                    "cursor-pointer rounded-xl p-3 -mx-3 hover:bg-white/[0.02] transition-colors",
                    p.isLowMargin && "ring-1 ring-[var(--red)]/30",
                  )}
                  onClick={() => openDrilldown(p.siteId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.isLowMargin && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--red)]/10 text-[var(--red)]">
                          저마진
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs flex items-center gap-0.5"
                        style={{
                          color:
                            p.profitRate >= 10
                              ? "var(--green)"
                              : "var(--red)",
                        }}
                      >
                        <TrendingUp size={12} />
                        {p.profitRate}%
                      </span>
                      <span className="text-sm font-bold">
                        {fmtShort(p.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-6">
                    {p.expense > 0 && (
                      <div
                        className="rounded-l-lg bg-[var(--blue)] flex items-center justify-center"
                        style={{
                          width: `${Math.max((p.expense / maxRevenue) * 100, 10)}%`,
                        }}
                      >
                        <span className="text-[10px] text-white font-medium truncate px-1">
                          지출 {fmtShort(p.expense)}
                        </span>
                      </div>
                    )}
                    {p.profit > 0 && (
                      <div
                        className={cn(
                          "bg-[var(--green)] flex items-center justify-center",
                          p.expense === 0 ? "rounded-lg" : "rounded-r-lg",
                        )}
                        style={{
                          width: `${Math.max((p.profit / maxRevenue) * 100, 10)}%`,
                        }}
                      >
                        <span className="text-[10px] text-black font-medium truncate px-1">
                          이익 {fmtShort(p.profit)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[var(--muted)]">
                      클릭하여 상세 보기
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      계약 {fmtShort(p.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              최근 활동이 없습니다.
            </p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((a) => {
                const Icon = ACTIVITY_ICONS[a.icon] || CircleCheck;
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-[var(--muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{a.message}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {fmtDate(a.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Site Status + Recent Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">현장 현황</h2>
            <Link
              href="/sites"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          {sites.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              등록된 현장이 없습니다.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03]"
                >
                  <StatusBadge status={status} />
                  <span className="text-lg font-bold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">최근 현장</h2>
            <Link
              href="/sites"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {sites.slice(0, 4).map((site) => (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{site.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {site.customerName || "고객 미지정"}
                  </p>
                </div>
                <StatusBadge status={site.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Drilldown Modal */}
      <Modal
        open={drilldown !== null || drilldownLoading}
        onClose={() => setDrilldown(null)}
        title={
          drilldownLoading
            ? "로딩 중..."
            : `${drilldown?.siteName || ""} 비용 분석`
        }
        maxWidth="max-w-2xl"
      >
        {drilldownLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : drilldown ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">계약금액</p>
                <p className="text-lg font-bold mt-1">
                  {fmtShort(drilldown.contractAmount)}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">실제 지출</p>
                <p className="text-lg font-bold mt-1 text-[var(--orange)]">
                  {fmtShort(drilldown.totalActual)}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">예상 이익</p>
                <p
                  className={cn(
                    "text-lg font-bold mt-1",
                    drilldown.expectedProfit >= 0
                      ? "text-[var(--green)]"
                      : "text-[var(--red)]",
                  )}
                >
                  {fmtShort(drilldown.expectedProfit)}
                  <span className="text-xs font-normal ml-1">
                    ({drilldown.expectedProfitRate}%)
                  </span>
                </p>
              </div>
            </div>

            {/* Category comparison table */}
            <div>
              <h3 className="text-sm font-medium mb-3">공종별 견적 vs 실행</h3>
              <div className="border border-[var(--border)] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-white/[0.02]">
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--muted)]">
                        공종
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">
                        견적가
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">
                        실행가
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">
                        차이
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">
                        소진율
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {drilldown.comparison.map((c) => (
                      <tr
                        key={c.category}
                        className="border-b border-[var(--border)] last:border-b-0"
                      >
                        <td className="px-4 py-2.5 font-medium">
                          {c.category}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {fmtShort(c.estimate)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {fmtShort(c.actual)}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2.5 text-right font-medium",
                            c.isOver
                              ? "text-[var(--red)]"
                              : "text-[var(--green)]",
                          )}
                        >
                          {c.diff >= 0 ? "+" : ""}
                          {fmtShort(c.diff)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              c.rate > 100
                                ? "bg-[var(--red)]/10 text-[var(--red)]"
                                : c.rate > 80
                                  ? "bg-[var(--orange)]/10 text-[var(--orange)]"
                                  : "bg-[var(--green)]/10 text-[var(--green)]",
                            )}
                          >
                            {c.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {drilldown.totalMaterialCost > 0 && (
              <p className="text-xs text-[var(--muted)]">
                * 자재 발주 비용 {fmtShort(drilldown.totalMaterialCost)} 별도
                포함
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// ── Sub-components ──

function ScoreBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color =
    pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--orange)" : "var(--red)";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--muted)] w-6">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-[var(--muted)] w-6 text-right">
        {score}
      </span>
    </div>
  );
}
