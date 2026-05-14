"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Save, CheckCircle2, X, Send } from "lucide-react";

interface ImageMarker {
  marker: string;
  imageUrl: string;
  caption?: string | null;
  position?: { paragraphIndex?: number | null; charOffset?: number | null; nodePath?: string | null } | null;
}

interface MaterialCitation {
  materialId: string;
  mentionedPrice: number;
  verifiedPrice: number | null;
  deltaPct: number | null;
}

interface Job {
  id: string;
  channel: string;
  status: string;
  generationAttempts: number;
  generatedAt: string | null;
}

interface Draft {
  id: string;
  title: string | null;
  bodyMarkdown: string;
  hashtags: string[] | null;
  imageMarkers: ImageMarker[] | null;
  materialCitations: MaterialCitation[] | null;
  qcScore: number | null;
  qcFeedback: string | null;
  qcPassedAt: string | null;
}

const CHANNEL_LABEL: Record<string, string> = {
  naver_blog: "네이버 블로그",
  threads: "Threads",
  instagram: "Instagram",
};

export default function AgencyJobDetailPage() {
  const params = useParams<{ id: string; jobId: string }>();
  const { id: clientId, jobId } = params;

  const [job, setJob] = useState<Job | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hashtagsCsv, setHashtagsCsv] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/agency/clients/${clientId}/jobs/${jobId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setJob(j.job);
      setDraft(j.draft);
      setTitle(j.draft?.title || "");
      setBody(j.draft?.bodyMarkdown || "");
      setHashtagsCsv((j.draft?.hashtags || []).join(", "));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clientId, jobId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title,
        bodyMarkdown: body,
        hashtags: hashtagsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const r = await fetch(`/api/agency/clients/${clientId}/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "저장 실패");
      setEditing(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/agency/clients/${clientId}/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "상태 변경 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section className="p-6 text-sm text-[var(--muted)]">불러오는 중…</section>;
  if (!job) return <section className="p-6 text-sm text-red-600">잡을 찾을 수 없습니다</section>;

  const markers = draft?.imageMarkers || [];
  const cites = draft?.materialCitations || [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <Link
          href={`/agency/clients/${clientId}/jobs`}
          className="text-xs text-[var(--muted)] inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> 잡 목록
        </Link>
        <div className="flex gap-2">
          {job.status === "ready" && (
            <Link
              href={`/agency/clients/${clientId}/publish/${jobId}`}
              className="px-3 py-2 rounded-xl bg-[var(--green)] text-white text-xs inline-flex items-center gap-1"
            >
              <Send size={14} /> 발행 화면으로
            </Link>
          )}
          {job.status === "qc_failed" && (
            <button
              onClick={() => changeStatus("ready")}
              disabled={busy}
              className="px-3 py-2 rounded-xl bg-[var(--green)] text-white text-xs inline-flex items-center gap-1"
            >
              <CheckCircle2 size={14} /> 강제 발행 준비 (ready)
            </button>
          )}
          {job.status !== "cancelled" && job.status !== "published" && (
            <button
              onClick={() => changeStatus("cancelled")}
              disabled={busy}
              className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
            >
              <X size={14} /> 취소
            </button>
          )}
          {!editing && draft && (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
            >
              <Edit size={14} /> 수정
            </button>
          )}
          {editing && (
            <button
              onClick={save}
              disabled={busy}
              className="px-3 py-2 rounded-xl bg-[var(--green)] text-white text-xs inline-flex items-center gap-1"
            >
              <Save size={14} /> 저장
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-2xl border border-[var(--border)] text-xs">
        <div>
          <div className="text-[var(--muted)]">채널</div>
          <div className="font-semibold">{CHANNEL_LABEL[job.channel] || job.channel}</div>
        </div>
        <div>
          <div className="text-[var(--muted)]">상태</div>
          <div className="font-semibold">{job.status}</div>
        </div>
        <div>
          <div className="text-[var(--muted)]">시도</div>
          <div className="font-semibold">{job.generationAttempts}회</div>
        </div>
        <div>
          <div className="text-[var(--muted)]">QC</div>
          <div className="font-semibold">
            {draft?.qcScore ?? "—"}점 {draft?.qcPassedAt ? "(통과)" : ""}
          </div>
        </div>
      </section>

      {draft?.qcFeedback && (
        <section className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--sidebar)]">
          <h4 className="text-xs font-semibold text-[var(--muted)] mb-1">QC 피드백</h4>
          <p className="text-sm">{draft.qcFeedback}</p>
        </section>
      )}

      {!draft ? (
        <div className="p-10 rounded-2xl border border-dashed border-[var(--border)] text-center text-sm text-[var(--muted)]">
          초안이 아직 생성되지 않았습니다.
        </div>
      ) : (
        <section className="space-y-4">
          {editing ? (
            <div className="space-y-3">
              <label className="block">
                <span className="block text-xs text-[var(--muted)] mb-1">제목</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-[var(--muted)] mb-1">본문 (마크다운, [이미지N] 마커 유지)</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={20}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm font-mono"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-[var(--muted)] mb-1">해시태그 (쉼표 구분)</span>
                <input
                  value={hashtagsCsv}
                  onChange={(e) => setHashtagsCsv(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
                />
              </label>
            </div>
          ) : (
            <article className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
              {draft.title && <h1 className="text-xl font-bold">{draft.title}</h1>}
              <div className="whitespace-pre-wrap text-sm">{draft.bodyMarkdown}</div>
              <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                해시태그: {(draft.hashtags || []).join(" ")}
              </div>
            </article>
          )}

          {markers.length > 0 && (
            <section className="p-5 rounded-2xl border border-[var(--border)]">
              <h4 className="text-sm font-semibold mb-3">
                이미지 마커 ({markers.length}개) — Phase 4 복붙 UX에서 활용
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {markers.map((m, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-[var(--border)]">
                    <img src={m.imageUrl} alt={m.caption || ""} className="w-full aspect-square object-cover" />
                    <div className="p-2 text-xs">
                      <code className="text-[var(--green)]">{m.marker}</code>
                      <p className="text-[var(--muted)] truncate mt-1">{m.caption || "—"}</p>
                      {m.position?.paragraphIndex != null && (
                        <p className="text-[var(--muted)] text-[10px] mt-0.5">
                          단락 #{m.position.paragraphIndex}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cites.length > 0 && (
            <section className="p-5 rounded-2xl border border-[var(--border)]">
              <h4 className="text-sm font-semibold mb-3">
                자재 단가 인용 검증 ({cites.length}건)
              </h4>
              <table className="w-full text-xs">
                <thead className="text-[var(--muted)]">
                  <tr>
                    <th className="text-left py-1">자재 ID</th>
                    <th className="text-right py-1">언급 가격</th>
                    <th className="text-right py-1">시세</th>
                    <th className="text-right py-1">편차</th>
                  </tr>
                </thead>
                <tbody>
                  {cites.map((c, i) => {
                    const high = c.deltaPct != null && Math.abs(c.deltaPct) > 30;
                    return (
                      <tr key={i} className={high ? "text-red-600" : ""}>
                        <td className="py-1 font-mono">{c.materialId.slice(0, 8)}…</td>
                        <td className="text-right py-1">{c.mentionedPrice.toLocaleString()}원</td>
                        <td className="text-right py-1">
                          {c.verifiedPrice?.toLocaleString() ?? "—"}원
                        </td>
                        <td className="text-right py-1">
                          {c.deltaPct != null ? `${c.deltaPct > 0 ? "+" : ""}${c.deltaPct}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-[var(--muted)] mt-2">
                ±30% 초과는 검토 권장 (붉은색).
              </p>
            </section>
          )}
        </section>
      )}
    </div>
  );
}
