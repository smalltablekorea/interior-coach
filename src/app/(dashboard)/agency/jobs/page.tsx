"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Clock, CheckCircle2, AlertCircle, Ban } from "lucide-react";

interface Job {
  id: string;
  clientId: string;
  businessName: string | null;
  channel: "naver_blog" | "threads" | "instagram";
  status: "generating" | "qc_failed" | "ready" | "published" | "cancelled";
  generationAttempts: number;
  generatedAt: string | null;
  createdAt: string;
  qcScore: number | null;
}

interface ClientOpt {
  id: string;
  businessName: string;
}

const CHANNEL_LABEL: Record<Job["channel"], string> = {
  naver_blog: "네이버 블로그",
  threads: "Threads",
  instagram: "Instagram",
};

const STATUS_STYLE: Record<Job["status"], { label: string; tone: string; icon: typeof Clock }> = {
  generating: { label: "생성 중", tone: "text-yellow-600", icon: Clock },
  ready: { label: "발행 대기", tone: "text-[var(--green)]", icon: CheckCircle2 },
  qc_failed: { label: "QC 미달", tone: "text-red-600", icon: AlertCircle },
  published: { label: "발행 완료", tone: "text-blue-600", icon: CheckCircle2 },
  cancelled: { label: "취소", tone: "text-[var(--muted)]", icon: Ban },
};

const STATUS_OPTIONS = ["all", "generating", "ready", "qc_failed", "published", "cancelled"] as const;
const CHANNEL_OPTIONS = ["all", "naver_blog", "threads", "instagram"] as const;

export default function AgencyAllJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [channelFilter, setChannelFilter] = useState<(typeof CHANNEL_OPTIONS)[number]>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (channelFilter !== "all") qs.set("channel", channelFilter);
      if (clientFilter !== "all") qs.set("clientId", clientFilter);
      const r = await fetch(`/api/agency/jobs?${qs.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setJobs(j.items || []);
      setClients(j.clients || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, clientFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">전체 콘텐츠 잡 큐</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            모든 클라이언트의 생성 큐 · QC 상태 · 발행 대기 잡을 한 번에 조회.
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
        >
          <RefreshCw size={14} />
        </button>
      </header>

      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["generating", "ready", "qc_failed", "published", "cancelled"] as const).map((s) => {
          const cfg = STATUS_STYLE[s];
          return (
            <div key={s} className="p-3 rounded-xl border border-[var(--border)]">
              <div className={`text-xs ${cfg.tone} mb-1`}>{cfg.label}</div>
              <div className="text-2xl font-bold">{stats[s] || 0}</div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex gap-1.5 items-center">
          <span className="text-[var(--muted)]">상태:</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2 py-1 rounded-md border ${
                statusFilter === s
                  ? "bg-[var(--green)] text-white border-[var(--green)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {s === "all" ? "전체" : STATUS_STYLE[s as Job["status"]].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 items-center">
          <span className="text-[var(--muted)]">채널:</span>
          {CHANNEL_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setChannelFilter(c)}
              className={`px-2 py-1 rounded-md border ${
                channelFilter === c
                  ? "bg-[var(--green)] text-white border-[var(--green)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {c === "all" ? "전체" : CHANNEL_LABEL[c as Job["channel"]]}
            </button>
          ))}
        </div>
        {clients.length > 0 && (
          <label className="inline-flex items-center gap-1.5">
            <span className="text-[var(--muted)]">클라이언트:</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-2 py-1 rounded-md border border-[var(--border)] text-xs"
            >
              <option value="all">전체</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">불러오는 중…</div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">
            조건에 맞는 잡이 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--sidebar)] text-xs text-[var(--muted)]">
              <tr>
                <th className="text-left px-4 py-3">클라이언트</th>
                <th className="text-left px-4 py-3">채널</th>
                <th className="text-left px-4 py-3">상태</th>
                <th className="text-left px-4 py-3">QC</th>
                <th className="text-left px-4 py-3">시도</th>
                <th className="text-left px-4 py-3">생성 시각</th>
                <th className="text-right px-4 py-3">탐색</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {jobs.map((j) => {
                const s = STATUS_STYLE[j.status];
                const Icon = s.icon;
                return (
                  <tr key={j.id}>
                    <td className="px-4 py-3">{j.businessName || "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{CHANNEL_LABEL[j.channel]}</td>
                    <td className={`px-4 py-3 inline-flex items-center gap-1.5 ${s.tone}`}>
                      <Icon size={14} /> {s.label}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{j.qcScore ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{j.generationAttempts}회</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {j.generatedAt ? new Date(j.generatedAt).toLocaleString("ko-KR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/agency/clients/${j.clientId}/jobs/${j.id}`}
                        className="text-[var(--green)] underline text-xs"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
