"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Save, Loader2, Minus, Plus,
  ImagePlus, X as XIcon, Share2, Eye, EyeOff,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { KoreanInput, KoreanTextarea } from "@/components/ui/KoreanInput";
import { TRADES } from "@/lib/constants";
import type { DailyLog, Weather, CreateDailyLogRequest } from "@/types/daily-log";

const WEATHER_OPTIONS: { key: Weather; emoji: string; label: string }[] = [
  { key: "sunny", emoji: "☀️", label: "맑음" },
  { key: "cloudy", emoji: "☁️", label: "흐림" },
  { key: "rainy", emoji: "🌧️", label: "비" },
  { key: "snowy", emoji: "❄️", label: "눈" },
  { key: "hot", emoji: "🔥", label: "더움" },
  { key: "cold", emoji: "🥶", label: "추움" },
];

/** 한 번에 업로드 가능한 사진 최대 개수 (new 페이지와 일치) */
const MAX_PHOTOS_PER_BATCH = 20;

export default function EditDailyLogPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>("");

  // 본문 form. siteId/logDate 는 unique 제약 + 식별자라 변경 불가.
  const [form, setForm] = useState<Omit<CreateDailyLogRequest, "siteId" | "logDate">>({
    summary: "",
    detail: "",
    issues: "",
    nextDayPlan: "",
    workerCount: 1,
    tradesWorked: [],
    tradesWorkedNames: [],
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [shareToCustomer, setShareToCustomer] = useState(false);
  const [logDate, setLogDate] = useState<string>("");

  // 초기값 로딩
  useEffect(() => {
    apiFetch(`/api/daily-logs/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const log = (data?.data ?? data) as DailyLog | null;
        if (!log?.id) {
          setError("업무일지를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }
        setSiteName(log.siteName || "");
        setLogDate(log.logDate);
        setForm({
          summary: log.summary ?? "",
          detail: log.detail ?? "",
          issues: log.issues ?? "",
          nextDayPlan: log.nextDayPlan ?? "",
          workerCount: log.workerCount ?? 1,
          tradesWorked: (log.tradesWorked as string[]) ?? [],
          tradesWorkedNames: (log.tradesWorkedNames as string[]) ?? [],
          weather: log.weather ?? undefined,
        });
        setPhotoUrls((log.photoUrls as string[]) ?? []);
        setShareToCustomer(!!log.sharedToCustomer);
        setLoading(false);
      })
      .catch(() => {
        setError("불러오기 실패");
        setLoading(false);
      });
  }, [id]);

  const toggleTrade = (t: string) => {
    setForm((f) => {
      const names = f.tradesWorkedNames || [];
      const exists = names.includes(t);
      const next = exists ? names.filter((n) => n !== t) : [...names, t];
      return { ...f, tradesWorked: next, tradesWorkedNames: next };
    });
  };

  const bumpWorkers = (delta: number) => {
    setForm((f) => ({ ...f, workerCount: Math.max(0, (f.workerCount ?? 0) + delta) }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const batch = images.slice(0, MAX_PHOTOS_PER_BATCH);
    if (batch.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of batch) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "daily-log");
        const res = await apiFetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `업로드 실패: ${file.name}`);
        }
        const url = data?.data?.url;
        if (url) uploaded.push(url);
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
      if (images.length > MAX_PHOTOS_PER_BATCH) {
        setError(`한 번에 최대 ${MAX_PHOTOS_PER_BATCH}장만 업로드됩니다.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진 업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    if (!form.summary.trim()) return setError("작업 요약을 입력해주세요.");

    setSaving(true);
    try {
      const payload = {
        ...form,
        photoUrls,
        sharedToCustomer: shareToCustomer,
      };
      const res = await apiFetch(`/api/daily-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data?.error === "string" && data.error) ||
          data?.error?.message ||
          "저장에 실패했습니다.";
        setError(msg);
        setSaving(false);
        return;
      }
      router.push(`/daily-logs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl animate-shimmer" />
        <div className="h-96 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/daily-logs/${id}`}
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)]"
          aria-label="상세로 돌아가기"
        >
          <ArrowLeft size={18} />
        </Link>
        <ClipboardList size={22} className="text-[var(--blue)]" />
        <div>
          <h1 className="text-xl font-bold">업무일지 수정</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {siteName && <span>{siteName} · </span>}
            {logDate} (현장·날짜는 변경할 수 없습니다)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">날씨</label>
          <div className="flex flex-wrap gap-1.5">
            {WEATHER_OPTIONS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setForm({ ...form, weather: w.key })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  form.weather === w.key
                    ? "bg-[var(--green)] text-black border-[var(--green)]"
                    : "bg-transparent border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{w.emoji}</span>
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">참여 인원</label>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-1">
            <button type="button" onClick={() => bumpWorkers(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.05]">
              <Minus size={14} />
            </button>
            <span className="min-w-[40px] text-center text-sm font-bold">{form.workerCount ?? 0}명</span>
            <button type="button" onClick={() => bumpWorkers(1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.05]">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">작업 공종</label>
          <div className="flex flex-wrap gap-1.5">
            {TRADES.map((t) => {
              const active = (form.tradesWorkedNames || []).includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTrade(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    active
                      ? "bg-[var(--green)] text-black border-[var(--green)]"
                      : "bg-transparent border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">작업 요약 *</label>
          <KoreanInput
            value={form.summary}
            onChange={(v) => setForm({ ...form, summary: v })}
            placeholder="예: 거실 타일 시공 80%"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">상세</label>
          <KoreanTextarea
            value={form.detail || ""}
            onChange={(v) => setForm({ ...form, detail: v })}
            rows={4}
            placeholder="공종별 진행, 자재 반입 등"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">특이사항</label>
          <KoreanTextarea
            value={form.issues || ""}
            onChange={(v) => setForm({ ...form, issues: v })}
            rows={3}
            placeholder="지연·하자·민원 등 (고객 공유 X)"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">내일 작업 예정</label>
          <KoreanTextarea
            value={form.nextDayPlan || ""}
            onChange={(v) => setForm({ ...form, nextDayPlan: v })}
            rows={2}
            placeholder="다음날 투입 공종·인원 등"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
          />
        </div>

        {/* 사진 */}
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
            현장 사진 {photoUrls.length > 0 && <span className="text-[var(--green)]">({photoUrls.length}장)</span>}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background)] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="삭제"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ))}
            <label className={`aspect-square rounded-lg border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-xs text-[var(--muted)] cursor-pointer hover:border-[var(--green)] hover:text-[var(--green)] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin mb-1" />
                  업로드 중
                </>
              ) : (
                <>
                  <ImagePlus size={20} className="mb-1" />
                  사진 추가
                </>
              )}
              <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" disabled={uploading} />
            </label>
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--muted)]">
            한 번에 최대 {MAX_PHOTOS_PER_BATCH}장 선택 가능 · 장당 10MB 이하 · 저장 버튼을 눌러야 적용됩니다.
          </p>
        </div>

        {/* 공유 토글 */}
        <div>
          <button
            type="button"
            onClick={() => setShareToCustomer((v) => !v)}
            className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
              shareToCustomer ? "bg-[var(--green)]/10 border-[var(--green)]/40" : "border-[var(--border)] hover:bg-white/[0.02]"
            }`}
            role="switch"
            aria-checked={shareToCustomer}
          >
            <div className="flex items-center gap-2 text-sm">
              {shareToCustomer ? <Eye size={16} className="text-[var(--green)]" /> : <EyeOff size={16} className="text-[var(--muted)]" />}
              <div className="text-left">
                <div className={`font-medium flex items-center gap-1 ${shareToCustomer ? "text-[var(--green)]" : ""}`}>
                  <Share2 size={12} />
                  고객에게 공유
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5">
                  공유 링크에서 이 일지 노출 여부 (특이사항은 공유 안 됨)
                </div>
              </div>
            </div>
            <span className={`w-10 h-6 rounded-full relative transition-colors ${shareToCustomer ? "bg-[var(--green)]" : "bg-[var(--border)]"}`}>
              <span className={`absolute top-0.5 ${shareToCustomer ? "right-0.5" : "left-0.5"} w-5 h-5 rounded-full bg-white transition-all`} />
            </span>
          </button>
        </div>

        {error && <p className="text-sm text-[var(--red)]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href={`/daily-logs/${id}`}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04]"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
