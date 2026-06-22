"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Copy, Check, Download, ExternalLink, Timer, AlertTriangle, AlertCircle,
  Send, ShieldCheck,
} from "lucide-react";

interface ClientMeta { id: string; businessName: string; }
interface Job { id: string; channel: string; status: string; }
interface Draft {
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

interface StartResp {
  publicationId: string;
  cleanBody: string;
  title: string | null;
  hashtagsLine: string;
  images: { url: string; filename: string; caption: string | null }[];
  publishStartedAt: string;
}

export default function PortalPublishPage() {
  const params = useParams<{ token: string; jobId: string }>();
  const { token, jobId } = params;

  const [client, setClient] = useState<ClientMeta | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [phase, setPhase] = useState<"loading" | "invalid" | "ready" | "started" | "done">("loading");
  const [invalidReason, setInvalidReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [started, setStarted] = useState<StartResp | null>(null);
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [externalUrl, setExternalUrl] = useState("");
  const [copyKey, setCopyKey] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<{ durationSeconds: number; overrun: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/portal/agency/${token}/jobs/${jobId}`);
      const j = await r.json();
      if (!r.ok) {
        setPhase("invalid");
        setInvalidReason(j.status || j.error || "unknown");
        return;
      }
      setClient(j.client);
      setJob(j.job);
      setDraft(j.draft);
      setPhase("ready");
    } catch (e) {
      setPhase("invalid");
      setInvalidReason(e instanceof Error ? e.message : "network");
    }
  }, [token, jobId]);

  useEffect(() => { load(); }, [load]);

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
    setCopyKey(key);
    setTimeout(() => setCopyKey(null), 1500);
  };

  const downloadZip = async (images: { url: string; filename: string }[]) => {
    if (images.length === 0) return;
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
  };

  const startPublish = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/portal/agency/${token}/publish/${jobId}/start`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "발행 시작 실패");
      setStarted(j);
      setPhase("started");
      await navigator.clipboard.writeText(j.cleanBody);
      void downloadZip(j.images);
      window.open(NAVER_WRITE_URL, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const completePublish = async () => {
    if (!started) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/portal/agency/${token}/publish/${jobId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicationId: started.publicationId,
          externalPostUrl: externalUrl.trim() || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "완료 처리 실패");
      setCompleted({
        durationSeconds: j.durationSeconds,
        overrun: !!j.overrunAlert,
      });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--muted)]">
        불러오는 중…
      </div>
    );
  }

  if (phase === "invalid") {
    const msgs: Record<string, string> = {
      not_found: "유효하지 않은 링크입니다. 담당 매니저에게 문의하세요.",
      expired: "약정 기간이 종료되어 링크가 만료되었습니다.",
      revoked: "이 링크는 폐기되었습니다.",
      rotated: "이 링크는 새 링크로 교체되었습니다. 최신 카카오 알림톡 링크를 사용해주세요.",
    };
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--border)] text-center space-y-3">
          <AlertCircle size={40} className="mx-auto text-red-500" />
          <h1 className="text-lg font-bold">링크를 사용할 수 없습니다</h1>
          <p className="text-sm text-[var(--muted)]">
            {msgs[invalidReason] || `오류: ${invalidReason}`}
          </p>
        </div>
      </div>
    );
  }

  if (!job || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-red-600">
        잡 또는 초안을 찾을 수 없습니다
      </div>
    );
  }

  if (job.channel !== "naver_blog") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--border)] text-center space-y-3">
          <ShieldCheck size={32} className="mx-auto text-[var(--muted)]" />
          <h1 className="text-lg font-bold">{job.channel} 발행</h1>
          <p className="text-sm text-[var(--muted)]">
            {job.channel} 발행은 담당 매니저가 진행합니다. 본 화면은 네이버 블로그 발행 전용입니다.
          </p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isOver7 = elapsed > 420;
  const allChecked = checked.every(Boolean);

  if (phase === "done" && completed) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className={`w-full max-w-md p-8 rounded-2xl border text-center space-y-3 ${
          completed.overrun ? "border-red-300 bg-red-50" : "border-[var(--green)]/40 bg-[var(--green)]/5"
        }`}>
          <Check size={40} className={`mx-auto ${completed.overrun ? "text-red-600" : "text-[var(--green)]"}`} />
          <h1 className="text-lg font-bold">
            {completed.overrun ? "발행 완료 — 7분 초과" : "발행 완료"}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            소요 시간: {Math.floor(completed.durationSeconds / 60)}분 {completed.durationSeconds % 60}초
          </p>
          <p className="text-xs text-[var(--muted)]">
            담당 매니저가 결과를 검토합니다. 본 창은 닫으셔도 됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green)]/10 text-[var(--green)] text-xs">
            <ShieldCheck size={14} /> 클라이언트 전용
          </div>
          <h1 className="text-2xl font-bold mt-3">네이버 블로그 발행</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{client?.businessName}</p>
        </header>

        {error && (
          <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2 space-y-4">
            <article className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-3">
              {draft.title && <h1 className="text-xl font-bold">{draft.title}</h1>}
              <div className="whitespace-pre-wrap text-sm">{draft.bodyMarkdown}</div>
              {(draft.hashtags?.length ?? 0) > 0 && (
                <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                  태그: {draft.hashtags!.join(" ")}
                </div>
              )}
            </article>

            {!started && (
              <button
                onClick={startPublish}
                disabled={busy || job.status !== "ready"}
                className="w-full py-3 rounded-2xl bg-[var(--green)] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {job.status !== "ready" ? `발행 가능한 상태가 아닙니다 (${job.status})` : "발행 시작"}
              </button>
            )}

            {started && (
              <section className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">발행 진행 중</h3>
                  <span className={`inline-flex items-center gap-1 text-xs ${isOver7 ? "text-red-600" : "text-[var(--muted)]"}`}>
                    {isOver7 && <AlertTriangle size={12} />}
                    <Timer size={12} /> 경과 {minutes}:{String(seconds).padStart(2, "0")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <button onClick={() => copy(started.cleanBody, "body")} className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5">
                    {copyKey === "body" ? <Check size={12} /> : <Copy size={12} />} 본문 다시 복사
                  </button>
                  {started.title && (
                    <button onClick={() => copy(started.title!, "title")} className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5">
                      {copyKey === "title" ? <Check size={12} /> : <Copy size={12} />} 제목 복사
                    </button>
                  )}
                  {started.hashtagsLine && (
                    <button onClick={() => copy(started.hashtagsLine, "tags")} className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5">
                      {copyKey === "tags" ? <Check size={12} /> : <Copy size={12} />} 태그 복사
                    </button>
                  )}
                  <button onClick={() => downloadZip(started.images)} className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5">
                    <Download size={12} /> 이미지 zip 재다운로드
                  </button>
                  <a href={NAVER_WRITE_URL} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5">
                    <ExternalLink size={12} /> 네이버 글쓰기 다시 열기
                  </a>
                </div>

                <label className="block mt-3">
                  <span className="block text-xs text-[var(--muted)] mb-1">발행된 글 URL (선택)</span>
                  <input
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://blog.naver.com/..."
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
                  <p className="text-xs text-[var(--muted)] text-center">우측 사이드바의 5단계를 모두 체크하면 활성화됩니다.</p>
                )}
              </section>
            )}
          </main>

          <aside className="space-y-4">
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-white">
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
                      disabled={!started}
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
                <p>· 7분 안에 끝내주시면 가장 좋습니다</p>
              </div>
            </div>

            {(draft.imageMarkers?.length ?? 0) > 0 && (
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-white">
                <h4 className="text-xs font-semibold mb-2">이미지 ({draft.imageMarkers!.length}장)</h4>
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
      </div>
    </div>
  );
}
