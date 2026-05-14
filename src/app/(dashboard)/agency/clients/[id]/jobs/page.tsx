"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, Clock, Ban } from "lucide-react";

interface Job {
  id: string;
  channel: "naver_blog" | "threads" | "instagram";
  status: "generating" | "qc_failed" | "ready" | "published" | "cancelled";
  generationAttempts: number;
  generatedAt: string | null;
  createdAt: string;
}

const CHANNEL_LABEL: Record<Job["channel"], string> = {
  naver_blog: "네이버 블로그",
  threads: "Threads",
  instagram: "Instagram",
};

const STATUS_LABEL: Record<Job["status"], { label: string; tone: string; icon: typeof Sparkles }> = {
  generating: { label: "생성 중", tone: "text-yellow-600", icon: Clock },
  ready: { label: "발행 대기", tone: "text-[var(--green)]", icon: CheckCircle2 },
  qc_failed: { label: "QC 미달", tone: "text-red-600", icon: AlertCircle },
  published: { label: "발행 완료", tone: "text-blue-600", icon: CheckCircle2 },
  cancelled: { label: "취소", tone: "text-[var(--muted)]", icon: Ban },
};

export default function AgencyClientJobsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ channel: string; status: string; qcScore: number | null; attempts: number; tokensIn: number; tokensOut: number }[] | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/agency/clients/${clientId}/jobs`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setJobs(j.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generate = async () => {
    if (!confirm("3채널(네이버 블로그/Threads/Instagram) 콘텐츠를 한 번에 생성합니다. 진행할까요?")) return;
    setGenerating(true);
    setError(null);
    setLastResult(null);
    try {
      const r = await fetch(`/api/agency/clients/${clientId}/jobs/generate`, {
        method: "POST",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "생성 실패");
      setLastResult(j.results || []);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <section className="p-5 rounded-2xl border border-[var(--border)] flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm">콘텐츠 생성</h3>
          <p className="text-xs text-[var(--muted)] mt-1">
            가장 최근 주간 업로드를 소재로 3채널 (블로그/Threads/Instagram) 콘텐츠 한 번에 생성.
            <br />
            QC 80점 미만 시 자동 재생성 (최대 3회). 모델: Sonnet 4.6 + Haiku 4.5 QC.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={generate}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-[var(--green)] text-white text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {generating ? "생성 중..." : "이번 주 콘텐츠 생성"}
          </button>
        </div>
      </section>

      {lastResult && (
        <section className="p-5 rounded-2xl border border-[var(--green)]/40 bg-[var(--green)]/5 space-y-2">
          <h4 className="font-semibold text-sm">방금 생성 결과</h4>
          <ul className="text-xs text-[var(--muted)] space-y-1">
            {lastResult.map((r, i) => (
              <li key={i}>
                · <strong>{CHANNEL_LABEL[r.channel as Job["channel"]] || r.channel}</strong>
                {" — "}
                상태: {STATUS_LABEL[r.status as Job["status"]]?.label || r.status}, QC: {r.qcScore ?? "—"}점, 시도 {r.attempts}회, 토큰 in/out: {r.tokensIn}/{r.tokensOut}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">불러오는 중…</div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">
            아직 생성된 콘텐츠 잡이 없습니다. 위 버튼을 눌러 첫 콘텐츠를 생성하세요.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--sidebar)] text-xs text-[var(--muted)]">
              <tr>
                <th className="text-left px-4 py-3">채널</th>
                <th className="text-left px-4 py-3">상태</th>
                <th className="text-left px-4 py-3">시도</th>
                <th className="text-left px-4 py-3">생성 시각</th>
                <th className="text-right px-4 py-3">탐색</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {jobs.map((j) => {
                const s = STATUS_LABEL[j.status];
                const Icon = s.icon;
                return (
                  <tr key={j.id}>
                    <td className="px-4 py-3">{CHANNEL_LABEL[j.channel]}</td>
                    <td className={`px-4 py-3 inline-flex items-center gap-1.5 ${s.tone}`}>
                      <Icon size={14} /> {s.label}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{j.generationAttempts}회</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {j.generatedAt ? new Date(j.generatedAt).toLocaleString("ko-KR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/agency/clients/${clientId}/jobs/${j.id}`}
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
