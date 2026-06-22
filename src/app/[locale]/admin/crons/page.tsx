"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface CronStat {
  cronName: string;
  ok: number;
  fail: number;
  successRate: number | null;
  lastRun: string | null;
  avgDurationMs: number;
  lastError: string | null;
  consecutiveFails: number;
}

interface RecentRun {
  id: string;
  cronName: string;
  success: boolean;
  processed: number | null;
  durationMs: number;
  metadata: unknown;
  errorMessage: string | null;
  completedAt: string | null;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AdminCronsPage() {
  const [stats, setStats] = useState<CronStat[]>([]);
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/crons", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "조회 실패");
        return;
      }
      const data = json?.data ?? json;
      setStats(data.stats ?? []);
      setRecent(data.recent ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cron 실행 모니터링</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            최근 7일 cron 통계 + 최근 실행 50건
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04] flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </div>

      {err && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {err}
        </div>
      )}

      {/* cron별 통계 */}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">Cron 별 통계 (최근 7일)</h2>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[var(--muted)] text-xs">
                <tr>
                  <th className="text-left px-3 py-2.5">상태</th>
                  <th className="text-left px-3 py-2.5">cron</th>
                  <th className="text-right px-3 py-2.5">성공 / 실패</th>
                  <th className="text-right px-3 py-2.5">성공률</th>
                  <th className="text-right px-3 py-2.5">평균 실행</th>
                  <th className="text-left px-3 py-2.5">마지막 실행</th>
                  <th className="text-left px-3 py-2.5">마지막 에러</th>
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-[var(--muted)]">
                      기록 없음
                    </td>
                  </tr>
                ) : (
                  stats.map((s) => {
                    const failing = s.consecutiveFails >= 2;
                    return (
                      <tr key={s.cronName} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2.5">
                          {failing ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-400">
                              <AlertTriangle size={12} />
                              실패 {s.consecutiveFails}회
                            </span>
                          ) : s.fail === 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[var(--green)]">
                              <CheckCircle2 size={12} />
                              정상
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <Clock size={12} />
                              일부 실패
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">{s.cronName}</td>
                        <td className="px-3 py-2.5 text-right text-xs">
                          <span className="text-[var(--green)]">{s.ok}</span>
                          <span className="text-[var(--muted)]"> / </span>
                          <span className={s.fail > 0 ? "text-red-400" : ""}>{s.fail}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs">
                          {s.successRate !== null ? `${s.successRate}%` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-[var(--muted)]">
                          {s.avgDurationMs > 0 ? `${s.avgDurationMs.toLocaleString()}ms` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                          {fmtDate(s.lastRun)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-red-400/80 max-w-[280px] truncate" title={s.lastError ?? ""}>
                          {s.lastError ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 최근 실행 50건 */}
      <section>
        <h2 className="font-semibold mb-3">최근 실행 50건</h2>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[var(--muted)] text-xs">
                <tr>
                  <th className="text-left px-3 py-2.5 w-20">결과</th>
                  <th className="text-left px-3 py-2.5">cron</th>
                  <th className="text-right px-3 py-2.5">처리</th>
                  <th className="text-right px-3 py-2.5">시간</th>
                  <th className="text-left px-3 py-2.5">메타데이터 / 에러</th>
                  <th className="text-left px-3 py-2.5">완료 시각</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-[var(--muted)]">
                      기록 없음
                    </td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2.5">
                        {r.success ? (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)] text-[10px] font-medium">
                            OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium">
                            FAIL
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.cronName}</td>
                      <td className="px-3 py-2.5 text-right text-xs">{r.processed ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-[var(--muted)]">
                        {r.durationMs.toLocaleString()}ms
                      </td>
                      <td className="px-3 py-2.5 text-xs max-w-[360px] truncate">
                        {r.success ? (
                          <span className="text-[var(--muted)]">
                            {r.metadata ? JSON.stringify(r.metadata) : "—"}
                          </span>
                        ) : (
                          <span className="text-red-400/80" title={r.errorMessage ?? ""}>
                            {r.errorMessage ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                        {fmtDate(r.completedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
