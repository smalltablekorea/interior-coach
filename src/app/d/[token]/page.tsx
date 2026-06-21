"use client";

import { use, useEffect, useState } from "react";

interface DailyLog {
  id: string;
  authorName: string;
  logDate: string;
  tradesWorkedNames: string[] | null;
  summary: string;
  detail: string | null;
  photoUrls: string[] | null;
  weather: string | null;
  workerCount: number | null;
  nextDayPlan: string | null;
}

interface Site {
  id: string;
  name: string;
  address: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

interface ApiResp {
  site: Site;
  logs: DailyLog[];
  total: number;
}

const WEATHER_EMOJI: Record<string, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  hot: "🔥",
  cold: "🥶",
};

function fmtDate(s: string): string {
  const d = new Date(s + "T00:00:00+09:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export default function PublicDailyLogPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/daily-logs/${token}`)
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) {
          setError(json?.error || "공유 링크를 불러올 수 없습니다.");
          setLoading(false);
          return;
        }
        const payload = (json?.data ?? json) as ApiResp;
        setData(payload);
        setLoading(false);
      })
      .catch(() => {
        setError("네트워크 오류로 불러오지 못했습니다.");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">불러오는 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🔒</div>
          <h1 className="text-lg font-semibold mb-1">접근할 수 없습니다</h1>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  const { site, logs } = data;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* 상단 띠 */}
      <div className="bg-emerald-900/30 border-b border-emerald-800/40 px-4 py-2 text-center text-xs text-emerald-200">
        🔒 시공 진행 현황 — 인테리어코치를 통한 공유 (읽기 전용)
      </div>

      {/* 현장 헤더 */}
      <header className="border-b border-neutral-800 px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">{site.name}</h1>
          {site.address && (
            <p className="text-sm text-neutral-400">{site.address}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {site.status && (
              <span className="px-2 py-1 rounded-full bg-neutral-800 text-neutral-200">
                {site.status}
              </span>
            )}
            {site.startDate && site.endDate && (
              <span className="px-2 py-1 rounded-full bg-neutral-800 text-neutral-300">
                {site.startDate} ~ {site.endDate}
              </span>
            )}
            <span className="px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-200">
              공유된 일지 {logs.length}건
            </span>
          </div>
        </div>
      </header>

      {/* 일지 리스트 */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-neutral-400">
              아직 고객에게 공유된 일지가 없습니다.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <article
              key={log.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden"
            >
              {/* 헤더 */}
              <div className="px-4 sm:px-5 py-4 border-b border-neutral-800">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs text-neutral-400">
                      {fmtDate(log.logDate)}
                    </div>
                    <div className="font-semibold mt-0.5">{log.summary}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {log.weather && (
                      <span className="px-2 py-1 rounded-full bg-neutral-800">
                        {WEATHER_EMOJI[log.weather] || ""} {log.weather}
                      </span>
                    )}
                    {log.workerCount != null && log.workerCount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-neutral-800">
                        👷 {log.workerCount}명
                      </span>
                    )}
                  </div>
                </div>

                {/* 공종 칩 */}
                {log.tradesWorkedNames && log.tradesWorkedNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {log.tradesWorkedNames.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-emerald-900/30 text-emerald-200 text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 사진 */}
              {log.photoUrls && log.photoUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 bg-neutral-950">
                  {log.photoUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(url)}
                      className="aspect-square overflow-hidden bg-neutral-900 hover:opacity-90 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${log.summary} 사진 ${i + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* 본문 */}
              <div className="px-4 sm:px-5 py-4 space-y-3 text-sm">
                {log.detail && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-0.5">상세</div>
                    <p className="whitespace-pre-wrap text-neutral-200">{log.detail}</p>
                  </div>
                )}
                {log.nextDayPlan && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-0.5">다음 작업 예정</div>
                    <p className="whitespace-pre-wrap text-neutral-200">{log.nextDayPlan}</p>
                  </div>
                )}
                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                  작성자: {log.authorName}
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      <footer className="px-4 py-6 text-center text-xs text-neutral-500 border-t border-neutral-800">
        Powered by 인테리어코치
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="확대 보기"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
