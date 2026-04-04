"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import {
  Building2,
  Wallet,
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
  ChevronRight,
  Users,
  FileText,
  Sparkles,
  Hammer,
  Package,
  HardHat,
  BarChart3,
  Calculator,
  Settings,
  Zap,
  Target,
  ArrowUpRight,
  Bell,
  Banknote,
  ShieldAlert,
  Activity,
  Check,
  SkipForward,
} from "lucide-react";
import { fmtShort, fmtDate, cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import Link from "next/link";

const MonthlyTrendChart = dynamic(
  () => import("@/components/charts/MonthlyTrendChart"),
  { ssr: false },
);

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
  upcomingMilestones?: {
    type: "payment" | "phase";
    siteId: string | null;
    siteName: string | null;
    label: string;
    date: string | null;
    daysUntil: number;
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
  endDate: string | null;
  address: string | null;
  area?: number | null;
}

const ACTIVITY_ICONS: Record<string, typeof Wallet> = {
  wallet: Wallet,
  check: CircleCheck,
  receipt: Receipt,
  file: FileCheck,
  edit: Pencil,
};

// ── Quick Actions (2×2 핵심 액션) ──

const QUICK_ACTIONS = [
  { href: "/sites/new", icon: Building2, label: "새 프로젝트", color: "var(--green)", desc: "현장 등록" },
  { href: "/estimates/coach", icon: Sparkles, label: "AI 견적", color: "#a855f7", desc: "견적코치" },
  { href: "/schedule/generator", icon: Zap, label: "공정 생성", color: "#ec4899", desc: "AI 공정매니저" },
  { href: "/expenses/new", icon: Receipt, label: "지출 등록", color: "var(--orange)", desc: "지출 기록" },
];

// ── Full Menu Grid ──

const MENU_ITEMS = [
  { href: "/customers", icon: Users, label: "고객", color: "var(--blue)" },
  { href: "/sites", icon: Building2, label: "현장", color: "var(--green)" },
  { href: "/estimates", icon: FileText, label: "견적", color: "var(--orange)" },
  { href: "/contracts", icon: FileCheck, label: "계약", color: "var(--blue)" },
  { href: "/construction", icon: Hammer, label: "시공", color: "var(--orange)" },
  { href: "/schedule", icon: CalendarDays, label: "일정", color: "var(--green)" },
  { href: "/materials", icon: Package, label: "자재", color: "#06b6d4" },
  { href: "/workers", icon: HardHat, label: "작업자", color: "#f59e0b" },
  { href: "/expenses", icon: Receipt, label: "지출", color: "var(--red)" },
  { href: "/settlement", icon: BarChart3, label: "정산", color: "var(--blue)" },
  { href: "/tax", icon: Calculator, label: "세무", color: "#64748b" },
  { href: "/settings", icon: Settings, label: "설정", color: "var(--muted)" },
];

// ── Mock trend generator ──

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
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 12 }}>
      <svg
        width={size}
        height={size / 2 + 4}
        viewBox={`0 0 ${size} ${size / 2 + 4}`}
      >
        <path
          d={`M 4 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
          strokeLinecap="round"
        />
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

// ── Progress Bar ──

function ProgressBar({ value, color = "var(--green)", height = 6 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full bg-[var(--border)] rounded-full overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [todayData, setTodayData] = useState<{
    alerts: { type: string; severity: string; message: string; siteId: string | null; link: string }[];
    tasks: { siteId: string; siteName: string; items: { id: string; type: string; label: string; link: string }[] }[];
    moneySummary: { todayCollectionTotal: number; weekCollectionTotal: number; overdueTotal: number; overdueCount: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState<DrilldownData | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const key = `dashboard-tasks-${new Date().toISOString().slice(0, 10)}`;
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      const key = `dashboard-tasks-${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    Promise.all([
      apiFetch("/api/sites").then((r) => (r.ok ? r.json() : [])),
      apiFetch("/api/dashboard").then((r) => (r.ok ? r.json() : null)),
      apiFetch("/api/dashboard/today").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([siteData, dashData, todayResult]) => {
        setSites(Array.isArray(siteData) ? siteData : []);
        if (dashData?.kpi) setDashboard(dashData);
        if (todayResult?.alerts) setTodayData(todayResult);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 60초 폴링 + 탭 복귀 시 리프레시
  useEffect(() => {
    const refresh = () => {
      apiFetch("/api/dashboard/today").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.alerts) setTodayData(d); });
    };
    const handleVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(refresh, 60000);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibility); };
  }, []);

  const openDrilldown = async (siteId: string | null) => {
    if (!siteId) return;
    setDrilldownLoading(true);
    try {
      const res = await apiFetch(`/api/dashboard/drilldown?siteId=${siteId}`);
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

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-xl animate-shimmer" />
        <div className="h-32 rounded-2xl animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--muted)]">
        <p>데이터를 불러올 수 없습니다. 새로고침 해주세요.</p>
      </div>
    );
  }

  const { kpi, healthScores, projectProfits, actionItems, recentActivity } =
    dashboard;

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

  // Cash Flow 계산
  const netCashFlow = kpi.monthlyRevenue.amount - kpi.monthlyExpenses.amount;
  const maxBar = Math.max(kpi.monthlyRevenue.amount, kpi.monthlyExpenses.amount, 1);
  const revenueBarPct = (kpi.monthlyRevenue.amount / maxBar) * 100;
  const expenseBarPct = (kpi.monthlyExpenses.amount / maxBar) * 100;
  const totalOverdue = actionItems.overduePayments.reduce((s, p) => s + p.amount, 0);

  // 다가오는 일정
  const upcomingMilestones = dashboard.upcomingMilestones ?? [];

  // 프로젝트 진행률 계산 (시공중 현장)
  const activeSitesList = sites.filter((s) => s.status === "시공중");

  return (
    <div className="space-y-6">
      <OnboardingModal />

      {/* ══════════════════════════════════════════════
          1. HEADER
          ══════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up stagger-1">
        <div>
          <h1 className="text-2xl font-bold">{greeting}</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/sites/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={16} />
            새 프로젝트
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          2. 긴급 알림 배너
          ══════════════════════════════════════════════ */}
      {todayData && todayData.alerts.length > 0 ? (
        <div className="space-y-2 animate-fade-up stagger-2">
          {todayData.alerts.slice(0, 4).map((alert, i) => (
            <Link
              key={i}
              href={alert.link}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group",
                alert.severity === "critical"
                  ? "bg-[var(--red)]/5 border border-[var(--red)]/20 hover:bg-[var(--red)]/10"
                  : "bg-[var(--orange)]/5 border border-[var(--orange)]/20 hover:bg-[var(--orange)]/10",
              )}
            >
              {alert.severity === "critical" ? (
                <AlertTriangle size={16} style={{ color: "var(--red)" }} />
              ) : (
                <Bell size={16} style={{ color: "var(--orange)" }} />
              )}
              <span className="text-sm flex-1">{alert.message}</span>
              <ChevronRight size={14} className="text-[var(--muted)] opacity-0 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      ) : todayData && todayData.alerts.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20 animate-fade-up stagger-2">
          <CircleCheck size={16} style={{ color: "var(--green)" }} />
          <span className="text-sm text-[var(--green)]">모든 항목이 정상입니다</span>
          <Link href="/schedule" className="ml-auto text-sm text-[var(--green)] hover:underline flex items-center gap-1 shrink-0">
            일정 확인 <ArrowRight size={14} />
          </Link>
        </div>
      ) : null}

      {/* ══════════════════════════════════════════════
          2.5. 오늘의 할 일 + 돈 현황 (2컬럼)
          ══════════════════════════════════════════════ */}
      {todayData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-2">
          {/* 좌: 오늘의 할 일 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays size={16} style={{ color: "var(--green)" }} />
                오늘의 할 일
                {todayData.tasks.reduce((s, g) => s + g.items.length, 0) > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)]">
                    {todayData.tasks.reduce((s, g) => s + g.items.length, 0)}
                  </span>
                )}
              </h2>
            </div>
            {todayData.tasks.length === 0 ? (
              <div className="text-center py-6">
                <CircleCheck size={24} className="mx-auto text-[var(--green)] opacity-40 mb-2" />
                <p className="text-sm text-[var(--muted)]">오늘 예정된 작업이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayData.tasks.map((group) => (
                  <div key={group.siteId}>
                    <Link href={`/sites/${group.siteId}`} className="text-xs font-medium text-[var(--blue)] hover:underline mb-2 block">
                      ▸ {group.siteName}
                    </Link>
                    <div className="space-y-1 ml-3">
                      {group.items.map((task) => {
                        const done = completedTasks.has(task.id);
                        return (
                          <div key={task.id} className="flex items-center gap-2.5 py-1.5">
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={cn(
                                "w-4.5 h-4.5 rounded border shrink-0 flex items-center justify-center transition-colors",
                                done
                                  ? "bg-[var(--green)] border-[var(--green)]"
                                  : "border-[var(--border)] hover:border-[var(--green)]",
                              )}
                              aria-label={`${task.label} ${done ? "완료 취소" : "완료"}`}
                            >
                              {done && <Check size={10} className="text-black" />}
                            </button>
                            <Link
                              href={task.link}
                              className={cn(
                                "text-sm flex-1 hover:text-[var(--foreground)] transition-colors",
                                done ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]",
                              )}
                            >
                              {task.label}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 우: 돈 현황 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Banknote size={16} style={{ color: "var(--orange)" }} />
                돈 현황
              </h2>
              <Link href="/settlement" className="text-xs text-[var(--green)] hover:underline flex items-center gap-1">
                정산 리포트 <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-[var(--muted)]">오늘 수금 예정</span>
                <span className="text-sm font-bold">{fmtShort(todayData.moneySummary.todayCollectionTotal)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-[var(--muted)]">이번주 수금 예정</span>
                <span className="text-sm font-bold">{fmtShort(todayData.moneySummary.weekCollectionTotal)}</span>
              </div>
              <div className="h-px bg-[var(--border)]" />
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-[var(--muted)]">미수금 총액</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-bold", todayData.moneySummary.overdueTotal > 0 && "text-[var(--red)]")}>
                    {fmtShort(todayData.moneySummary.overdueTotal)}
                  </span>
                  {todayData.moneySummary.overdueCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--red)]/10 text-[var(--red)]">
                      {todayData.moneySummary.overdueCount}건
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-[var(--muted)]">이번달 지출</span>
                <span className="text-sm font-bold">{fmtShort(kpi.monthlyExpenses.amount)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-[var(--muted)]">예산 소진률</span>
                <span className={cn("text-sm font-bold", kpi.monthlyExpenses.overBudget ? "text-[var(--red)]" : "text-[var(--green)]")}>
                  {kpi.monthlyExpenses.burnRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          3. 2×2 STATS GRID
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-up stagger-3">
        <KPICard
          title="진행 프로젝트"
          value={`${kpi.activeSites.count}건`}
          subtitle={`전체 ${kpi.activeSites.total}건`}
          icon={Building2}
          color="var(--blue)"
          href="/sites?status=시공중"
        />
        <KPICard
          title="지연 공정"
          value={`${actionItems.delayedPhases.length}건`}
          subtitle={actionItems.delayedPhases.length > 0 ? "즉시 확인 필요" : "정상 운영 중"}
          icon={ShieldAlert}
          color="var(--red)"
          warning={actionItems.delayedPhases.length > 0}
          href="/construction"
        />
        <KPICard
          title="미수금"
          value={fmtShort(totalOverdue)}
          subtitle={`${actionItems.overduePayments.length}건 연체`}
          icon={Banknote}
          color="var(--orange)"
          warning={actionItems.overduePayments.length > 0}
          href="/settlement"
        />
        <KPICard
          title="예산 집행률"
          value={`${kpi.monthlyExpenses.burnRate}%`}
          subtitle={`이번달 ${fmtShort(kpi.monthlyExpenses.amount)}`}
          icon={Target}
          color={kpi.monthlyExpenses.overBudget ? "var(--red)" : "var(--green)"}
          warning={kpi.monthlyExpenses.overBudget}
          href="/expenses"
        />
      </div>

      {/* ══════════════════════════════════════════════
          4. QUICK ACTIONS 2×2 + 수금 요약
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-4">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-3 h-full">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col items-center justify-center gap-2 hover:border-[var(--border-hover)] transition-all card-lift group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon size={22} style={{ color: action.color }} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-[10px] text-[var(--muted)]">{action.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 수금 요약 카드 */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wallet size={18} style={{ color: "var(--green)" }} />
                이번달 수금/지출
              </h2>
              <Link
                href="/settlement"
                className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
              >
                정산 리포트 <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center">
                <p className="text-xs text-[var(--muted)]">수금</p>
                <p className="text-xl font-bold text-[var(--green)] mt-1">{fmtShort(kpi.monthlyRevenue.amount)}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">수금률 {kpi.monthlyRevenue.collectionRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--muted)]">지출</p>
                <p className="text-xl font-bold text-[var(--orange)] mt-1">{fmtShort(kpi.monthlyExpenses.amount)}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">예산 대비 {kpi.monthlyExpenses.burnRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--muted)]">순수익</p>
                <p className={cn(
                  "text-xl font-bold mt-1",
                  netCashFlow >= 0 ? "text-[var(--green)]" : "text-[var(--red)]",
                )}>
                  {netCashFlow >= 0 ? "+" : ""}{fmtShort(netCashFlow)}
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">{trendLabel}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                  <span>수금</span>
                  <span>{fmtShort(kpi.monthlyRevenue.amount)}</span>
                </div>
                <ProgressBar value={revenueBarPct} color="var(--green)" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                  <span>지출</span>
                  <span>{fmtShort(kpi.monthlyExpenses.amount)}</span>
                </div>
                <ProgressBar value={expenseBarPct} color="var(--orange)" />
              </div>
            </div>

            {totalOverdue > 0 && (
              <Link href="/settlement" className="mt-4 px-3 py-2.5 rounded-xl bg-[var(--red)]/5 flex items-center gap-2 hover:bg-[var(--red)]/10 transition-colors">
                <AlertTriangle size={14} style={{ color: "var(--red)" }} />
                <span className="text-xs flex-1">
                  연체 미수금{" "}
                  <span className="font-bold text-[var(--red)]">{fmtShort(totalOverdue)}</span>
                  {" "}({actionItems.overduePayments.length}건)
                </span>
                <ArrowRight size={14} className="text-[var(--muted)]" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          5. 프로젝트 리스트 (Progress Bars)
          ══════════════════════════════════════════════ */}
      {activeSitesList.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 animate-fade-up stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity size={18} style={{ color: "var(--blue)" }} />
              진행 중인 프로젝트
            </h2>
            <Link
              href="/sites?status=시공중"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {activeSitesList.slice(0, 5).map((site) => {
              const health = healthScores.find((h) => h.siteId === site.id);
              const profit = projectProfits.find((p) => p.siteId === site.id);
              const avgProgress = health ? Math.round(health.score) : 0;
              const dDay = site.endDate
                ? Math.ceil((new Date(site.endDate).getTime() - today.getTime()) / 86400000)
                : null;

              return (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="block rounded-xl border border-[var(--border)] p-4 hover:border-[var(--border-hover)] transition-all card-lift"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{site.name}</p>
                        {dDay !== null && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0",
                            dDay < 0
                              ? "bg-[var(--red)]/10 text-[var(--red)]"
                              : dDay <= 7
                                ? "bg-[var(--orange)]/10 text-[var(--orange)]"
                                : "bg-[var(--blue)]/10 text-[var(--blue)]",
                          )}>
                            {dDay < 0 ? `D+${Math.abs(dDay)}` : `D-${dDay}`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {site.customerName || "고객 미지정"}
                        {site.address && ` · ${site.address.split(" ").slice(0, 2).join(" ")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {profit && (
                        <span className={cn(
                          "text-xs font-medium",
                          profit.profitRate >= 10 ? "text-[var(--green)]" : "text-[var(--red)]",
                        )}>
                          {fmtShort(profit.revenue)}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-[var(--muted)]" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar
                        value={avgProgress}
                        color={avgProgress >= 70 ? "var(--green)" : avgProgress >= 40 ? "var(--orange)" : "var(--red)"}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right" style={{
                      color: avgProgress >= 70 ? "var(--green)" : avgProgress >= 40 ? "var(--orange)" : "var(--red)",
                    }}>
                      {avgProgress}점
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          6. TODAY'S SCHEDULE + MONTHLY TREND
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays size={18} style={{ color: "var(--green)" }} />
              오늘의 일정
              {kpi.weeklySchedule.todayCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--green)]/10 text-[var(--green)]">
                  {kpi.weeklySchedule.todayCount}
                </span>
              )}
            </h2>
            <Link
              href="/schedule"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          {kpi.weeklySchedule.todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--muted)]">오늘 예정된 공정이 없습니다</p>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-1 mt-3 text-sm text-[var(--green)] hover:underline"
              >
                일정 관리 바로가기 <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {kpi.weeklySchedule.todayTasks.map((task, i) => (
                <Link
                  key={i}
                  href="/construction"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] shrink-0" />
                  <span className="text-sm flex-1">
                    <span className="font-medium">{task.siteName}</span>
                    <span className="text-[var(--muted)] mx-1.5">·</span>
                    {task.category}
                  </span>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </Link>
              ))}
            </div>
          )}
        </div>

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
            <MonthlyTrendChart data={monthlyTrend} />
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

      {/* ══════════════════════════════════════════════
          7. UPCOMING MILESTONES + HEALTH SCORES
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-7">
        {/* 다가오는 일정 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={18} style={{ color: "var(--blue)" }} />
              다가오는 일정
            </h2>
            <Link
              href="/schedule"
              className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          {upcomingMilestones.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--muted)]">2주 내 예정된 일정이 없습니다</p>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-1 mt-3 text-sm text-[var(--green)] hover:underline"
              >
                일정 관리 바로가기 <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingMilestones.map((m, i) => (
                <Link
                  key={i}
                  href={m.siteId ? `/sites/${m.siteId}` : "/schedule"}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      m.type === "payment" ? "bg-[var(--green)]/10" : "bg-[var(--blue)]/10",
                    )}
                  >
                    {m.type === "payment" ? (
                      <Wallet size={14} style={{ color: "var(--green)" }} />
                    ) : (
                      <Hammer size={14} style={{ color: "var(--blue)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{m.siteName}</span>{" "}
                      {m.label}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {fmtDate(m.date)}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold shrink-0",
                    m.daysUntil <= 3 ? "bg-[var(--red)]/10 text-[var(--red)]" : "bg-[var(--blue)]/10 text-[var(--blue)]",
                  )}>
                    D-{m.daysUntil}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Health Score Board */}
        {healthScores.length > 0 ? (
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
            <div className="space-y-3">
              {healthScores.slice(0, 3).map((h) => (
                <Link
                  key={h.siteId}
                  href={`/sites/${h.siteId}`}
                  className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3 hover:border-[var(--border-hover)] hover:bg-white/[0.02] transition-all"
                >
                  <div className="shrink-0">
                    <HealthGauge score={h.score} size={64} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.siteName}</p>
                    <div className="mt-2 space-y-1">
                      <ScoreBar label="공정" score={h.progressScore} max={30} />
                      <ScoreBar label="예산" score={h.budgetScore} max={30} />
                      <ScoreBar label="수금" score={h.paymentScore} max={20} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-lg font-semibold mb-4">현장 헬스 스코어</h2>
            <div className="text-center py-8">
              <Target size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--muted)]">시공중인 현장이 생기면 자동으로 표시됩니다</p>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          8. PROJECT PROFIT + RECENT ACTIVITY
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-8">
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
            <div className="text-center py-8">
              <BarChart3 size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--muted)]">계약된 프로젝트가 없습니다</p>
              <Link
                href="/contracts"
                className="inline-flex items-center gap-1 mt-3 text-sm text-[var(--green)] hover:underline"
              >
                계약 관리 바로가기 <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
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
                          color: p.profitRate >= 10 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        <TrendingUp size={12} />
                        {p.profitRate}%
                      </span>
                      <span className="text-sm font-bold">{fmtShort(p.profit)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-5">
                    {p.expense > 0 && (
                      <div
                        className="rounded-l-md bg-[var(--blue)] flex items-center justify-center"
                        style={{
                          width: `${Math.max((p.expense / maxRevenue) * 100, 10)}%`,
                        }}
                      >
                        <span className="text-[9px] text-white font-medium truncate px-1">
                          지출
                        </span>
                      </div>
                    )}
                    {p.profit > 0 && (
                      <div
                        className={cn(
                          "bg-[var(--green)] flex items-center justify-center",
                          p.expense === 0 ? "rounded-md" : "rounded-r-md",
                        )}
                        style={{
                          width: `${Math.max((p.profit / maxRevenue) * 100, 10)}%`,
                        }}
                      >
                        <span className="text-[9px] text-black font-medium truncate px-1">
                          이익
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--muted)] text-right mt-1">
                    계약 {fmtShort(p.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--muted)]">최근 활동이 없습니다</p>
              <Link
                href="/sites/new"
                className="inline-flex items-center gap-1 mt-3 text-sm text-[var(--green)] hover:underline"
              >
                현장을 등록하면 활동이 기록됩니다 <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((a) => {
                const Icon = ACTIVITY_ICONS[a.icon] || CircleCheck;
                const activityLink = a.siteId ? `/sites/${a.siteId}` : "#";
                return (
                  <Link
                    key={a.id}
                    href={activityLink}
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
                    <ChevronRight size={14} className="text-[var(--muted)] mt-1.5 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          9. SITE STATUS + FULL MENU
          ══════════════════════════════════════════════ */}
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
            <div className="text-center py-8">
              <Building2 size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--muted)]">등록된 현장이 없습니다</p>
              <Link
                href="/sites/new"
                className="inline-flex items-center gap-1 mt-3 text-sm text-[var(--green)] hover:underline"
              >
                첫 현장 등록하기 <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Link
                    key={status}
                    href={`/sites?status=${status}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  >
                    <StatusBadge status={status} />
                    <span className="text-lg font-bold">{count}</span>
                  </Link>
                ))}
              </div>
              <div className="space-y-2">
                {sites.slice(0, 3).map((site) => (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{site.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {site.customerName || "고객 미지정"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={site.status} />
                      <ChevronRight size={14} className="text-[var(--muted)]" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 전체 메뉴 바로가기 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">전체 메뉴</h2>
            <button
              onClick={() => setShowAllMenu(!showAllMenu)}
              className="text-sm text-[var(--green)] hover:underline"
            >
              {showAllMenu ? "접기" : "펼치기"}
            </button>
          </div>
          <div className={cn(
            "grid grid-cols-3 sm:grid-cols-4 gap-3 transition-all overflow-hidden",
            showAllMenu ? "max-h-[500px]" : "max-h-[200px]",
          )}>
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          10. DRILLDOWN MODAL
          ══════════════════════════════════════════════ */}
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
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">계약금액</p>
                <p className="text-lg font-bold mt-1">{fmtShort(drilldown.contractAmount)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">실제 지출</p>
                <p className="text-lg font-bold mt-1 text-[var(--orange)]">{fmtShort(drilldown.totalActual)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">예상 이익</p>
                <p
                  className={cn(
                    "text-lg font-bold mt-1",
                    drilldown.expectedProfit >= 0 ? "text-[var(--green)]" : "text-[var(--red)]",
                  )}
                >
                  {fmtShort(drilldown.expectedProfit)}
                  <span className="text-xs font-normal ml-1">({drilldown.expectedProfitRate}%)</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">공종별 견적 vs 실행</h3>
              <div className="border border-[var(--border)] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-white/[0.02]">
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--muted)]">공종</th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">견적가</th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">실행가</th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">차이</th>
                      <th className="text-right px-4 py-2.5 font-medium text-[var(--muted)]">소진율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drilldown.comparison.map((c) => (
                      <tr key={c.category} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="px-4 py-2.5 font-medium">{c.category}</td>
                        <td className="px-4 py-2.5 text-right">{fmtShort(c.estimate)}</td>
                        <td className="px-4 py-2.5 text-right">{fmtShort(c.actual)}</td>
                        <td
                          className={cn(
                            "px-4 py-2.5 text-right font-medium",
                            c.isOver ? "text-[var(--red)]" : "text-[var(--green)]",
                          )}
                        >
                          {c.diff >= 0 ? "+" : ""}{fmtShort(c.diff)}
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
                * 자재 발주 비용 {fmtShort(drilldown.totalMaterialCost)} 별도 포함
              </p>
            )}

            <div className="flex justify-end">
              <Link
                href={`/sites/${drilldown.siteId}`}
                className="text-sm text-[var(--green)] hover:underline flex items-center gap-1"
              >
                현장 상세 보기 <ArrowUpRight size={14} />
              </Link>
            </div>
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
      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full">
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

// ── 온보딩 가이드 (5단계) ──

const ONBOARDING_STEPS = [
  { step: 1, title: "첫 고객을 등록해보세요", desc: "고객 정보를 등록하면 현장과 계약을 연결할 수 있습니다", href: "/customers", icon: Users, color: "var(--blue)" },
  { step: 2, title: "현장을 등록하고 고객과 연결하세요", desc: "현장 정보를 입력하면 공정·지출·수금을 한눈에 관리합니다", href: "/sites/new", icon: Building2, color: "var(--green)" },
  { step: 3, title: "AI로 견적을 시뮬레이션해보세요", desc: "평수와 공종만 입력하면 AI가 등급별 견적서를 생성합니다", href: "/estimates/coach", icon: Sparkles, color: "#a855f7" },
  { step: 4, title: "계약을 등록하면 수금 일정이 자동 생성됩니다", desc: "계약금·중도금·잔금 일정을 등록하고 수금 현황을 추적하세요", href: "/contracts", icon: FileCheck, color: "var(--orange)" },
  { step: 5, title: "공정을 추가하면 일정이 자동으로 잡힙니다", desc: "AI 공정매니저가 평수 기반으로 최적 일정을 생성합니다", href: "/schedule/generator", icon: Zap, color: "#ec4899" },
];

function OnboardingGuide() {
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem("onboarding-step");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("onboarding-dismissed") === "true";
  });

  const handleSkipStep = () => {
    const next = currentStep + 1;
    if (next >= ONBOARDING_STEPS.length) {
      handleDismiss();
    } else {
      setCurrentStep(next);
      localStorage.setItem("onboarding-step", String(next));
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("onboarding-dismissed", "true");
  };

  if (dismissed) {
    return (
      <div className="space-y-6 animate-fade-up">
        <OnboardingModal />
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-sm text-[var(--muted)] mt-1">현장을 등록하면 대시보드가 활성화됩니다</p>
        </div>
        <button
          onClick={() => { setDismissed(false); localStorage.removeItem("onboarding-dismissed"); }}
          className="w-full rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/5 p-5 flex items-center gap-4 hover:bg-[var(--green)]/10 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--green)]/10 flex items-center justify-center shrink-0">
            <Sparkles size={24} style={{ color: "var(--green)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">설정 마무리하기</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{currentStep}/5 완료 — 나머지 단계를 진행하세요</p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--green)" }} />
        </button>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-4">전체 메뉴</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {MENU_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl hover:bg-white/[0.04] transition-all group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <span className="text-xs text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];
  if (!step) { handleDismiss(); return null; }

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
      <OnboardingModal />
      <div className="text-center pt-8">
        <h1 className="text-2xl font-bold">인테리어코치 시작하기</h1>
        <p className="text-sm text-[var(--muted)] mt-1">5단계만 따라하면 준비 완료!</p>
      </div>

      {/* 진행률 */}
      <div className="flex items-center gap-2">
        {ONBOARDING_STEPS.map((_, i) => (
          <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < currentStep ? "bg-[var(--green)]" : i === currentStep ? "bg-[var(--green)]/50" : "bg-[var(--border)]")} />
        ))}
        <span className="text-xs text-[var(--muted)] shrink-0 ml-1">{currentStep + 1}/5</span>
      </div>

      {/* 현재 단계 카드 */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${step.color}15` }}>
          <step.icon size={32} style={{ color: step.color }} />
        </div>
        <p className="text-xs text-[var(--muted)] mb-2">STEP {step.step}</p>
        <h2 className="text-xl font-bold mb-2">{step.title}</h2>
        <p className="text-sm text-[var(--muted)] mb-6">{step.desc}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={step.href}
            onClick={() => { const next = currentStep + 1; setCurrentStep(next); localStorage.setItem("onboarding-step", String(next)); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-black transition-colors"
            style={{ backgroundColor: step.color }}
          >
            시작하기 <ArrowRight size={16} />
          </Link>
          <button onClick={handleSkipStep} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <SkipForward size={14} /> 건너뛰기
          </button>
        </div>
      </div>

      {/* 완료/남은 단계 */}
      {currentStep > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted)]">완료한 단계</p>
          {ONBOARDING_STEPS.slice(0, currentStep).map((s) => (
            <div key={s.step} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03]">
              <Check size={14} style={{ color: "var(--green)" }} />
              <span className="text-sm text-[var(--muted)]">{s.title}</span>
            </div>
          ))}
        </div>
      )}
      {currentStep < ONBOARDING_STEPS.length - 1 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted)]">남은 단계</p>
          {ONBOARDING_STEPS.slice(currentStep + 1).map((s) => (
            <div key={s.step} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] opacity-50">
              <div className="w-3.5 h-3.5 rounded-full border border-[var(--border)]" />
              <span className="text-sm text-[var(--muted)]">{s.title}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-center pb-8">
        <button onClick={handleDismiss} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline transition-colors">나중에 하기</button>
      </div>
    </div>
  );
}
