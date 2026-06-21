"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Save, Loader2, Minus, Plus,
  ImagePlus, X as XIcon, Share2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { KoreanInput, KoreanTextarea } from "@/components/ui/KoreanInput";
import { TRADES } from "@/lib/constants";
import type { Weather, CreateDailyLogRequest } from "@/types/daily-log";

interface Site { id: string; name: string; }

const WEATHER_OPTIONS: { key: Weather; emoji: string; label: string }[] = [
  { key: "sunny", emoji: "☀️", label: "맑음" },
  { key: "cloudy", emoji: "☁️", label: "흐림" },
  { key: "rainy", emoji: "🌧️", label: "비" },
  { key: "snowy", emoji: "❄️", label: "눈" },
  { key: "hot", emoji: "🔥", label: "더움" },
  { key: "cold", emoji: "🥶", label: "추움" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function NewDailyLogInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSiteId = searchParams.get("siteId") || "";

  const [sites, setSites] = useState<Site[]>([]);
  const [form, setForm] = useState<CreateDailyLogRequest>({
    siteId: presetSiteId,
    logDate: todayISO(),
    summary: "",
    detail: "",
    issues: "",
    nextDayPlan: "",
    workerCount: 1,
    tradesWorked: [],
    tradesWorkedNames: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [shareToCustomer, setShareToCustomer] = useState(false);

  useEffect(() => {
    apiFetch("/api/sites")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setSites(Array.isArray(data) ? data : data?.items ?? []);
      })
      .catch(() => {});
  }, []);

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

  /** 다중 파일 업로드 — 한 장씩 /api/upload(folder=daily-log)로 보내고 URL 누적 */
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "daily-log");
        const res = await apiFetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `업로드 실패: ${file.name}`);
        }
        const url = data?.data?.url || data?.data?.pathname;
        if (url) uploaded.push(url);
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
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
    if (!form.siteId) return setError("현장을 선택해주세요.");
    if (!form.logDate) return setError("날짜를 선택해주세요.");
    if (!form.summary.trim()) return setError("작업 요약을 입력해주세요.");

    setSaving(true);
    try {
      const payload = {
        ...form,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        sharedToCustomer: shareToCustomer,
      };
      const res = await apiFetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error?.message || data?.error || "등록에 실패했습니다.");
        setSaving(false);
        return;
      }
      const newId = data?.data?.id;
      router.push(newId ? `/daily-logs/${newId}` : "/daily-logs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/daily-logs"
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)]"
          aria-label="업무일지 목록"
        >
          <ArrowLeft size={18} />
        </Link>
        <ClipboardList size={22} className="text-[var(--blue)]" />
        <h1 className="text-xl font-bold">업무일지 작성</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-2">현장 *</label>
            <select
              value={form.siteId}
              onChange={(e) => setForm({ ...form, siteId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
              required
            >
              <option value="">현장 선택</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-2">날짜 *</label>
            <input
              type="date"
              value={form.logDate}
              onChange={(e) => setForm({ ...form, logDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
              required
            />
          </div>
        </div>

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
            <button
              type="button"
              onClick={() => bumpWorkers(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.05]"
              aria-label="인원 감소"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[40px] text-center text-sm font-bold">{form.workerCount ?? 0}명</span>
            <button
              type="button"
              onClick={() => bumpWorkers(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.05]"
              aria-label="인원 증가"
            >
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
            placeholder="지연·하자·민원 등"
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

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
            현장 사진 ({photoUrls.length}장)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photoUrls.map((url, idx) => (
              <div
                key={url + idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                  aria-label="사진 삭제"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
            <label
              className={`aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--green)] hover:bg-white/[0.02] transition-colors ${
                uploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-[var(--muted)]" />
              ) : (
                <>
                  <ImagePlus size={20} className="text-[var(--muted)]" />
                  <span className="text-[10px] text-[var(--muted)] mt-1">사진 추가</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="mt-2 text-[10px] text-[var(--muted)]">
            여러 장 한 번에 선택 가능. 10MB 이하 jpg·png·webp·heic.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={shareToCustomer}
          onClick={() => setShareToCustomer((v) => !v)}
          className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
            shareToCustomer
              ? "border-[var(--green)]/50 bg-[var(--green)]/10"
              : "border-[var(--border)] bg-[var(--background)] hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center gap-2 text-left">
            <Share2 size={16} className={shareToCustomer ? "text-[var(--green)]" : "text-[var(--muted)]"} />
            <div>
              <p className="text-sm font-medium">고객에게 공유</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                현장 공유 링크에 이 일지가 노출됩니다. 나중에 상세에서 변경 가능.
              </p>
            </div>
          </div>
          {/* Switch — h-6 w-11 컨테이너 + h-5 w-5 thumb 가 inset 2px (border-2 transparent) 로
              상하·좌우 균일 여백. ON: thumb 우측(translate-x-5=20px), OFF: 좌측(0). */}
          <span
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              shareToCustomer ? "bg-[var(--green)]" : "bg-[var(--border)]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                shareToCustomer ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        {error && <p className="text-sm text-[var(--red)]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/daily-logs"
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04]"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
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

export default function NewDailyLogPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--muted)]">로딩 중...</div>}>
      <NewDailyLogInner />
    </Suspense>
  );
}
