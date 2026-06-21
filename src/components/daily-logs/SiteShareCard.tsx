"use client";

import { useEffect, useState } from "react";
import { Share2, Copy, CheckCircle2, Loader2, ExternalLink, RotateCcw, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface ShareTokenRow {
  id: string;
  token: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

interface Props {
  siteId: string;
  siteName: string;
}

/**
 * 현장의 영구 공유 링크 카드.
 *
 * 의도:
 * - 한 번 발급한 토큰은 계속 유지. 이후 작성하는 일지 중 공유 토글이 켜진 것들이
 *   자동으로 같은 링크에 추가됨.
 * - 사용자는 한 번만 링크를 복사해 고객에게 보내면, 매일 업데이트되는 일지를
 *   고객이 같은 URL 에서 확인.
 * - 새 발급 버튼은 일부러 노출하지 않음. "토큰 새로 만들기"가 필요하면 먼저 취소 후 다시 발급.
 */
export default function SiteShareCard({ siteId, siteName }: Props) {
  const [share, setShare] = useState<ShareTokenRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url =
    share && typeof window !== "undefined"
      ? `${window.location.origin}/d/${share.token}`
      : "";

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/daily-logs/sites/${siteId}/share`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "조회 실패");
        return;
      }
      const payload = data?.data ?? data;
      setShare(payload?.token ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setShare(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function issue() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/daily-logs/sites/${siteId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "발급 실패");
        return;
      }
      const payload = data?.data ?? data;
      setShare(payload?.token ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (
      !confirm(
        "현재 공유 링크를 취소합니다. 고객이 더 이상 이 URL로 접근할 수 없게 됩니다. 진행할까요?",
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/daily-logs/sites/${siteId}/share`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "취소 실패");
        return;
      }
      setShare(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      window.prompt("아래 링크를 복사해주세요", url);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Share2 size={16} className="text-[var(--green)]" />
          <h3 className="font-semibold text-sm">{siteName} — 고객 공유</h3>
        </div>
        {share && (
          <button
            onClick={revoke}
            disabled={busy}
            className="text-[10px] text-[var(--muted)] hover:text-red-400 inline-flex items-center gap-1 disabled:opacity-50"
            title="현재 링크를 취소"
          >
            <RotateCcw size={11} />
            취소
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] py-2">
          <Loader2 size={12} className="animate-spin" />
          확인 중...
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 flex items-start gap-1">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      ) : share ? (
        <div className="space-y-2">
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            이 링크 하나로 계속 사용하세요. 새로 작성하는 일지에서{" "}
            <strong className="text-[var(--foreground)]">고객에게 공유</strong> 토글을 켜면
            같은 링크에 자동으로 추가됩니다.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs font-mono truncate">
              {url}
            </div>
            <button
              onClick={copy}
              disabled={!url}
              className="px-3 py-2 rounded-lg bg-[var(--green)] text-black text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={12} />
                  복사됨
                </>
              ) : (
                <>
                  <Copy size={12} />
                  복사
                </>
              )}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg border border-[var(--border)] text-xs inline-flex items-center gap-1 hover:bg-white/[0.04] whitespace-nowrap"
              title="새 창에서 미리 보기"
            >
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
            <span>
              발급일{" "}
              {new Date(share.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
            {share.expiresAt ? (
              <span>
                만료{" "}
                {new Date(share.expiresAt).toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            ) : (
              <span>만료 없음 (영구)</span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            아직 공유 링크가 없습니다. 한 번 발급하면 그 링크가 영구적으로 유지되며, 새 일지를{" "}
            <strong className="text-[var(--foreground)]">고객에게 공유</strong> 토글을 켜고
            저장할 때마다 같은 링크에 자동으로 추가됩니다.
          </p>
          <button
            onClick={issue}
            disabled={busy}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                발급 중...
              </>
            ) : (
              <>
                <Share2 size={14} />
                고객 공유 링크 발급
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
