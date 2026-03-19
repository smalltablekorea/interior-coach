"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
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
} from "lucide-react";
import { fmtShort, fmtDate, fmt } from "@/lib/utils";
import Link from "next/link";

interface Site {
  id: string;
  name: string;
  status: string;
  customerName: string | null;
  startDate: string | null;
  address: string | null;
}

interface DashboardData {
  activeSites: number;
  totalSites: number;
  monthlyRevenue: number;
  unpaidAmount: number;
  totalExpenses: number;
  profitMargin: number;
  thisWeekSchedule: number;
  recentActivity: { id: string; type: string; message: string; date: string; icon: string }[];
  projectProfits: { name: string; revenue: number; expense: number; profit: number }[];
}

const ACTIVITY_ICONS: Record<string, typeof Wallet> = {
  wallet: Wallet,
  check: CircleCheck,
  receipt: Receipt,
  file: FileCheck,
  edit: Pencil,
};

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const maxRevenue = dashboard.projectProfits.length > 0
    ? Math.max(...dashboard.projectProfits.map((p) => p.revenue))
    : 1;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
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
          value={`${dashboard.activeSites}건`}
          subtitle={`전체 ${dashboard.totalSites}건`}
          icon={Building2}
        />
        <KPICard
          title="이번달 수금"
          value={fmtShort(dashboard.monthlyRevenue)}
          subtitle={`미수금 ${fmtShort(dashboard.unpaidAmount)}`}
          icon={Wallet}
          color="var(--blue)"
        />
        <KPICard
          title="이번달 지출"
          value={fmtShort(dashboard.totalExpenses)}
          subtitle="자재비+인건비+기타"
          icon={TrendingDown}
          color="var(--orange)"
        />
        <KPICard
          title="이번주 공정"
          value={`${dashboard.thisWeekSchedule}건`}
          subtitle={`예상 이익률 ${dashboard.profitMargin}%`}
          icon={CalendarDays}
          color="var(--green)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Profit Chart */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">프로젝트별 수익</h2>
            <Link href="/settlement" className="text-sm text-[var(--green)] hover:underline flex items-center gap-1">
              정산 리포트 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-5">
            {dashboard.projectProfits.map((p) => {
              const profitRate = p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--green)] flex items-center gap-0.5">
                        <TrendingUp size={12} />
                        {profitRate}%
                      </span>
                      <span className="text-sm font-bold">{fmtShort(p.profit)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div
                      className="rounded-l-lg bg-[var(--blue)] flex items-center justify-center"
                      style={{ width: `${(p.expense / maxRevenue) * 100}%` }}
                    >
                      <span className="text-[10px] text-white font-medium truncate px-1">
                        지출 {fmtShort(p.expense)}
                      </span>
                    </div>
                    <div
                      className="rounded-r-lg bg-[var(--green)] flex items-center justify-center"
                      style={{ width: `${(p.profit / maxRevenue) * 100}%` }}
                    >
                      <span className="text-[10px] text-black font-medium truncate px-1">
                        이익 {fmtShort(p.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-[var(--muted)]">
                      계약 {fmtShort(p.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
          <div className="space-y-1">
            {dashboard.recentActivity.map((a) => {
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
                    <p className="text-xs text-[var(--muted)] mt-0.5">{fmtDate(a.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Site Status Overview */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">현장 현황</h2>
            <Link href="/sites" className="text-sm text-[var(--green)] hover:underline flex items-center gap-1">
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          {sites.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">등록된 현장이 없습니다.</p>
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

        {/* Recent Sites */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">최근 현장</h2>
            <Link href="/sites" className="text-sm text-[var(--green)] hover:underline flex items-center gap-1">
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
                  <p className="text-xs text-[var(--muted)]">{site.customerName || "고객 미지정"}</p>
                </div>
                <StatusBadge status={site.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
