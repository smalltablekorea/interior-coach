"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Trash2, Users, Share2,
  ImagePlus, X as XIcon, Loader2, Link as LinkIcon, Copy, Check,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api-client";
import { fmtDate } from "@/lib/utils";
import type { DailyLog, Weather } from "@/types/daily-log";

const WEATHER_LABEL: Record<Weather, string> = {
  sunny: "☀️ 맑음",
  cloudy: "☁️ 흐림",
  rainy: "🌧️ 비",
  snowy: "❄️ 눈",
  hot: "🔥 더움",
  cold: "🥶 추움",
};

export default function DailyLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 현장 공유 링크 모달
  const [showShare, setShowShare] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch(`/api/daily-logs/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const d = data?.data ?? data;
        if (d?.id) setLog(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const toggleShare = async () => {
    if (!log || saving) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/daily-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharedToCustomer: !log.sharedToCustomer }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data?.data ?? data;
        if (updated?.id) setLog((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    } finally {
      setSaving(false);
    }
  };

  /** 사진 추가 — 다중 업로드 후 PATCH로 photoUrls 통째로 교체 */
  const addPhotos = async (files: FileList | null) => {
    if (!log || !files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "daily-log");
        const res = await apiFetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        const url = data?.data?.url;
        if (res.ok && url) uploaded.push(url);
      }
      const next = [...(log.photoUrls || []), ...uploaded];
      const patchRes = await apiFetch(`/api/daily-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrls: next }),
      });
      if (patchRes.ok) {
        setLog((prev) => (prev ? { ...prev, photoUrls: next } : prev));
      }
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (idx: number) => {
    if (!log) return;
    const next = (log.photoUrls || []).filter((_, i) => i !== idx);
    setLog({ ...log, photoUrls: next });
    await apiFetch(`/api/daily-logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrls: next }),
    });
  };

  /** 현장 단위 공유 링크 발급(있으면 재사용) */
  const issueShareLink = async () => {
    if (!log) return;
    setShareLoading(true);
    setShareError(null);
    setShareUrl(null);
    try {
      const res = await apiFetch(`/api/daily-logs/sites/${log.siteId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setShareError(data?.error?.message || data?.error || "링크 발급에 실패했습니다.");
        return;
      }
      setShareUrl(data?.data?.url || null);
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "링크 발급에 실패했습니다.");
    } finally {
      setShareLoading(false);
    }
  };

  const openShareModal = async () => {
    setShowShare(true);
    setCopied(false);
    await issueShareLink();
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDelete = async () => {
    const res = await apiFetch(`/api/daily-logs/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/daily-logs");
  };

  if (loading) return <div className="h-32 rounded-2xl animate-shimmer" />;
  if (!log) return <p className="text-sm text-[var(--muted)]">업무일지를 찾을 수 없습니다.</p>;

  const photos = log.photoUrls || [];

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/daily-logs"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] shrink-0"
            aria-label="업무일지 목록"
          >
            <ArrowLeft size={18} />
          </Link>
          <ClipboardList size={22} className="text-[var(--blue)] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{log.summary}</h1>
            <p className="text-xs text-[var(--muted)] truncate">
              {fmtDate(log.logDate)} · {log.siteName || "-"} · {log.authorName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openShareModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] hover:border-[var(--green)] hover:text-[var(--green)]"
            title="고객 공유 링크"
          >
            <LinkIcon size={14} />
            <span className="hidden sm:inline">공유 링크</span>
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
            aria-label="업무일지 삭제"
            title="삭제"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* 메타 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] text-[var(--muted)]">날씨</p>
          <p className="mt-1 text-sm">{log.weather ? WEATHER_LABEL[log.weather] : "—"}</p>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] text-[var(--muted)]">참여 인원</p>
          <p className="mt-1 text-sm font-bold flex items-center gap-1">
            <Users size={14} className="text-[var(--muted)]" />
            {log.workerCount ?? 0}명
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] col-span-2 sm:col-span-1">
          <p className="text-[10px] text-[var(--muted)]">작업 공종</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(log.tradesWorkedNames ?? []).length === 0 ? (
              <span className="text-xs text-[var(--muted)]">—</span>
            ) : (
              log.tradesWorkedNames!.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05]">
                  {t}
                </span>
              ))
            )}
          </div>
        </div>
        <button
          onClick={toggleShare}
          disabled={saving}
          className={`p-4 rounded-2xl border text-left transition-colors ${
            log.sharedToCustomer
              ? "border-[var(--green)]/50 bg-[var(--green)]/10"
              : "border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04]"
          }`}
        >
          <p className="text-[10px] text-[var(--muted)] flex items-center gap-1">
            <Share2 size={10} />
            고객 공유
          </p>
          <p className={`mt-1 text-sm font-medium ${log.sharedToCustomer ? "text-[var(--green)]" : "text-[var(--muted)]"}`}>
            {log.sharedToCustomer ? "공유 중" : "비공개"}
          </p>
        </button>
      </div>

      {/* 사진 */}
      <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[var(--muted)]">현장 사진 ({photos.length}장)</p>
          <label
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] cursor-pointer hover:border-[var(--green)] hover:text-[var(--green)] ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
            {uploading ? "업로드 중..." : "사진 추가"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-6">아직 등록된 사진이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((url, idx) => (
              <div
                key={url + idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background)] group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                </a>
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black transition-opacity"
                  aria-label="사진 삭제"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {log.detail && (
        <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs font-semibold text-[var(--muted)] mb-2">작업 상세</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{log.detail}</p>
        </section>
      )}

      {log.issues && (
        <section className="p-5 rounded-2xl border border-[var(--orange)]/30 bg-[var(--orange)]/[0.04]">
          <p className="text-xs font-semibold text-[var(--orange)] mb-2">특이사항</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{log.issues}</p>
        </section>
      )}

      {log.nextDayPlan && (
        <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs font-semibold text-[var(--muted)] mb-2">내일 계획</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{log.nextDayPlan}</p>
        </section>
      )}

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="업무일지 삭제">
        <p className="text-sm text-[var(--muted)]">
          {fmtDate(log.logDate)} · {log.siteName || "-"} 의 업무일지를 삭제합니다. 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowDelete(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm">
            취소
          </button>
          <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-[var(--red)] text-white text-sm font-bold">
            삭제
          </button>
        </div>
      </Modal>

      <Modal open={showShare} onClose={() => setShowShare(false)} title="고객 공유 링크">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/30">
            <p className="text-xs font-semibold text-[var(--green)] mb-1">📌 영구 링크입니다</p>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              {log.siteName || "이 현장"}의 공유 링크는 <strong className="text-[var(--foreground)]">한 번만 발급되며 영구적으로 유지</strong>됩니다.
              새 일지를 작성하면서 <strong className="text-[var(--foreground)]">"고객에게 공유"</strong> 토글을 켜면 자동으로 같은 링크에 누적됩니다.
              고객에게 카톡으로 한 번만 보내면 됩니다.
            </p>
          </div>

          {shareLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Loader2 size={14} className="animate-spin" />
              링크 생성 중...
            </div>
          ) : shareError ? (
            <p className="text-sm text-[var(--red)]">{shareError}</p>
          ) : shareUrl ? (
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={shareUrl}
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs font-mono"
              />
              <button
                onClick={copyShareUrl}
                className="inline-flex items-center gap-1 px-3 rounded-xl bg-[var(--green)] text-black text-xs font-bold"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowShare(false)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm"
            >
              닫기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
