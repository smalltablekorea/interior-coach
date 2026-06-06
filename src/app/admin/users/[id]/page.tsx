"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Building2, Calendar, Sparkles,
  AlertTriangle, FileText, Users, Cpu, Layers,
} from "lucide-react";

interface PhaseRow {
  category: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
  progress: number;
}
interface SiteRow {
  id: string;
  name: string;
  address: string | null;
  buildingType: string | null;
  areaPyeong: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  progress: number | null;
  budget: number | null;
  spent: number | null;
  createdAt: string;
  phases: PhaseRow[];
}
interface DetailResponse {
  user: {
    id: string; email: string; name: string; phone: string | null;
    emailVerified: boolean; role: string | null;
    activeWorkspaceName: string | null;
    createdAt: string;
  };
  subscription: {
    plan: string; status: string; billingCycle: string;
    trialEndsAt: string | null; currentPeriodEnd: string | null;
    canceledAt: string | null;
  } | null;
  credits: { total: number; used: number; remaining: number } | null;
  workspaces: { id: string; name: string; role: string; joinedAt: string; isActive: boolean }[];
  sites: SiteRow[];
  estimates: {
    id: string; siteId: string | null; version: number;
    totalAmount: number | null; status: string; createdAt: string;
  }[];
  stats: {
    siteCount: number; customerCount: number; estimateCount: number;
    analysisCount: number; aiCalls24h: number; aiTokensIn: number; aiTokensOut: number;
  };
  recentAnalysis: {
    id: string; area: number; grade: string; buildingType: string | null; createdAt: string;
  }[];
  recentAi: {
    endpoint: string; model: string; inputTokens: number; outputTokens: number; createdAt: string;
  }[];
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDateTime(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${fmtDate(s)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtMoney(n: number | null | undefined): string {
  if (!n) return "—";
  return `₩${n.toLocaleString()}`;
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${id}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || json?.success === false) {
          setErr(json?.error || "조회 실패");
          return;
        }
        setData(json?.data ?? json);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "네트워크 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">로딩 중...</div>;
  }
  if (err || !data) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/admin/users" className="text-sm text-[var(--green)] hover:underline">← 목록</Link>
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {err || "데이터 없음"}
        </div>
      </div>
    );
  }

  const { user, subscription, credits, workspaces, sites, estimates, stats, recentAnalysis, recentAi } = data;

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-[var(--green)] hover:underline mb-4">
          <ArrowLeft size={14} /> 사용자 목록
        </Link>

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><Mail size={12} /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone size={12} /> {user.phone}</span>}
              <span className="flex items-center gap-1"><Calendar size={12} /> 가입 {fmtDateTime(user.createdAt)}</span>
            </p>
          </div>
          {subscription && (
            <div className="text-right">
              <PlanBadge plan={subscription.plan} status={subscription.status} />
              {subscription.status === "trialing" && trialDaysLeft !== null && (
                <p className="text-xs mt-1 text-[var(--muted)]">
                  trial {trialDaysLeft}일 남음
                </p>
              )}
            </div>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Stat icon={<Building2 size={14} />} label="현장" value={stats.siteCount} />
          <Stat icon={<Users size={14} />} label="고객" value={stats.customerCount} />
          <Stat icon={<FileText size={14} />} label="견적" value={stats.estimateCount} />
          <Stat icon={<Sparkles size={14} />} label="분석권" value={credits ? `${credits.remaining}/${credits.total}` : "—"} />
          <Stat icon={<Cpu size={14} />} label="24h AI" value={stats.aiCalls24h} accent={stats.aiCalls24h >= 50 ? "amber" : undefined} />
          <Stat icon={<Layers size={14} />} label="총 토큰" value={`${(stats.aiTokensIn + stats.aiTokensOut).toLocaleString()}`} sub="in+out" />
        </div>

        {/* 워크스페이스 */}
        <Section title="워크스페이스" count={workspaces.length}>
          {workspaces.length === 0 ? (
            <Empty label="워크스페이스 없음" warn />
          ) : (
            <div className="space-y-2">
              {workspaces.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {w.name}
                      {w.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)]">활성</span>}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      역할: {w.role} · 가입 {fmtDate(w.joinedAt)}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)] font-mono">{w.id.slice(0, 8)}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 현장 + 공정 일정 */}
        <Section title="현장 & 공사 일정" count={sites.length}>
          {sites.length === 0 ? (
            <Empty label="등록된 현장 없음" />
          ) : (
            <div className="space-y-3">
              {sites.map((s) => (
                <SiteCard key={s.id} site={s} />
              ))}
            </div>
          )}
        </Section>

        {/* 견적 */}
        <Section title="견적" count={estimates.length} subtitle="최근 20건">
          {estimates.length === 0 ? (
            <Empty label="견적 없음" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2">현장</th>
                  <th className="text-left py-2">버전</th>
                  <th className="text-right py-2">금액</th>
                  <th className="text-left py-2">상태</th>
                  <th className="text-left py-2">생성일</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((e) => {
                  const site = sites.find((s) => s.id === e.siteId);
                  return (
                    <tr key={e.id} className="border-b border-[var(--border)]">
                      <td className="py-2">{site?.name || "—"}</td>
                      <td className="py-2 text-xs">v{e.version}</td>
                      <td className="py-2 text-right">{fmtMoney(e.totalAmount)}</td>
                      <td className="py-2 text-xs">{e.status}</td>
                      <td className="py-2 text-xs text-[var(--muted)]">{fmtDateTime(e.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        {/* 견적코치 분석권 사용 이력 */}
        <Section title="견적코치 분석권 사용" count={recentAnalysis.length} subtitle="최근 20건">
          {recentAnalysis.length === 0 ? (
            <Empty label="분석 이력 없음" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2">평수</th>
                  <th className="text-left py-2">등급</th>
                  <th className="text-left py-2">건물</th>
                  <th className="text-left py-2">사용 일시</th>
                </tr>
              </thead>
              <tbody>
                {recentAnalysis.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)]">
                    <td className="py-2">{a.area}평</td>
                    <td className="py-2 text-xs">{a.grade}</td>
                    <td className="py-2 text-xs">{a.buildingType || "—"}</td>
                    <td className="py-2 text-xs text-[var(--muted)]">{fmtDateTime(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* AI 호출 이력 */}
        <Section title="AI 호출 이력" count={recentAi.length} subtitle="최근 50건 · 24h: " right={`${stats.aiCalls24h}회 / 총 토큰 ${(stats.aiTokensIn + stats.aiTokensOut).toLocaleString()}`}>
          {recentAi.length === 0 ? (
            <Empty label="AI 호출 이력 없음" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2">엔드포인트</th>
                  <th className="text-left py-2">모델</th>
                  <th className="text-right py-2">in</th>
                  <th className="text-right py-2">out</th>
                  <th className="text-left py-2">시각</th>
                </tr>
              </thead>
              <tbody>
                {recentAi.map((a, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="py-2 text-xs font-mono">{a.endpoint}</td>
                    <td className="py-2 text-xs">{a.model.replace(/^claude-/, "")}</td>
                    <td className="py-2 text-right text-xs">{a.inputTokens}</td>
                    <td className="py-2 text-right text-xs">{a.outputTokens}</td>
                    <td className="py-2 text-xs text-[var(--muted)]">{fmtDateTime(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title, count, subtitle, right, children,
}: {
  title: string; count?: number; subtitle?: string; right?: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {title}{typeof count === "number" && <span className="text-sm text-[var(--muted)] ml-2">({count})</span>}
          {subtitle && <span className="text-xs text-[var(--muted)] ml-2">{subtitle}</span>}
        </h2>
        {right && <span className="text-xs text-[var(--muted)]">{right}</span>}
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

function Empty({ label, warn }: { label: string; warn?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-6 text-sm ${warn ? "text-amber-400" : "text-[var(--muted)]"}`}>
      {warn && <AlertTriangle size={14} />} {label}
    </div>
  );
}

function Stat({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; accent?: "amber" | "red";
}) {
  const color = accent === "amber" ? "text-amber-400" : accent === "red" ? "text-red-400" : "text-[var(--foreground)]";
  return (
    <div className="p-3 rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">{icon} {label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>}
    </div>
  );
}

function PlanBadge({ plan, status }: { plan: string; status: string }) {
  const isTrial = status === "trialing";
  const bg =
    plan === "pro" ? "bg-[var(--green)]/15 text-[var(--green)]" :
    plan === "starter" ? "bg-blue-500/15 text-blue-400" :
    "bg-white/5 text-[var(--muted)]";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg}`}>
      {plan.toUpperCase()}{isTrial && " · trial"}
    </span>
  );
}

function SiteCard({ site }: { site: SiteRow }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium">{site.name}</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">
            {[site.buildingType, site.areaPyeong ? `${site.areaPyeong}평` : null, site.address].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5">{site.status}</span>
          <div className="text-xs text-[var(--muted)] mt-1">
            {fmtDate(site.startDate)} ~ {fmtDate(site.endDate)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div><span className="text-[var(--muted)]">진행</span> <strong>{site.progress ?? 0}%</strong></div>
        <div><span className="text-[var(--muted)]">예산</span> {fmtMoney(site.budget)}</div>
        <div><span className="text-[var(--muted)]">지출</span> {fmtMoney(site.spent)}</div>
      </div>

      {site.phases.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--muted)] mb-2">공정 일정 ({site.phases.length})</div>
          <div className="space-y-1">
            {site.phases.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 text-xs items-center">
                <div className="col-span-3 truncate">{p.category}</div>
                <div className="col-span-3 text-[var(--muted)]">
                  계획 {fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)}
                </div>
                <div className="col-span-3 text-[var(--muted)]">
                  실제 {fmtDate(p.actualStart)} ~ {fmtDate(p.actualEnd)}
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5">{p.status}</span>
                </div>
                <div className="col-span-1 text-right">{p.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
