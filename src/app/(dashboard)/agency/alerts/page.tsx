"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, AlertTriangle, AlertCircle, Info, Check, RotateCcw } from "lucide-react";

interface Alert {
  id: string;
  clientId: string | null;
  jobId: string | null;
  publicationId: string | null;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  businessName: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  qc_3_fail: "QC 3회 미달",
  publish_overrun: "발행 7분 초과",
  sentiment_drop: "감정 분석 이상",
  other: "기타",
};

const SEVERITY_STYLE: Record<string, { tone: string; icon: typeof Info }> = {
  info: { tone: "text-blue-600", icon: Info },
  warning: { tone: "text-yellow-600", icon: AlertTriangle },
  critical: { tone: "text-red-600", icon: AlertCircle },
};

const TYPE_FILTERS = ["all", "qc_3_fail", "publish_overrun", "sentiment_drop", "other"] as const;

export default function AgencyAlertsPage() {
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyUnresolved, setOnlyUnresolved] = useState(true);
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/agency/alerts?unresolved=${onlyUnresolved}&limit=200`,
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setItems(j.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [onlyUnresolved]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (alertId: string, currentlyResolved: boolean) => {
    try {
      const r = await fetch(`/api/agency/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: currentlyResolved ? "reopen" : "resolve" }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "처리 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const filtered = items.filter((a) => typeFilter === "all" || a.type === typeFilter);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">알림</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            이상 케이스만 표시. 평소엔 침묵.
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

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={onlyUnresolved}
            onChange={(e) => setOnlyUnresolved(e.target.checked)}
          />
          미해결만
        </label>
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 rounded-md border ${
                typeFilter === t
                  ? "bg-[var(--green)] text-white border-[var(--green)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {t === "all" ? "전체" : TYPE_LABEL[t] || t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-[var(--muted)]">불러오는 중…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-[var(--border)] text-center">
          <p className="text-sm text-[var(--muted)]">
            {onlyUnresolved ? "미해결 알림이 없습니다. ✨" : "표시할 알림이 없습니다."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => {
            const sev = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info;
            const Icon = sev.icon;
            return (
              <li
                key={a.id}
                className={`p-4 rounded-2xl border ${
                  a.resolvedAt
                    ? "border-[var(--border)] opacity-60"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <Icon size={16} className={`${sev.tone} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${sev.tone}`}>
                          {TYPE_LABEL[a.type] || a.type}
                        </span>
                        {a.businessName && (
                          <span className="text-xs text-[var(--muted)]">· {a.businessName}</span>
                        )}
                        <span className="text-xs text-[var(--muted)]">
                          · {new Date(a.createdAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      <p className="text-sm">{a.message}</p>
                      {a.resolvedAt && (
                        <p className="text-xs text-[var(--muted)] mt-1">
                          해결됨: {new Date(a.resolvedAt).toLocaleString("ko-KR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(a.id, !!a.resolvedAt)}
                    className="shrink-0 px-2.5 py-1 rounded-md border border-[var(--border)] text-xs inline-flex items-center gap-1"
                  >
                    {a.resolvedAt ? <><RotateCcw size={12} /> 다시 열기</> : <><Check size={12} /> 해결</>}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
