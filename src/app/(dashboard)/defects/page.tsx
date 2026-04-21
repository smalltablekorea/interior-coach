"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, ShieldAlert, Search, LayoutGrid, Table as TableIcon, ChevronRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { cn, fmtDate } from "@/lib/utils";
import type { Defect, DefectSeverity, DefectStatus } from "@/types/defect";

interface Site { id: string; name: string; }

const STATUS_COLS: { key: DefectStatus; label: string; color: string }[] = [
  { key: "reported", label: "접수", color: "var(--red)" },
  { key: "in_progress", label: "진행중", color: "var(--orange)" },
  { key: "resolved", label: "해결됨", color: "var(--blue)" },
  { key: "closed", label: "종료", color: "var(--green)" },
];

const SEVERITY_LABELS: Record<DefectSeverity, string> = {
  minor: "경미",
  major: "중대",
  critical: "심각",
};

const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  minor: "var(--muted)",
  major: "var(--orange)",
  critical: "var(--red)",
};

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<DefectSeverity | "">("");
  const [filterStatus, setFilterStatus] = useState<DefectStatus | "">("");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/defects?limit=200").then((r) => (r.ok ? r.json() : { items: [] })),
      apiFetch("/api/sites").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([defectData, siteData]) => {
        setDefects(defectData?.items ?? defectData ?? []);
        setSites(Array.isArray(siteData) ? siteData : siteData?.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return defects.filter((d) => {
      if (filterSite && d.siteId !== filterSite) return false;
      if (filterSeverity && d.severity !== filterSeverity) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [defects, filterSite, filterSeverity, filterStatus, search]);

  const byStatus = useMemo(() => {
    const map: Record<DefectStatus, Defect[]> = { reported: [], in_progress: [], resolved: [], closed: [] };
    filtered.forEach((d) => map[d.status].push(d));
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert size={24} className="text-[var(--red)]" />
          <div>
            <h1 className="text-xl font-bold">하자 관리</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">전체 {defects.length}건 · 필터 결과 {filtered.length}건</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-[var(--border)] p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                view === "kanban" ? "bg-[var(--green)] text-black" : "text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
              aria-label="칸반 뷰"
            >
              <LayoutGrid size={14} />
              칸반
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                view === "table" ? "bg-[var(--green)] text-black" : "text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
              aria-label="테이블 뷰"
            >
              <TableIcon size={14} />
              테이블
            </button>
          </div>
          <Link
            href="/defects/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={16} />
            하자 등록
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="하자 제목 검색"
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
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as DefectSeverity | "")}
          className="px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm"
        >
          <option value="">전체 심각도</option>
          <option value="minor">경미</option>
          <option value="major">중대</option>
          <option value="critical">심각</option>
        </select>
        {view === "table" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DefectStatus | "")}
            className="px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm"
          >
            <option value="">전체 상태</option>
            {STATUS_COLS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={defects.length === 0 ? "등록된 하자가 없습니다" : "조건에 맞는 하자가 없습니다"}
          description={defects.length === 0 ? "현장에서 발견한 하자를 기록하세요." : "필터를 조정해보세요."}
          action={
            defects.length === 0 ? (
              <Link
                href="/defects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold"
              >
                <Plus size={16} />
                하자 등록
              </Link>
            ) : undefined
          }
        />
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STATUS_COLS.map((col) => (
            <div key={col.key} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-semibold">{col.label}</span>
                </div>
                <span className="text-xs text-[var(--muted)] font-mono">{byStatus[col.key].length}</span>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {byStatus[col.key].length === 0 ? (
                  <p className="text-xs text-[var(--muted)] text-center py-6 opacity-60">비어있음</p>
                ) : (
                  byStatus[col.key].map((d) => <DefectCard key={d.id} defect={d} />)
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-white/[0.02] border-b border-[var(--border)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">제목</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">현장</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">공종</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">심각도</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">접수일</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const statusInfo = STATUS_COLS.find((c) => c.key === d.status);
                  return (
                    <tr key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/defects/${d.id}`} className="font-medium hover:text-[var(--green)]">
                          {d.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{d.siteName || "-"}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{d.tradeName}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ color: SEVERITY_COLORS[d.severity], background: `color-mix(in srgb, ${SEVERITY_COLORS[d.severity]} 12%, transparent)` }}
                        >
                          {SEVERITY_LABELS[d.severity]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ color: statusInfo?.color, background: `color-mix(in srgb, ${statusInfo?.color ?? "var(--muted)"} 12%, transparent)` }}
                        >
                          {statusInfo?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)] text-xs">{fmtDate(d.reportedAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/defects/${d.id}`} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// suppress unused badge-style helpers
void StatusBadge;

function DefectCard({ defect }: { defect: Defect }) {
  return (
    <Link
      href={`/defects/${defect.id}`}
      className="block p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-transparent hover:border-[var(--border-hover)]"
    >
      <div className="flex items-start gap-2 mb-2">
        <span
          className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
          style={{ color: SEVERITY_COLORS[defect.severity], background: `color-mix(in srgb, ${SEVERITY_COLORS[defect.severity]} 15%, transparent)` }}
        >
          {SEVERITY_LABELS[defect.severity]}
        </span>
        <p className="text-xs leading-tight line-clamp-2 flex-1">{defect.title}</p>
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
        <span>{defect.siteName || "-"}</span>
        <span>{defect.tradeName}</span>
      </div>
      {defect.assignedToName && (
        <p className="mt-1.5 text-[10px] text-[var(--muted)]">담당: {defect.assignedToName}</p>
      )}
    </Link>
  );
}
