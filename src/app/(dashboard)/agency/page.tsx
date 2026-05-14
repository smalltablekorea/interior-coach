"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, FileText, AlertCircle, BarChart3, Upload, AlertTriangle, Info,
} from "lucide-react";

const SECTIONS = [
  { href: "/agency/clients", icon: Users, title: "클라이언트", desc: "대행 계약 업체 목록 · 온보딩" },
  { href: "/agency/jobs", icon: FileText, title: "콘텐츠 잡", desc: "생성 큐 · QC 상태 · 발행 대기" },
  { href: "/agency/alerts", icon: AlertCircle, title: "알림", desc: "QC 3회 미달 · 발행 지연 · 이상 케이스" },
] as const;

const TYPE_LABEL: Record<string, string> = {
  qc_3_fail: "QC 3회 미달",
  publish_overrun: "발행 7분 초과",
  sentiment_drop: "감정 분석 이상",
  other: "기타",
};

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  businessName: string | null;
}

export default function AgencyDashboardPage() {
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [recentUnresolved, setRecentUnresolved] = useState<Alert[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/agency/alerts?unresolved=true&limit=3");
        const j = await r.json();
        if (r.ok) {
          setUnresolvedCount(j.unresolvedCount || 0);
          setRecentUnresolved(j.items || []);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">마케팅 대행 콘솔</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          대행 클라이언트의 콘텐츠 생성·발행·리포트를 한 곳에서 관리합니다.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SECTIONS.map((s) => {
          const showBadge = s.href === "/agency/alerts" && unresolvedCount > 0;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="relative block p-5 rounded-2xl border border-[var(--border)] hover:border-[var(--green)]/40 transition"
            >
              <s.icon size={20} className="text-[var(--green)] mb-2" />
              <h2 className="font-semibold">{s.title}</h2>
              <p className="text-xs text-[var(--muted)] mt-1">{s.desc}</p>
              {showBadge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                  {unresolvedCount}
                </span>
              )}
            </Link>
          );
        })}
      </section>

      {recentUnresolved.length > 0 && (
        <section className="p-5 rounded-2xl border border-yellow-300 bg-yellow-50">
          <header className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <h3 className="font-semibold text-sm">미해결 알림 {unresolvedCount}건</h3>
            </div>
            <Link
              href="/agency/alerts"
              className="text-xs text-[var(--green)] underline"
            >
              모두 보기 →
            </Link>
          </header>
          <ul className="space-y-2">
            {recentUnresolved.map((a) => (
              <li key={a.id} className="text-xs">
                <span className="font-semibold">{TYPE_LABEL[a.type] || a.type}</span>
                {a.businessName && <span className="text-[var(--muted)]"> · {a.businessName}</span>}
                <span className="text-[var(--muted)]"> · {new Date(a.createdAt).toLocaleString("ko-KR")}</span>
                <p className="mt-0.5 text-[var(--foreground)]">{a.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentUnresolved.length === 0 && unresolvedCount === 0 && (
        <section className="p-5 rounded-2xl border border-[var(--green)]/40 bg-[var(--green)]/5 flex items-center gap-2">
          <Info size={16} className="text-[var(--green)]" />
          <p className="text-sm text-[var(--muted)]">모든 알림 해결됨. 평소 상태.</p>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <Upload size={18} className="text-[var(--muted)]" />
            <h3 className="font-semibold text-sm">이번주 업로드</h3>
          </div>
          <p className="text-xs text-[var(--muted)]">
            클라이언트별 상세는 각 클라이언트 페이지에서 확인.
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} className="text-[var(--muted)]" />
            <h3 className="font-semibold text-sm">발행 지표</h3>
          </div>
          <p className="text-xs text-[var(--muted)]">
            클라이언트별 월간 리포트는 각 클라이언트의 리포트 탭에서 확인.
          </p>
        </div>
      </section>
    </div>
  );
}
