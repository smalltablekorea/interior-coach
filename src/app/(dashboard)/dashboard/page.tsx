"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
  Users,
  FileText,
  Sparkles,
  Hammer,
  Package,
  HardHat,
  Megaphone,
  BarChart3,
  Calculator,
  Settings,
  Zap,
  Target,
  ArrowUpRight,
  Bell,
  ClipboardList,
  Banknote,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { fmtShort, fmtDate, cn } from "@/lib/utils";
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
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState<DrilldownData | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/sites").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/dashboard").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([siteData, dashData]) => {
        setSites(Array.isArray(siteData) ? siteData : []);
        if (dashData?.kpi) setDashboard(dashData);
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

  // ── Empty State (새 워크스페이스) ──
  if (!dashboard) {
    return (
      <div className="space-y-8 animate-fade-up">
        <OnboardingModal />
        <div>
          <h1 className="text-2xl font-bold">시작하기</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            인테리어코치에 오신 것을 환영합니다. 아래 메뉴에서 원하는 기능을 선택하세요.
          </p>
        </div>

        {/* Quick Start Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/sites/new"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--green)]/50 hover:bg-[var(--green)]/5 transition-all card-lift"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--green)]/10 flex items-center justify-center mb-4">
              <Building2 size={24} style={{ color: "var(--green)" }} />
            </div>
            <h3 className="font-semibold mb-1">현장 등록</h3>
            <p className="text-sm text-[var(--muted)]">
              첫 번째 현장을 등록하고 프로젝트를 시작하세요
            </p>
            <div className="mt-3 flex items-center gap-1 text-sm text-[var(--green)] opacity-0 group-hover:opacity-100 transition-opacity">
              시작하기 <ArrowRight size={14} />
            </div>
          </Link>
          <Link
            href="/estimates/coach"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[#a855f7]/50 hover:bg-[#a855f7]/5 transition-all card-lift"
          >
            <div className="w-12 h-12 rounded-xl bg-[#a855f7]/10 flex items-center justify-center mb-4">
              <Sparkles size={24} style={{ color: "#a855f7" }} />
            </div>
            <h3 className="font-semibold mb-1">AI 견적코치</h3>
            <p className="text-sm text-[var(--muted)]">
              AI가 자동으로 견적서를 작성해드립니다
            </p>
            <div className="mt-3 flex items-center gap-1 text-sm text-[#a855f7] opacity-0 group-hover:opacity-100 transition-opacity">
              시작하기 <ArrowRight size={14} />
            </div>
          </Link>
          <Link
            href="/customers"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--blue)]/50 hover:bg-[var(--blue)]/5 transition-all card-lift"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center mb-4">
              <Users size={24} style={{ color: "var(--blue)" }} />
            </div>
            <h3 className="font-semibold mb-1">고객 등록</h3>
            <p className="text-sm text-[var(--muted)]">
              고객 정보를 등록하고 체계적으로 관리하세요
            </p>
            <div className="mt-3 flex items-center gap-1 text-sm text-[var(--blue)] opacity-0 group-hover:opacity-100 transition-opacity">
              시작하기 <ArrowRight size={14} />
            </div>
          </Link>
        </div>

        {/* Full Menu Grid */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-4">전체 메뉴</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <span className="text-xs text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { kpi, healthScores, projectProfits, actionItems, recentActivity } =
    dashboard;

  const totalActionCount =
    actionItems.overduePayments.length +
    actionItems.delayedPhases.length +
    actionItems.needsOrdering.length;

  const hasActions = totalActionCount > 0;

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
          2. 오늘의 할 일 HERO CARD
          ══════════════════════════════════════════════ */}
      <div className="animate-fade-up stagger-2">
        <div className={cn(
          "rounded-2xl border bg-[var(--card)] p-5 sm:p-6",
          hasActions ? "border-[var(--orange)]/40" : "border-[var(--border)]",
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                hasActions ? "bg-[var(--orange)]/10" : "bg-[var(--green)]/10",
              )}>
                {hasActions ? (
                  <Bell size={20} style={{ color: "var(--orange)" }} />
                ) : (
                  <CircleCheck size={20} style={{ color: "var(--green)" }} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold">오늘의 할 일</h2>
                <p className="text-xs text-[var(--muted)]">
                  {hasActions
                    ? `${totalActionCount}건의 처리가 필요합니다`
                    : "모든 항목이 정상입니다"}
                </p>
              </div>
            </div>
            {hasActions && (
              <span className="animate-pulse-glow px-3 py-1 rounded-full text-sm font-bold bg-[var(--red)]/10 text-[var(--red)]">
                {totalActionCount}
              </span>
            )}
          </div>

          {hasActions ? (
            <div className="space-y-2">
              {/* 연체 수금 */}
              {actionItems.overduePayments.slice(0, 3).map((item, i) => (
                <Link
                  key={`pay-${i}`}
                  href={item.siteId ? `/sites/${item.siteId}` : "/settlement"}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--red)]/10 flex items-center justify-center shrink-0">
                    <Banknote size={16} style={{ color: "var(--red)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{item.siteName}</span>{" "}
                      {item.type} 미수금
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {fmtShort(item.amount)} · 납기 {fmtDate(item.dueDate)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--red)]/10 text-[var(--red)]">
                    D+{item.daysOverdue}
                  </span>
                  <ChevronRight size={16} className="text-[var(--muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
              {/* 지연 공정 */}
              {actionItems.delayedPhases.slice(0, 3).map((item, i) => (
                <Link
                  key={`delay-${i}`}
                  href={item.siteId ? `/construction?siteId=${item.siteId}` : "/construction"}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--orange)]/10 flex items-center justify-center shrink-0">
                    <Clock size={16} style={{ color: "var(--orange)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{item.siteName}</span>{" "}
                      {item.category} 공정 지연
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      진행률 {item.progress}% · 예정 완료 {fmtDate(item.plannedEnd)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--orange)]/10 text-[var(--orange)]">
                    D+{item.daysDelayed}
                  </span>
                  <ChevronRight size={16} className="text-[var(--muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
              {/* 자재 발주 필요 */}
              {actionItems.needsOrdering.slice(0, 2).map((item, i) => (
                <Link
                  key={`order-${i}`}
                  href={item.siteId ? `/materials?siteId=${item.siteId}` : "/materials"}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
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
                  <ChevronRight size={16} className="text-[var(--muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--green)]/5">
              <CircleCheck size={18} style={{ color: "var(--green)" }} />
              <p className="text-sm text-[var(--green)]">
                오늘 처리할 긴급 항목이 없습니다. 오늘의 일정을 확인하세요.
              </p>
              <Link href="/schedule" className="ml-auto text-sm text-[var(--green)] hover:underline flex items-center gap-1 shrink-0">
                일정 <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

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
