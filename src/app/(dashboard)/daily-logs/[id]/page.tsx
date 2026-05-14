"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Trash2, Users, Share2 } from "lucide-react";
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
        if (updated?.id) setLog(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await apiFetch(`/api/daily-logs/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/daily-logs");
  };

  if (loading) return <div className="h-32 rounded-2xl animate-shimmer" />;
  if (!log) return <p className="text-sm text-[var(--muted)]">업무일지를 찾을 수 없습니다.</p>;

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
        <button
          onClick={() => setShowDelete(true)}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10"
          aria-label="업무일지 삭제"
          title="삭제"
        >
          <Trash2 size={18} />
        </button>
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
    </div>
  );
}
