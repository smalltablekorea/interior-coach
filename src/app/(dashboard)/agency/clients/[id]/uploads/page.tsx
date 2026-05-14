"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Bell, RefreshCw, AlertTriangle } from "lucide-react";

interface WeeklyUpload {
  id: string;
  weekOfDate: string;
  imageUrls: string[];
  notesText: string | null;
  uploadedVia: string;
  uploadedAt: string;
  retainUntil: string | null;
}

function thisWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(mon.getDate() + offset);
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}

export default function AgencyClientUploadsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [uploads, setUploads] = useState<WeeklyUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/agency/clients/${clientId}/uploads`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setUploads(j.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendReminder = async (kind: "weekly" | "missing") => {
    setReminderStatus("발송 중...");
    try {
      const r = await fetch(`/api/agency/clients/${clientId}/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "발송 실패");
      setReminderStatus(
        `✓ [${j.alimtalk.template}] mock 발송 완료 (수신: ${j.alimtalk.to}). 콘솔 로그 확인.`,
      );
    } catch (e) {
      setReminderStatus(`✗ ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const thisWeek = thisWeekMonday();
  const thisWeekUpload = uploads.find((u) => u.weekOfDate === thisWeek);
  const missingThisWeek = !thisWeekUpload;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <section
        className={`p-5 rounded-2xl border ${
          missingThisWeek
            ? "border-yellow-400 bg-yellow-50"
            : "border-[var(--green)]/40 bg-[var(--green)]/5"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {missingThisWeek ? (
                <>
                  <AlertTriangle size={16} className="text-yellow-600" />
                  이번 주 ({thisWeek}) 업로드 누락
                </>
              ) : (
                <>이번 주 ({thisWeek}) 업로드 완료 — {thisWeekUpload!.imageUrls.length}장</>
              )}
            </h3>
            {reminderStatus && (
              <p className="text-xs text-[var(--muted)] mt-2">{reminderStatus}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => sendReminder("weekly")}
              className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
            >
              <Bell size={14} /> 이번 주 리마인더
            </button>
            <button
              onClick={() => sendReminder("missing")}
              className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
            >
              <Bell size={14} /> 누락 재전송
            </button>
            <button
              onClick={refresh}
              className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs inline-flex items-center gap-1"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="p-10 text-center text-sm text-[var(--muted)]">불러오는 중…</div>
      ) : uploads.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-[var(--border)] text-center text-sm text-[var(--muted)]">
          아직 업로드가 없습니다. 클라이언트 포털 URL을 다시 안내해주세요.
        </div>
      ) : (
        <div className="space-y-5">
          {uploads.map((u) => (
            <article key={u.id} className="p-5 rounded-2xl border border-[var(--border)]">
              <header className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm">{u.weekOfDate} 주차</h4>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {new Date(u.uploadedAt).toLocaleString("ko-KR")} · {u.uploadedVia} · {u.imageUrls.length}장
                    {u.retainUntil && (
                      <> · 보관 만료: {new Date(u.retainUntil).toISOString().slice(0, 10)}</>
                    )}
                  </p>
                </div>
              </header>
              {u.notesText && (
                <p className="mb-3 px-3 py-2 rounded-lg bg-[var(--sidebar)] text-xs text-[var(--muted)]">
                  {u.notesText}
                </p>
              )}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {u.imageUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg overflow-hidden border border-[var(--border)] aspect-square block"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
