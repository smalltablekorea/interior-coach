"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowDown, Filter as FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FunnelResponse, FunnelStage } from "@/lib/types/marketing";

const STAGE_COLORS = [
  "#4ade80", "#38bdf8", "#818cf8", "#c084fc",
  "#f472b6", "#fb923c", "#facc15", "#34d399",
  "#60a5fa", "#a78bfa",
];

export default function FunnelPage() {
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState("");
  const [campaign, setCampaign] = useState("");

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ from: dateFrom, to: dateTo });
    if (channel) params.set("channel", channel);
    if (campaign) params.set("campaign", campaign);
    fetch(`/api/admin/marketing/funnel?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo, channel]);

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
        <p className="text-sm">퍼널 데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.stages.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <FilterIcon size={16} className="text-[var(--muted)]" />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border)] text-xs focus:border-[var(--green)] focus:outline-none"
          />
          <span className="text-xs text-[var(--muted)]">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border)] text-xs focus:border-[var(--green)] focus:outline-none"
          />
        </div>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border)] text-xs focus:outline-none"
        >
          <option value="">채널 전체</option>
          <option value="organic">자연유입</option>
          <option value="search_ads">검색광고</option>
          <option value="social">소셜</option>
          <option value="referral">추천</option>
        </select>
      </div>

      {/* Funnel Visualization */}
      <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <h2 className="text-sm font-medium mb-6">전환 퍼널</h2>
        <div className="space-y-1">
          {data.stages.map((stage, i) => (
            <FunnelStageRow
              key={stage.key}
              stage={stage}
              index={i}
              maxCount={maxCount}
              color={STAGE_COLORS[i % STAGE_COLORS.length]}
              isLast={i === data.stages.length - 1}
              prevCount={i > 0 ? data.stages[i - 1].count : stage.count}
            />
          ))}
        </div>
      </div>

      {/* Conversion Table */}
      <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <h2 className="text-sm font-medium mb-4">단계별 전환율</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left py-2 px-3">단계</th>
                <th className="text-right py-2 px-3">인원</th>
                <th className="text-right py-2 px-3">전환율</th>
                <th className="text-right py-2 px-3">이탈률</th>
                <th className="text-right py-2 px-3">이탈 인원</th>
              </tr>
            </thead>
            <tbody>
              {data.stages.map((stage, i) => {
                const prevCount = i > 0 ? data.stages[i - 1].count : stage.count;
                const dropoff = prevCount - stage.count;
                return (
                  <tr
                    key={stage.key}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="py-2.5 px-3 font-medium">{stage.label}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {stage.count.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={cn(
                          "tabular-nums",
                          stage.conversionRate >= 50
                            ? "text-[var(--green)]"
                            : stage.conversionRate >= 20
                            ? "text-[var(--orange)]"
                            : "text-[var(--red)]"
                        )}
                      >
                        {stage.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[var(--muted)]">
                      {stage.dropoffRate.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[var(--muted)]">
                      {dropoff > 0 ? `-${dropoff.toLocaleString()}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FunnelStageRow({
  stage,
  index,
  maxCount,
  color,
  isLast,
  prevCount,
}: {
  stage: FunnelStage;
  index: number;
  maxCount: number;
  color: string;
  isLast: boolean;
  prevCount: number;
}) {
  const widthPct = Math.max(8, (stage.count / maxCount) * 100);
  const dropoff = prevCount - stage.count;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-xs text-right text-[var(--muted)] shrink-0">
          {stage.label}
        </span>
        <div className="flex-1 relative">
          <div
            className="h-8 rounded-lg flex items-center px-3 transition-all duration-500"
            style={{
              width: `${widthPct}%`,
              backgroundColor: color + "30",
              borderLeft: `3px solid ${color}`,
            }}
          >
            <span className="text-xs font-medium tabular-nums">
              {stage.count.toLocaleString()}
            </span>
          </div>
        </div>
        <span className="w-14 text-right text-xs tabular-nums text-[var(--muted)]">
          {stage.conversionRate.toFixed(1)}%
        </span>
      </div>
      {!isLast && dropoff > 0 && (
        <div className="flex items-center gap-3 my-0.5">
          <span className="w-24" />
          <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] pl-4">
            <ArrowDown size={10} />
            <span>-{dropoff.toLocaleString()} ({stage.dropoffRate.toFixed(1)}% 이탈)</span>
          </div>
        </div>
      )}
    </div>
  );
}
