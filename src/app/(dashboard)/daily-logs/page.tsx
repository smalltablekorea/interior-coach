"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, ClipboardList, Search, ChevronRight, Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api-client";
import { fmtDate } from "@/lib/utils";
import type { DailyLog, Weather } from "@/types/daily-log";

interface Site { id: string; name: string; }

const WEATHER_EMOJI: Record<Weather, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  hot: "🔥",
  cold: "🥶",
};

export default function DailyLogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/daily-logs?limit=200").then((r) => (r.ok ? r.json() : { items: [] })),
      apiFetch("/api/sites").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([logData, siteData]) => {
        setLogs(logData?.items ?? logData ?? []);
        setSites(Array.isArray(siteData) ? siteData : siteData?.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterSite && l.siteId !== filterSite) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.summary.toLowerCase().includes(q) &&
          !(l.siteName || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, search, filterSite]);

  // 날짜별 그룹
  const grouped = useMemo(() => {
    const map = new Map<string, DailyLog[]>();
    filtered.forEach((l) => {
      const key = l.logDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl animate-shimmer" />
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList size={24} className="text-[var(--blue)]" />
          <div>
            <h1 className="text-xl font-bold">업무일지</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">전체 {logs.length}건 · 필터 결과 {filtered.length}건</p>
          </div>
        </div>
        <Link
          href="/daily-logs/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:bg-[var(--green-hover)]"
        >
          <Plus size={16} />
          업무일지 작성
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="요약·현장명 검색"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
          />
        </div>
        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm"
        >
          <option value="">전체 현장</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={logs.length === 0 ? "작성된 업무일지가 없습니다" : "조건에 맞는 일지가 없습니다"}
          description={logs.length === 0 ? "현장별로 하루에 한 개 작성하면 고객 공유도 자동입니다." : "필터를 조정해보세요."}
          action={
            logs.length === 0 ? (
              <Link
                href="/daily-logs/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold"
              >
                <Plus size={16} />
                업무일지 작성
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-bold">{fmtDate(date)}</h2>
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--muted)]">{items.length}건</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((log) => (
                  <Link
                    key={log.id}
                    href={`/daily-logs/${log.id}`}
                    className="block p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--green)] truncate">{log.siteName || "-"}</span>
                      {log.weather && (
                        <span className="text-base" title={log.weather}>{WEATHER_EMOJI[log.weather]}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium line-clamp-2 mb-3 leading-snug">{log.summary}</p>
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {log.workerCount ?? 0}명
                      </span>
                      <span>{log.authorName}</span>
                      <ChevronRight size={12} />
                    </div>
                    {log.tradesWorkedNames && log.tradesWorkedNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {log.tradesWorkedNames.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.05] text-[var(--muted)]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
