"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Phone, Building2, CalendarClock, MessageSquare, RefreshCw, ExternalLink } from "lucide-react";

interface DemoRequest {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  companySize: string;
  currentPain: string | null;
  source: string | null;
  status: "new" | "contacted" | "scheduled" | "done";
  scheduledAt: string | null;
  contactedAt: string | null;
  completedAt: string | null;
  memo: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<DemoRequest["status"], string> = {
  new: "신규",
  contacted: "연락 완료",
  scheduled: "데모 예약",
  done: "완료",
};

const STATUS_COLORS: Record<DemoRequest["status"], string> = {
  new: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
  contacted: "bg-blue-500/10 text-blue-300 border border-blue-500/30",
  scheduled: "bg-purple-500/10 text-purple-300 border border-purple-500/30",
  done: "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30",
};

const SIZE_LABEL: Record<string, string> = {
  solo: "1인",
  small: "2~5명",
  medium: "6~20명",
  large: "20명+",
};

function fmt(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AdminDemoRequestsPage() {
  const [items, setItems] = useState<DemoRequest[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"all" | DemoRequest["status"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memoOpen, setMemoOpen] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/demo-requests", window.location.origin);
      if (filter !== "all") url.searchParams.set("status", filter);
      url.searchParams.set("limit", "200");
      const res = await fetch(url.toString(), { credentials: "include" });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error || `조회 실패 (${res.status})`);
        setLoading(false);
        return;
      }
      const data = j?.data ?? j;
      setItems(data?.items ?? []);
      const counts: Record<string, number> = {};
      (data?.statusCounts ?? []).forEach((c: { status: string; count: number }) => {
        counts[c.status] = c.count;
      });
      setStatusCounts(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: DemoRequest["status"]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/demo-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(`상태 변경 실패: ${j?.error || res.status}`);
        return;
      }
      await load();
    } catch (e) {
      alert(`상태 변경 실패: ${e instanceof Error ? e.message : "네트워크 오류"}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveMemo(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/demo-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memo: memoDraft }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(`메모 저장 실패: ${j?.error || res.status}`);
        return;
      }
      setMemoOpen(null);
      setMemoDraft("");
      await load();
    } catch (e) {
      alert(`메모 저장 실패: ${e instanceof Error ? e.message : "네트워크 오류"}`);
    } finally {
      setSaving(false);
    }
  }

  const totalAll = (statusCounts.new || 0) + (statusCounts.contacted || 0) + (statusCounts.scheduled || 0) + (statusCounts.done || 0);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">데모 신청</h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--card)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </div>
      <p className="text-sm text-[var(--muted)] mb-6">
        랜딩 페이지 데모 신청 폼 — 영업/CS 응답 관리
      </p>

      {/* 상태 필터 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterChip label={`전체 (${totalAll})`} active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterChip
          label={`신규 (${statusCounts.new || 0})`}
          active={filter === "new"}
          onClick={() => setFilter("new")}
          accent="amber"
        />
        <FilterChip
          label={`연락 (${statusCounts.contacted || 0})`}
          active={filter === "contacted"}
          onClick={() => setFilter("contacted")}
        />
        <FilterChip
          label={`예약 (${statusCounts.scheduled || 0})`}
          active={filter === "scheduled"}
          onClick={() => setFilter("scheduled")}
        />
        <FilterChip
          label={`완료 (${statusCounts.done || 0})`}
          active={filter === "done"}
          onClick={() => setFilter("done")}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="py-20 text-center text-[var(--muted)]">로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-[var(--muted)] border border-[var(--border)] rounded-xl">
          <MessageSquare size={28} className="mx-auto mb-3 opacity-40" />
          {filter === "all" ? "데모 신청이 없습니다." : `'${STATUS_LABELS[filter]}' 상태의 신청이 없습니다.`}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--green)]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold">{item.companyName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {SIZE_LABEL[item.companySize] || item.companySize}
                    </span>
                    {item.source && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--muted)]">
                        src: {item.source}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--muted)]">담당: {item.ownerName}</div>
                </div>
                <div className="text-[10px] text-[var(--muted)] whitespace-nowrap">
                  {fmt(item.createdAt)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm">
                <a
                  href={`tel:${item.phone}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <Phone size={13} className="text-[var(--green)]" />
                  <span className="font-mono">{item.phone}</span>
                </a>
                <a
                  href={`mailto:${item.email}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <Mail size={13} className="text-[var(--green)]" />
                  <span className="truncate">{item.email}</span>
                  <ExternalLink size={10} className="text-[var(--muted)] ml-auto flex-shrink-0" />
                </a>
              </div>

              {item.currentPain && (
                <div className="mb-3 p-3 rounded-lg bg-white/[0.02] text-sm">
                  <div className="text-[10px] text-[var(--muted)] mb-1">현재 어려움</div>
                  {item.currentPain}
                </div>
              )}

              {item.memo && memoOpen !== item.id && (
                <div className="mb-3 p-3 rounded-lg border border-[var(--green)]/20 bg-[var(--green)]/5 text-sm">
                  <div className="text-[10px] text-[var(--green)] mb-1 flex items-center gap-1">
                    <Building2 size={11} /> 운영 메모
                  </div>
                  <div className="whitespace-pre-wrap">{item.memo}</div>
                </div>
              )}

              {memoOpen === item.id && (
                <div className="mb-3">
                  <textarea
                    value={memoDraft}
                    onChange={(e) => setMemoDraft(e.target.value)}
                    rows={3}
                    placeholder="응대 메모 (연락 결과, 다음 액션 등)"
                    className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => saveMemo(item.id)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg bg-[var(--green)] text-black text-xs font-medium disabled:opacity-50"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setMemoOpen(null);
                        setMemoDraft("");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {(["new", "contacted", "scheduled", "done"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => item.status !== s && updateStatus(item.id, s)}
                    disabled={saving || item.status === s}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      item.status === s
                        ? STATUS_COLORS[s] + " cursor-default"
                        : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMemoOpen(item.id);
                    setMemoDraft(item.memo || "");
                  }}
                  className="ml-auto px-3 py-1 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-colors flex items-center gap-1"
                >
                  <MessageSquare size={11} />
                  {item.memo ? "메모 편집" : "메모 추가"}
                </button>
              </div>

              {(item.contactedAt || item.scheduledAt || item.completedAt) && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-3 text-[10px] text-[var(--muted)] flex-wrap">
                  {item.contactedAt && (
                    <span className="flex items-center gap-1">
                      <CalendarClock size={10} />
                      연락 {fmt(item.contactedAt)}
                    </span>
                  )}
                  {item.scheduledAt && (
                    <span className="flex items-center gap-1">
                      <CalendarClock size={10} />
                      예약 {fmt(item.scheduledAt)}
                    </span>
                  )}
                  {item.completedAt && (
                    <span className="flex items-center gap-1">
                      <CalendarClock size={10} />
                      완료 {fmt(item.completedAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label, active, onClick, accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accent?: "amber";
}) {
  const accentClass = accent === "amber" ? "border-amber-500/30 text-amber-300" : "";
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30"
          : `border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--card)] ${accentClass}`
      }`}
    >
      {label}
    </button>
  );
}
