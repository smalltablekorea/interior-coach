"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  Users,
  Upload,
  CreditCard,
  DollarSign,
  FileCheck,
  BarChart3,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  OverviewResponse,
  OverviewKPI,
  ActionItem,
  AnomalyAlert,
} from "@/lib/types/marketing";

const KPI_ICONS: Record<string, typeof Users> = {
  signups: Users,
  upload_starts: Upload,
  upload_submits: FileCheck,
  analysis_completed: BarChart3,
  checkout_starts: CreditCard,
  payment_succeeded: CreditCard,
  revenue: DollarSign,
  inquiries: MessageSquare,
};

const URGENCY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]", border: "border-[var(--red)]/20" },
  medium: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]", border: "border-[var(--orange)]/20" },
  low: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
};

const SEVERITY_STYLES: Record<string, { icon: typeof AlertTriangle; bg: string; text: string }> = {
  critical: { icon: AlertTriangle, bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
  warning: { icon: AlertCircle, bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  info: { icon: Info, bg: "bg-blue-500/10", text: "text-blue-400" },
};

export default function MarketingOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/marketing/overview?period=${period}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-[var(--muted)]">
        <AlertCircle size={32} className="mx-auto mb-2" />
        <p className="text-sm">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center gap-2">
        {[
          { key: "7d", label: "7일" },
          { key: "14d", label: "14일" },
          { key: "30d", label: "30일" },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              period === p.key
                ? "bg-[var(--green)]/10 text-[var(--green)]"
                : "bg-white/[0.04] text-[var(--muted)] hover:bg-white/[0.08]"
            )}
          >
            {p.label}
          </button>
        ))}
        <span className="text-[10px] text-[var(--muted)] ml-2">
          {data.period.from} ~ {data.period.to}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.kpis.map((kpi) => (
          <KPICard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items */}
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Bell size={16} className="text-[var(--orange)]" />
            오늘 액션 필요
          </h2>
          {data.actionItems.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-4">
              오늘 처리할 항목이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {data.actionItems.map((item) => (
                <ActionItemCard key={item.type} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Anomaly Alerts */}
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--red)]" />
            이상 징후
          </h2>
          {data.anomalies.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--green)]">정상 운영 중</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                감지된 이상 징후가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.anomalies.map((a) => (
                <AnomalyCard key={a.type} anomaly={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ kpi }: { kpi: OverviewKPI }) {
  const Icon = KPI_ICONS[kpi.key] || BarChart3;
  const isRevenue = kpi.key === "revenue";
  const displayValue = isRevenue
    ? kpi.value >= 10000
      ? `${Math.round(kpi.value / 10000).toLocaleString()}만`
      : `${kpi.value.toLocaleString()}원`
    : kpi.value.toLocaleString();

  return (
    <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <Icon size={16} className="text-[var(--muted)]" />
        <div
          className={cn(
            "flex items-center gap-0.5 text-[10px] font-medium",
            kpi.changeDirection === "up"
              ? "text-[var(--green)]"
              : kpi.changeDirection === "down"
              ? "text-[var(--red)]"
              : "text-[var(--muted)]"
          )}
        >
          {kpi.changeDirection === "up" && <TrendingUp size={10} />}
          {kpi.changeDirection === "down" && <TrendingDown size={10} />}
          {kpi.changeDirection === "flat" && <Minus size={10} />}
          {kpi.changePercent > 0 ? `${kpi.changePercent.toFixed(1)}%` : "-"}
        </div>
      </div>
      <p className="text-xl font-bold tabular-nums">{displayValue}</p>
      <p className="text-[10px] text-[var(--muted)] mt-0.5">{kpi.label}</p>
    </div>
  );
}

function ActionItemCard({ item }: { item: ActionItem }) {
  const style = URGENCY_STYLES[item.urgency];
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border",
        style.bg,
        style.border
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", style.bg, style.text)}>
          {item.urgency === "high" ? "긴급" : item.urgency === "medium" ? "주의" : "참고"}
        </span>
        <span className="text-sm">{item.label}</span>
      </div>
      <span className={cn("text-lg font-bold tabular-nums", style.text)}>
        {item.count}
      </span>
    </div>
  );
}

function AnomalyCard({ anomaly }: { anomaly: AnomalyAlert }) {
  const style = SEVERITY_STYLES[anomaly.severity];
  const SeverityIcon = style.icon;
  return (
    <div className={cn("p-3 rounded-xl border border-[var(--border)]", style.bg)}>
      <div className="flex items-center gap-2 mb-1">
        <SeverityIcon size={14} className={style.text} />
        <span className={cn("text-sm font-medium", style.text)}>
          {anomaly.label}
        </span>
      </div>
      <p className="text-xs text-[var(--muted)]">{anomaly.description}</p>
      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--muted)]">
        <span>현재: {anomaly.currentValue}%</span>
        <span>이전: {anomaly.previousValue}%</span>
      </div>
    </div>
  );
}
