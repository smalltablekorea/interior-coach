"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Phase {
  category: string;
  progress: number;
  status: string;
  plannedStart: string | null;
  plannedEnd: string | null;
}

interface Payment {
  type: string;
  amount: number;
  status: string;
  dueDate: string | null;
}

interface Photo {
  id: string;
  url: string;
  date: string;
  category: string | null;
  phase: string | null;
  caption: string | null;
}

interface SiteData {
  id: string;
  name: string;
  status: string;
  address: string | null;
  startDate: string | null;
  endDate: string | null;
  overallProgress: number;
  phases: Phase[];
  totalContract: number;
  totalPaid: number;
  payments: Payment[];
  photos: Photo[];
}

interface PortalData {
  customer: { id: string; name: string };
  sites: SiteData[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function PortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError("데이터를 불러올 수 없습니다");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {data.customer.name}님의 공사 현황
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.sites.length}개 현장
        </p>
      </div>

      {data.sites.map((site) => (
        <div key={site.id} className="space-y-6">
          {/* Site Header */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{site.name}</h2>
                {site.address && (
                  <p className="text-sm text-gray-500 mt-1">{site.address}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                site.status === "시공중" ? "bg-emerald-50 text-emerald-600" :
                site.status === "시공완료" ? "bg-gray-100 text-gray-600" :
                "bg-blue-50 text-blue-600"
              }`}>
                {site.status}
              </span>
            </div>
            {(site.startDate || site.endDate) && (
              <p className="text-sm text-gray-500">
                공사기간: {fmtDate(site.startDate)} ~ {fmtDate(site.endDate)}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">공사 진행률</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="35" fill="none"
                    stroke="#10b981" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - site.overallProgress / 100)}`}
                    style={{ transition: "stroke-dashoffset 0.5s" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  {site.overallProgress}%
                </span>
              </div>
              <div className="text-sm text-gray-500">
                전체 {site.phases.length}개 공정 중{" "}
                <span className="text-emerald-600 font-medium">
                  {site.phases.filter((p) => p.status === "완료").length}개 완료
                </span>
              </div>
            </div>

            {site.phases.length > 0 && (
              <div className="space-y-3">
                {site.phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm w-16 shrink-0 text-gray-600">{p.category}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p.progress}%`,
                          backgroundColor: p.progress >= 100 ? "#10b981" : p.progress > 0 ? "#3b82f6" : "#d1d5db",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right text-gray-500">{p.progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Status */}
          {site.payments.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">수금 현황</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-xl font-bold text-gray-900">{fmt(site.totalContract)}</p>
                  <p className="text-xs text-gray-500 mt-1">총 계약액</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <p className="text-xl font-bold text-emerald-600">{fmt(site.totalPaid)}</p>
                  <p className="text-xs text-gray-500 mt-1">수금액</p>
                </div>
              </div>
              {site.totalContract > 0 && (
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round((site.totalPaid / site.totalContract) * 100)}%` }}
                  />
                </div>
              )}
              <div className="space-y-2">
                {site.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "완납" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{fmt(p.amount)}</span>
                      {p.dueDate && (
                        <p className="text-xs text-gray-400">{fmtDate(p.dueDate)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {site.photos.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">시공 사진</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {site.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={photo.url}
                      alt={photo.caption || ""}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs truncate">{photo.caption}</p>
                        <p className="text-white/60 text-[10px]">{fmtDate(photo.date)}</p>
                      </div>
                    </div>
                    {photo.phase && (
                      <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        photo.phase === "before" ? "bg-blue-500 text-white" :
                        photo.phase === "after" ? "bg-emerald-500 text-white" :
                        "bg-orange-500 text-white"
                      }`}>
                        {photo.phase === "before" ? "전" : photo.phase === "after" ? "후" : "중"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
