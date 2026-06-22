"use client";


import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Copy, Check, Download, ExternalLink, Timer, AlertTriangle, ArrowLeft, Send, ShieldCheck, X,
} from "lucide-react";

interface Job {
  id: string;
  channel: "naver_blog" | "threads" | "instagram";
  status: string;
}
interface Draft {
  id: string;
  title: string | null;
  bodyMarkdown: string;
  hashtags: string[] | null;
  imageMarkers: { marker: string; imageUrl: string; caption?: string | null }[] | null;
}

const NAVER_WRITE_URL = "https://blog.naver.com/PostWriteForm.naver";
const STEPS = [
  "본문 붙여넣기 (Ctrl+V)",
  "이미지 마커 자리에 사진 첨부",
  "제목 복사 → 붙여넣기",
  "태그 복사 → 붙여넣기",
  "네이버에서 발행 버튼 클릭",
] as const;

interface PublishStartResp {
  publicationId: string;
  cleanBody: string;
  title: string | null;
  hashtagsLine: string;
  images: { url: string; filename: string; caption: string | null }[];
  publishStartedAt: string;
}

export default function PublishPage() {
  const params = useParams<{ id: string; jobId: string }>();
  const { id: clientId, jobId } = params;

  const [job, setJob] = useState<Job | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 네이버 복붙 흐름 상태
  const [started, setStarted] = useState<PublishStartResp | null>(null);
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [externalUrl, setExternalUrl] = useState("");
  const [copyTarget, setCopyTarget] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState<{ durationSeconds: number; overrun: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  // SNS 발행 상태
  const [snsResult, setSnsResult] = useState<{ channelPostUrl?: string; channel: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/agency/clients/${clientId}/jobs/${jobId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setJob(j.job);
      setDraft(j.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clientId, jobId]);

  useEffect(() => { refresh(); }, [refresh]);

  // 7분 타이머
  useEffect(() => {
    if (!started || completed) return;
    const startMs = new Date(started.publishStartedAt).getTime();
    const tick = () => setElapsed(Math.round((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [started, completed]);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopyTarget(key);
    setTimeout(() => setCopyTarget(null), 1500);
  };

  /** 발행 시작: API 호출 + clipboard + zip download + 새 탭 */
  const startPublish = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/agency/clients/${clientId}/jobs/${jobId}/publish/start`,
        { method: "POST" },
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "발행 시작 실패");
      setStarted(j);

      // 1) 클립보드 복사 (cleanBody)
      await navigator.clipboard.writeText(j.cleanBody);

      // 2) 이미지 zip 다운로드 (백그라운드)
      void downloadZip(j.images);

      // 3) 네이버 글쓰기 새 탭
      window.open(NAVER_WRITE_URL, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  /** JSZip + blob 다운로드 */
  const downloadZip = async (images: { url: string; filename: string }[]) => {
    if (images.length === 0) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const img of images) {
        const resp = await fetch(img.url);
        const blob = await resp.blob();
        zip.file(img.filename, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${draft?.title?.replace(/[^a-zA-Z0-9가-힣]/g, "_") || "images"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`zip 다운로드 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  /** 발행 완료 토글 */
  const completePublish = async () => {
    if (!started) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/agency/clients/${clientId}/jobs/${jobId}/publish/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicationId: started.publicationId,
            externalPostUrl: externalUrl.trim() || null,
          }),
        },
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "완료 처리 실패");
      setCompleted({
        durationSeconds: j.durationSeconds,
        overrun: !!j.overrunAlert,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  /** SNS 자동 발행 (Threads/Instagram) */
  const snsPublish = async () => {
    if (!confirm(`${job?.channel} 채널에 즉시 발행합니다. 진행할까요?`)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch(`/api/agency/clients/${clientId}/jobs/${jobId}/publish/sns`, {
        method: "POST",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "SNS 발행 실패");
      setSnsResult({ channelPostUrl: j.channelPostUrl, channel: job!.channel });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section className="p-6 text-sm text-[var(--muted)]">불러오는 중…</section>;
  if (!job || !draft) return <section className="p-6 text-sm text-red-600">잡 또는 초안을 찾을 수 없습니다</section>;

  const isNaver = job.channel === "naver_blog";
  const isSns = job.channel === "threads" || job.channel === "instagram";
  const allChecked = checked.every(Boolean);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isOver7 = elapsed > 420;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <Link
          href={`/agency/clients/${clientId}/jobs/${jobId}`}
          className="text-xs text-[var(--muted)] inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> 잡 상세
        </Link>
        <div className="text-xs text-[var(--muted)]">
          채널: <strong>{job.channel}</strong> · 상태: <strong>{job.status}</strong>
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {job.status === "published" && !completed && !snsResult && (
        <div className="p-4 rounded-xl border border-[var(--green)]/40 bg-[var(--green)]/5 text-sm">
          이미 발행 완료된 잡입니다. 발행 화면은 참고용입니다.
        </div>
      )}

      {/* ────── 네이버 블로그 복붙 흐름 ────── */}
      {isNaver && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2 space-y-4">
            <article className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
              {draft.title && <h1 className="text-xl font-bold">{draft.title}</h1>}
              <div className="whitespace-pre-wrap text-sm">{draft.bodyMarkdown}</div>
              {(draft.hashtags?.length ?? 0) > 0 && (
                <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                  태그: {draft.hashtags!.join(" ")}
                </div>
              )}
            </article>

            {!started && job.status === "ready" && (
              <button
                onClick={startPublish}
                disabled={busy}
                className="w-full py-3 rounded-2xl bg-[var(--green)] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={18} /> 발행 시작 — 본문 복사 + 이미지 zip + 네이버 글쓰기 탭 오픈
              </button>
            )}

            {started && !completed && (
              <section className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">발행 진행 중</h3>
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${isOver7 ? "text-red-600" : "text-[var(--muted)]"}`}
                  >
                    {isOver7 && <AlertTriangle size={12} />}
                    <Timer size={12} /> 경과 {minutes}:{String(seconds).padStart(2, "0")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => copy(started.cleanBody, "body")}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5"
                  >
                    {copyTarget === "body" ? <Check size={12} /> : <Copy size={12} />} 본문 다시 복사
                  </button>
                  {started.title && (
                    <button
                      onClick={() => copy(started.title!, "title")}
                      className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5"
                    >
                      {copyTarget === "title" ? <Check size={12} /> : <Copy size={12} />} 제목 복사
                    </button>
                  )}
                  {started.hashtagsLine && (
                    <button
                      onClick={() => copy(started.hashtagsLine, "tags")}
                      className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5"
                    >
                      {copyTarget === "tags" ? <Check size={12} /> : <Copy size={12} />} 태그 복사
                    </button>
                  )}
                  <button
                    onClick={() => downloadZip(started.images)}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5"
                  >
                    <Download size={12} /> 이미지 zip 재다운로드 ({started.images.length}장)
                  </button>
                  <a
                    href={NAVER_WRITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={12} /> 네이버 글쓰기 다시 열기
                  </a>
                </div>

                <label className="block mt-3">
                  <span className="block text-xs text-[var(--muted)] mb-1">발행된 글 URL (선택)</span>
                  <input
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://blog.naver.com/.../..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
                  />
                </label>

                <button
                  onClick={completePublish}
                  disabled={!allChecked || busy}
                  className="w-full py-2 rounded-xl bg-[var(--green)] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {busy ? "처리 중..." : "발행 완료"}
                </button>
                {!allChecked && (
                  <p className="text-xs text-[var(--muted)] text-center">
                    우측 사이드바의 5단계를 모두 체크하면 활성화됩니다.
                  </p>
                )}
              </section>
            )}

            {completed && (
              <section
                className={`p-5 rounded-2xl border ${completed.overrun ? "border-red-300 bg-red-50" : "border-[var(--green)]/40 bg-[var(--green)]/5"}`}
              >
                <h3 className="font-semibold text-sm mb-1">
                  {completed.overrun ? "발행 완료 — 7분 초과" : "발행 완료"}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  소요 시간: {Math.floor(completed.durationSeconds / 60)}분 {completed.durationSeconds % 60}초
                  {completed.overrun && " (publish_overrun 알림 생성됨)"}
                </p>
              </section>
            )}
          </main>

          {/* Sidebar: 5단계 가이드 + 이미지 placeholder */}
          <aside className="space-y-4">
            <div className="p-5 rounded-2xl border border-[var(--border)]">
              <h3 className="font-semibold text-sm mb-3">발행 가이드 (5단계)</h3>
              <ol className="space-y-2 text-xs">
                {STEPS.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={(e) => {
                        const next = [...checked];
                        next[i] = e.target.checked;
                        setChecked(next);
                      }}
                      disabled={!started || !!completed}
                      className="mt-0.5"
                    />
                    <span className={checked[i] ? "line-through text-[var(--muted)]" : ""}>
                      <span className="font-mono text-[var(--green)] mr-1">{i + 1}.</span>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--muted)]">
                <p>· 본문은 클립보드에 자동 복사 (마커 [이미지N] 제거됨)</p>
                <p>· 이미지 zip은 자동 다운로드</p>
                <p>· 7분 초과 시 publish_overrun 알림 자동 생성</p>
              </div>
            </div>

            {(draft.imageMarkers?.length ?? 0) > 0 && (
              <div className="p-5 rounded-2xl border border-[var(--border)]">
                <h4 className="text-xs font-semibold mb-2">이미지 placeholder ({draft.imageMarkers!.length}장)</h4>
                <p className="text-[11px] text-[var(--muted)] mb-2">
                  네이버 블로그에서 아래 순서대로 이미지 첨부.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {draft.imageMarkers!.map((m, i) => (
                    <div key={i} className="rounded-md overflow-hidden border border-[var(--border)]">
                      <img src={m.imageUrl} alt={m.caption || ""} className="w-full aspect-square object-cover" />
                      <p className="px-1 py-0.5 text-[10px] text-[var(--green)] font-mono">{m.marker}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ────── SNS 자동 발행 흐름 ────── */}
      {isSns && (
        <div className="space-y-4">
          <article className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
            <h3 className="font-semibold text-sm">{job.channel} 콘텐츠 미리보기</h3>
            <div className="whitespace-pre-wrap text-sm">{draft.bodyMarkdown}</div>
            {(draft.hashtags?.length ?? 0) > 0 && (
              <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                해시태그: {draft.hashtags!.join(" ")}
              </div>
            )}
            {(draft.imageMarkers?.length ?? 0) > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {draft.imageMarkers!.map((m, i) => (
                  <img key={i} src={m.imageUrl} alt="" className="w-full aspect-square object-cover rounded" />
                ))}
              </div>
            )}
          </article>

          {!snsResult && job.status === "ready" && (
            <button
              onClick={snsPublish}
              disabled={busy}
              className="w-full py-3 rounded-2xl bg-[var(--green)] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={18} /> {job.channel}에 지금 발행
            </button>
          )}

          {snsResult && (
            <section className="p-5 rounded-2xl border border-[var(--green)]/40 bg-[var(--green)]/5 space-y-2">
              <h3 className="font-semibold text-sm">발행 완료</h3>
              {snsResult.channelPostUrl && (
                <a
                  href={snsResult.channelPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[var(--green)] underline"
                >
                  <ExternalLink size={14} /> {snsResult.channelPostUrl}
                </a>
              )}
            </section>
          )}

          <div className="p-4 rounded-xl bg-[var(--sidebar)] text-xs text-[var(--muted)] space-y-1">
            <p className="font-semibold flex items-center gap-1 text-[var(--foreground)]">
              <ShieldCheck size={12} /> 토큰 안내
            </p>
            <p>· 운영자 본인 marketingChannels에 등록된 Meta {job.channel} 토큰을 사용합니다.</p>
            <p>· OAuth 미연결 시 401 응답. /marketing/{job.channel}에서 계정 연결 후 재시도.</p>
            <p>· Phase 4 베타: 비-dogfood 클라이언트 토큰 분리는 Phase 5에서.</p>
          </div>
        </div>
      )}
    </div>
  );
}
