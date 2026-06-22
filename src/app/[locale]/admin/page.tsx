"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  Clock,
  Sparkles,
  Mail,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface UsersMeta {
  total: number;
  todayLoginCount: number;
  promoSignups: number;
}

interface CronStat {
  cronName: string;
  ok: number;
  fail: number;
  successRate: number | null;
  consecutiveFails: number;
  lastRun: string | null;
}

interface AiTotals {
  calls: number;
  estimatedCostUsd: number;
}

interface DemoSummary {
  newCount: number;
}

export default function AdminHomePage() {
  const [users, setUsers] = useState<UsersMeta | null>(null);
  const [crons, setCrons] = useState<CronStat[]>([]);
  const [ai, setAi] = useState<AiTotals | null>(null);
  const [demo, setDemo] = useState<DemoSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, c, a, d] = await Promise.all([
          fetch("/api/admin/users?limit=1", { credentials: "include" }).then((r) =>
            r.ok ? r.json() : null,
          ),
          fetch("/api/admin/crons", { credentials: "include" }).then((r) =>
            r.ok ? r.json() : null,
          ),
          fetch("/api/admin/ai-usage?days=7", { credentials: "include" }).then((r) =>
            r.ok ? r.json() : null,
          ),
          fetch("/api/admin/demo-requests?status=new", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        const ud = (u?.data ?? u)?.meta;
        if (ud) setUsers({ total: ud.total, todayLoginCount: ud.todayLoginCount, promoSignups: ud.promoSignups });
        const cd = (c?.data ?? c)?.stats;
        if (cd) setCrons(cd);
        const ad = (a?.data ?? a)?.totals;
        if (ad) setAi(ad);
        const dd = (d?.data ?? d);
        if (dd) {
          const items: { status: string }[] = dd.items ?? dd;
          const list = Array.isArray(items) ? items : [];
          setDemo({ newCount: list.filter((i) => i.status === "new").length });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const failingCrons = crons.filter((c) => c.consecutiveFails >= 2);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">어드민 홈</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        인테리어코치 운영 현황 한눈에 보기
      </p>

      {/* 알람 */}
      {failingCrons.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Cron 연속 실패 감지: </span>
            {failingCrons.map((c) => `${c.cronName} (${c.consecutiveFails}회)`).join(", ")} —
            <Link href="/admin/crons" className="ml-1 underline">cron 페이지 확인</Link>
          </div>
        </div>
      )}

      {loading && !users ? (
        <div className="py-20 text-center text-[var(--muted)]">로딩 중...</div>
      ) : (
        <>
          {/* 핵심 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard
              icon={<Users size={16} />}
              label="전체 사용자"
              value={users?.total ?? 0}
              sub={`프로모 ${users?.promoSignups ?? 0}명`}
              href="/admin/users"
            />
            <KpiCard
              icon={<Activity size={16} />}
              label="오늘 로그인"
              value={users?.todayLoginCount ?? 0}
              sub="자정 기준 unique"
              href="/admin/activity"
              accent={(users?.todayLoginCount ?? 0) > 0 ? "green" : undefined}
            />
            <KpiCard
              icon={<Sparkles size={16} />}
              label="7일 AI 호출"
              value={ai?.calls ?? 0}
              sub={`약 $${(ai?.estimatedCostUsd ?? 0).toFixed(2)} 추정`}
              href="/admin/ai-usage"
            />
            <KpiCard
              icon={<Mail size={16} />}
              label="신규 데모 신청"
              value={demo?.newCount ?? 0}
              sub="응답 대기"
              href="/admin/demo-requests"
              accent={(demo?.newCount ?? 0) > 0 ? "amber" : undefined}
            />
          </div>

          {/* cron 한 줄 요약 */}
          <div className="rounded-xl border border-[var(--border)] mb-6">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="flex items-center gap-2 font-semibold">
                <Clock size={16} className="text-[var(--green)]" />
                Cron 상태 (최근 7일)
              </h2>
              <Link href="/admin/crons" className="text-xs text-[var(--green)] hover:underline">
                상세 →
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {crons.length === 0 ? (
                <div className="px-4 py-6 text-sm text-[var(--muted)] text-center">
                  cron_execution_logs 기록이 없습니다.
                </div>
              ) : (
                crons.map((c) => (
                  <div key={c.cronName} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {c.consecutiveFails >= 2 ? (
                        <AlertTriangle size={14} className="text-red-400" />
                      ) : (
                        <CheckCircle2 size={14} className="text-[var(--green)]" />
                      )}
                      <span className="font-mono text-xs">{c.cronName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                      <span>
                        <span className="text-[var(--green)]">{c.ok}</span> /{" "}
                        <span className={c.fail > 0 ? "text-red-400" : ""}>{c.fail}</span>
                      </span>
                      <span>{c.successRate ?? "—"}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, href, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  href: string;
  accent?: "green" | "amber" | "red";
}) {
  const color =
    accent === "green" ? "text-[var(--green)]" :
    accent === "amber" ? "text-amber-400" :
    accent === "red" ? "text-red-400" : "text-[var(--foreground)]";
  return (
    <Link
      href={href}
      className="block p-4 rounded-xl border border-[var(--border)] hover:border-[var(--green)]/40 hover:bg-white/[0.02] transition-colors group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">{icon} {label}</div>
        <ArrowRight size={12} className="text-[var(--muted)] group-hover:text-[var(--green)] transition-colors" />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
      {sub && <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>}
    </Link>
  );
}
