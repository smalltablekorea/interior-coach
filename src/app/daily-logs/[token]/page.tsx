"use client";

import { useEffect, useState, use, useMemo } from "react";
import {
  ClipboardList, Users, Calendar, Loader2, X as XIcon,
  ChevronLeft, ChevronRight,
} from "lucide-react";

type Weather = "sunny" | "cloudy" | "rainy" | "snowy" | "hot" | "cold";

interface PublicLog {
  id: string;
  authorName: string;
  logDate: string;
  tradesWorkedNames: string[] | null;
  summary: string;
  detail: string | null;
  photoUrls: string[] | null;
  weather: Weather | null;
  workerCount: number | null;
  nextDayPlan: string | null;
}

interface PublicSite {
  id: string;
  name: string;
  address?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}

interface PublicResponse {
  site: PublicSite;
  logs: PublicLog[];
  total: number;
}

const WEATHER_LABEL: Record<Weather, string> = {
  sunny: "☀️ 맑음",
  cloudy: "☁️ 흐림",
  rainy: "🌧️ 비",
  snowy: "❄️ 눈",
  hot: "🔥 더움",
  cold: "🥶 추움",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${w})`;
}

export default function PublicDailyLogsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<PublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사진 라이트박스
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/daily-logs/${token}`);
        const j = await res.json();
        if (!res.ok) {
          setError(j?.error?.message || j?.error || "유효하지 않은 링크입니다");
          return;
        }
        setData(j?.data ?? j);
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // 키보드 좌/우 이동
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft")
        setLightbox((l) =>
          l ? { ...l, idx: (l.idx - 1 + l.urls.length) % l.urls.length } : l,
        );
      if (e.key === "ArrowRight")
        setLightbox((l) =>
          l ? { ...l, idx: (l.idx + 1) % l.urls.length } : l,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const totalPhotos = useMemo(() => {
    return (data?.logs || []).reduce((s, l) => s + (l.photoUrls?.length || 0), 0);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 size={16} className="animate-spin" />
          불러오는 중...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
        <div className="max-w-md text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--red)]/10 flex items-center justify-center">
            <XIcon className="text-[var(--red)]" size={28} />
          </div>
          <h1 className="text-lg font-bold">{error || "유효하지 않은 링크입니다"}</h1>
          <p className="text-sm text-[var(--muted)]">
            링크가 만료되었거나 취소되었을 수 있습니다. 담당자에게 다시 요청해주세요.
          </p>
        </div>
      </div>
    );
  }

  const { site, logs } = data;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/85 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--green)]/15 flex items-center justify-center shrink-0">
              <ClipboardList className="text-[var(--green)]" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--muted)]">현장 업무일지</p>
              <h1 className="text-base font-bold truncate">{site.name}</h1>
            </div>
          </div>
          {site.address && (
            <p className="mt-2 text-xs text-[var(--muted)] truncate">📍 {site.address}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        {/* 요약 */}
        <section className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center">
            <p className="text-[10px] text-[var(--muted)]">공유된 일지</p>
            <p className="mt-1 text-lg font-bold">{logs.length}건</p>
          </div>
          <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center">
            <p className="text-[10px] text-[var(--muted)]">현장 사진</p>
            <p className="mt-1 text-lg font-bold">{totalPhotos}장</p>
          </div>
          <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center">
            <p className="text-[10px] text-[var(--muted)]">상태</p>
            <p className="mt-1 text-xs font-semibold">{site.status || "진행 중"}</p>
          </div>
        </section>

        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
            <ClipboardList size={28} className="mx-auto text-[var(--muted)] mb-3" />
            <p className="text-sm font-medium">아직 공유된 일지가 없습니다</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              담당자가 공유 설정을 켜면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <section className="space-y-5">
            {logs.map((log) => {
              const photos = log.photoUrls || [];
              return (
                <article
                  key={log.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                >
                  {/* 헤더 */}
                  <div className="p-4 sm:p-5 border-b border-[var(--border)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--green)] flex items-center gap-1">
                          <Calendar size={12} />
                          {fmtDate(log.logDate)}
                        </p>
                        <h2 className="mt-1 text-base font-bold leading-snug">{log.summary}</h2>
                      </div>
                      {log.weather && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-white/[0.05] shrink-0">
                          {WEATHER_LABEL[log.weather]}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {log.workerCount ?? 0}명
                      </span>
                      <span>· {log.authorName}</span>
                      {(log.tradesWorkedNames || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.tradesWorkedNames!.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--green)]/10 text-[var(--green)]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 사진 */}
                  {photos.length > 0 && (
                    <div className="p-4 sm:p-5 border-b border-[var(--border)]">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {photos.map((url, idx) => (
                          <button
                            type="button"
                            key={url + idx}
                            onClick={() => setLightbox({ urls: photos, idx })}
                            className="aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background)] hover:opacity-90 transition-opacity"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`사진 ${idx + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 본문 */}
                  {(log.detail || log.nextDayPlan) && (
                    <div className="p-4 sm:p-5 space-y-3">
                      {log.detail && (
                        <div>
                          <p className="text-[10px] font-semibold text-[var(--muted)] mb-1">
                            작업 상세
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {log.detail}
                          </p>
                        </div>
                      )}
                      {log.nextDayPlan && (
                        <div className="pt-3 border-t border-[var(--border)]/60">
                          <p className="text-[10px] font-semibold text-[var(--muted)] mb-1">
                            다음 작업 예정
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--muted)]">
                            {log.nextDayPlan}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        <footer className="pt-6 text-center text-[10px] text-[var(--muted)]">
          이 페이지는 담당자가 공유한 일지만 보입니다 · powered by 인테리어코치
        </footer>
      </main>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((l) =>
                l ? { ...l, idx: (l.idx - 1 + l.urls.length) % l.urls.length } : l,
              );
            }}
            className="absolute left-4 sm:left-8 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="이전"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((l) =>
                l ? { ...l, idx: (l.idx + 1) % l.urls.length } : l,
              );
            }}
            className="absolute right-4 sm:right-8 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="다음"
          >
            <ChevronRight size={22} />
          </button>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="닫기"
          >
            <XIcon size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.urls[lightbox.idx]}
            alt="확대 사진"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs">
            {lightbox.idx + 1} / {lightbox.urls.length}
          </div>
        </div>
      )}
    </div>
  );
}
