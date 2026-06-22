"use client";


import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Sparkles, RefreshCw, ExternalLink } from "lucide-react";

interface Report {
  id: string;
  yearMonth: string;
  totalPublished: number;
  avgPublishTimeSeconds: number | null;
  searchVisibility: {
    total: number;
    rank1_10: number;
    rank11_30: number;
    rank31plus: number;
    notFound: number;
  } | null;
  reportUrl: string | null;
  generatedAt: string;
}

function defaultYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AgencyClientReportsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [yearMonth, setYearMonth] = useState(defaultYearMonth());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/agency/clients/${clientId}/monthly-reports`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setReports(j.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { refresh(); }, [refresh]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const r = await apiFetch(`/api/agency/clients/${clientId}/monthly-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "생성 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const fmtDuration = (secs: number | null) => {
    if (secs == null) return "—";
    return `${Math.floor(secs / 60)}분 ${secs % 60}초`;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <section className="p-5 rounded-2xl border border-[var(--border)] flex items-end gap-3">
        <label className="block">
          <span className="block text-xs text-[var(--muted)] mb-1">대상 연월</span>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
          />
        </label>
        <button
          onClick={generate}
          disabled={generating}
          className="px-4 py-2 rounded-xl bg-[var(--green)] text-white text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {generating ? "생성 중..." : "리포트 생성"}
        </button>
        <button
          onClick={refresh}
          className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
        >
          <RefreshCw size={14} />
        </button>
      </section>

      {loading ? (
        <div className="p-10 text-center text-sm text-[var(--muted)]">불러오는 중…</div>
      ) : reports.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-[var(--border)] text-center">
          <p className="text-sm text-[var(--muted)]">
            아직 생성된 리포트가 없습니다. 위에서 연월을 선택하고 "리포트 생성" 클릭.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const vis = r.searchVisibility;
            return (
              <article key={r.id} className="p-5 rounded-2xl border border-[var(--border)]">
                <header className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{r.yearMonth}</h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      생성: {new Date(r.generatedAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  {r.reportUrl && (
                    <a
                      href={r.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[var(--green)] text-white text-xs inline-flex items-center gap-1"
                    >
                      <ExternalLink size={14} /> HTML 리포트 열기
                    </a>
                  )}
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[var(--sidebar)]">
                    <div className="text-[var(--muted)]">총 발행</div>
                    <div className="text-lg font-bold mt-1">{r.totalPublished}건</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--sidebar)]">
                    <div className="text-[var(--muted)]">평균 발행 소요</div>
                    <div className="text-lg font-bold mt-1">{fmtDuration(r.avgPublishTimeSeconds)}</div>
                  </div>
                  {vis && (
                    <>
                      <div className="p-3 rounded-lg bg-[var(--sidebar)]">
                        <div className="text-[var(--muted)]">검색 노출 1~10위</div>
                        <div className="text-lg font-bold mt-1 text-[var(--green)]">{vis.rank1_10}건</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--sidebar)]">
                        <div className="text-[var(--muted)]">키워드 총</div>
                        <div className="text-lg font-bold mt-1">{vis.total}개</div>
                      </div>
                    </>
                  )}
                </div>

                {r.reportUrl && (
                  <iframe
                    src={r.reportUrl}
                    className="w-full h-96 mt-4 rounded-lg border border-[var(--border)]"
                    title={`${r.yearMonth} 리포트`}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
