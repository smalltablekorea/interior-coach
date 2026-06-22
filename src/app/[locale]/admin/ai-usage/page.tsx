"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  RefreshCw,
  Sparkles,
  DollarSign,
} from "lucide-react";

interface Day {
  date: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

interface EndpointStat {
  endpoint: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

interface ModelStat {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  estimatedCostUsd: number;
}

interface UserStat {
  userId: string;
  email: string;
  name: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  lastCall: string | null;
}

interface ApiResp {
  windowDays: number;
  since: string;
  totals: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    estimatedCostUsd: number;
  };
  daily: Day[];
  byEndpoint: EndpointStat[];
  byModel: ModelStat[];
  topUsers: UserStat[];
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function AdminAiUsagePage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load(d: number) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/ai-usage?days=${d}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "조회 실패");
        return;
      }
      const payload = (json?.data ?? json) as ApiResp;
      setData(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(days);
  }, [days]);

  const maxDailyCalls = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.daily.map((d) => d.calls));
  }, [data]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI 사용량 / 비용</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            ai_usage 기준 호출·토큰·추정 비용. 모델 단가는 모니터링 추정용 (정확치 X).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm focus:outline-none"
          >
            <option value={1}>최근 1일</option>
            <option value={7}>최근 7일</option>
            <option value={14}>최근 14일</option>
            <option value={30}>최근 30일</option>
          </select>
          <button
            onClick={() => load(days)}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04] flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {err}
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 text-center text-[var(--muted)]">로딩 중...</div>
      ) : data ? (
        <>
          {/* 총합 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Kpi icon={<Sparkles size={14} />} label="총 호출" value={fmtNum(data.totals.calls)} />
            <Kpi icon={<Sparkles size={14} />} label="입력 토큰" value={fmtNum(data.totals.inputTokens)} />
            <Kpi icon={<Sparkles size={14} />} label="출력 토큰" value={fmtNum(data.totals.outputTokens)} />
            <Kpi icon={<DollarSign size={14} />} label="추정 비용" value={`$${data.totals.estimatedCostUsd.toFixed(2)}`} accent={data.totals.estimatedCostUsd > 50 ? "amber" : undefined} />
          </div>

          {/* 일자별 차트 */}
          <section className="mb-8">
            <h2 className="font-semibold mb-3">일자별 호출 ({data.windowDays}일)</h2>
            <div className="rounded-xl border border-[var(--border)] p-4">
              {data.daily.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-8">데이터 없음</p>
              ) : (
                <div className="space-y-1">
                  {data.daily.map((d) => (
                    <div key={d.date} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-[var(--muted)]">{d.date}</span>
                      <div className="flex-1 h-5 bg-white/5 rounded relative overflow-hidden">
                        <div
                          className="h-full bg-[var(--green)]"
                          style={{ width: `${(d.calls / maxDailyCalls) * 100}%` }}
                        />
                        <span className="absolute left-2 top-0 leading-5 font-medium text-[var(--foreground)]">
                          {d.calls.toLocaleString()}
                        </span>
                      </div>
                      <span className="w-32 text-right text-[var(--muted)]">
                        in {fmtNum(d.inputTokens)} / out {fmtNum(d.outputTokens)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 모델별 + 엔드포인트별 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <section>
              <h2 className="font-semibold mb-3">모델별</h2>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-[var(--muted)] text-xs">
                    <tr>
                      <th className="text-left px-3 py-2">모델</th>
                      <th className="text-right px-3 py-2">호출</th>
                      <th className="text-right px-3 py-2">in / out</th>
                      <th className="text-right px-3 py-2">비용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byModel.length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-8 text-center text-[var(--muted)]">데이터 없음</td></tr>
                    ) : data.byModel.map((m) => (
                      <tr key={m.model} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2 font-mono text-xs">{m.model}</td>
                        <td className="px-3 py-2 text-right text-xs">{m.calls.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-xs text-[var(--muted)]">
                          {fmtNum(m.inputTokens)} / {fmtNum(m.outputTokens)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs">${m.estimatedCostUsd.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section>
              <h2 className="font-semibold mb-3">엔드포인트별</h2>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-[var(--muted)] text-xs">
                    <tr>
                      <th className="text-left px-3 py-2">엔드포인트</th>
                      <th className="text-right px-3 py-2">호출</th>
                      <th className="text-right px-3 py-2">in / out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byEndpoint.length === 0 ? (
                      <tr><td colSpan={3} className="px-3 py-8 text-center text-[var(--muted)]">데이터 없음</td></tr>
                    ) : data.byEndpoint.map((e) => (
                      <tr key={e.endpoint} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2 font-mono text-xs">{e.endpoint}</td>
                        <td className="px-3 py-2 text-right text-xs">{e.calls.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-xs text-[var(--muted)]">
                          {fmtNum(e.inputTokens)} / {fmtNum(e.outputTokens)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* TOP 20 사용자 */}
          <section>
            <h2 className="font-semibold mb-3">사용자 TOP 20 (호출 수 기준)</h2>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-[var(--muted)] text-xs">
                    <tr>
                      <th className="text-center px-3 py-2 w-10">#</th>
                      <th className="text-left px-3 py-2">사용자</th>
                      <th className="text-right px-3 py-2">호출</th>
                      <th className="text-right px-3 py-2">in / out</th>
                      <th className="text-left px-3 py-2">마지막 호출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-12 text-center text-[var(--muted)]">데이터 없음</td></tr>
                    ) : data.topUsers.map((u, i) => (
                      <tr key={u.userId} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2 text-center text-xs text-[var(--muted)]">{i + 1}</td>
                        <td className="px-3 py-2">
                          <Link href={`/admin/users/${u.userId}`} className="hover:text-[var(--green)] hover:underline">
                            <div className="font-medium">{u.email}</div>
                            <div className="text-xs text-[var(--muted)]">{u.name}</div>
                          </Link>
                        </td>
                        <td className={`px-3 py-2 text-right text-xs ${u.calls >= 100 ? "text-red-400 font-medium" : u.calls >= 50 ? "text-amber-400" : ""}`}>
                          {u.calls.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-[var(--muted)]">
                          {fmtNum(u.inputTokens)} / {fmtNum(u.outputTokens)}
                        </td>
                        <td className="px-3 py-2 text-xs text-[var(--muted)]">
                          {u.lastCall ? new Date(u.lastCall).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "green" | "amber" | "red" }) {
  const color =
    accent === "green" ? "text-[var(--green)]" :
    accent === "amber" ? "text-amber-400" :
    accent === "red" ? "text-red-400" : "text-[var(--foreground)]";
  return (
    <div className="p-4 rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">{icon} {label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
