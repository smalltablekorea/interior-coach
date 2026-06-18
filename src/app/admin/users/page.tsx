"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, Users, Gift, Sparkles, AlertTriangle } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerified: boolean;
  role: string | null;
  workspaceName: string | null;
  hasWorkspace: boolean;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  aiCalls24h: number;
  createdAt: string;
  isPromoSignup: boolean;
}

interface Meta {
  total: number;
  promoSignups: number;
  returned: number;
  offset: number;
  limit: number;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "promo" | "trialing" | "no_workspace">("all");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const url = new URL("/api/admin/users", window.location.origin);
      if (q) url.searchParams.set("q", q);
      url.searchParams.set("limit", "200");
      const res = await fetch(url.toString(), { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        setErr(json?.error || "조회 실패");
        setItems([]);
        setMeta(null);
        return;
      }
      const data = json?.data ?? json;
      setItems(data.items ?? []);
      setMeta(data.meta ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "promo") return items.filter((u) => u.isPromoSignup);
    if (filter === "trialing") return items.filter((u) => u.status === "trialing");
    if (filter === "no_workspace") return items.filter((u) => !u.hasWorkspace);
    return items;
  }, [items, filter]);

  const stats = useMemo(() => {
    const total = meta?.total ?? items.length;
    const promo = meta?.promoSignups ?? items.filter((u) => u.isPromoSignup).length;
    const trialing = items.filter((u) => u.status === "trialing").length;
    const noWs = items.filter((u) => !u.hasWorkspace).length;
    const heavyAi = items.filter((u) => u.aiCalls24h >= 50).length;
    return { total, promo, trialing, noWs, heavyAi };
  }, [items, meta]);

  function exportCsv() {
    const headers = [
      "email", "name", "phone", "plan", "status", "trialDaysLeft",
      "creditsTotal", "creditsUsed", "creditsRemaining",
      "aiCalls24h", "workspace", "createdAt", "isPromo",
    ];
    const rows = filtered.map((u) => [
      u.email, u.name, u.phone ?? "", u.plan, u.status,
      u.trialDaysLeft ?? "", u.creditsTotal, u.creditsUsed, u.creditsRemaining,
      u.aiCalls24h, u.workspaceName ?? "", u.createdAt, u.isPromoSignup ? "yes" : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interior-coach-users-${new Date().toISOString().slice(0, 16)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">유저 관리</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              인테리어코치 가입자 DB · 어드민 전용
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const ok = confirm(
                  `전체 가입자에게 "7월 31일까지 전체 기능 무료" 공지를 발송할까요?\n\n(이미 받은 사용자는 자동 건너뜀)`,
                );
                if (!ok) return;
                try {
                  const res = await fetch("/api/admin/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      type: "system",
                      title: "🎉 7월 31일까지 전체 기능 무료",
                      message: "결제 없이 모든 Pro 기능을 사용하실 수 있습니다. 카드 등록 불필요.",
                      link: "/dashboard",
                      dedupeKey: "free-period-2026-07-31",
                    }),
                  });
                  const json = await res.json();
                  const data = json?.data ?? json;
                  if (!res.ok) {
                    alert(`발송 실패: ${json?.error || res.status}`);
                    return;
                  }
                  alert(
                    `발송 완료\n- 신규 발송: ${data.sent}명\n- 이미 받음(건너뜀): ${data.skipped}명\n- 전체: ${data.total}명`,
                  );
                } catch (e) {
                  alert(`발송 실패: ${e instanceof Error ? e.message : "네트워크 오류"}`);
                }
              }}
              className="px-3 py-2 rounded-lg border border-[var(--green)]/30 bg-[var(--green)]/10 text-[var(--green)] text-sm hover:bg-[var(--green)]/15"
              title="전체 가입자에게 7/31 무료 공지 in-app 알림 발송"
            >
              📢 7/31 무료 공지 발송
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04] flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              새로고침
            </button>
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="px-3 py-2 rounded-lg bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50"
            >
              CSV 내보내기
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard icon={<Users size={16} />} label="전체 가입자" value={stats.total} />
          <StatCard icon={<Gift size={16} />} label="프로모 가입" value={stats.promo} accent="green" />
          <StatCard icon={<Sparkles size={16} />} label="Trial 중" value={stats.trialing} />
          <StatCard icon={<AlertTriangle size={16} />} label="워크스페이스 없음" value={stats.noWs} accent={stats.noWs > 0 ? "amber" : undefined} />
          <StatCard icon={<AlertTriangle size={16} />} label="24h AI 50+회" value={stats.heavyAi} accent={stats.heavyAi > 0 ? "red" : undefined} />
        </div>

        {/* 검색 + 필터 */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="이메일 또는 이름 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--green)]/60"
            />
          </div>
          <div className="flex gap-1 text-xs">
            {(["all", "promo", "trialing", "no_workspace"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg border ${
                  filter === f
                    ? "bg-[var(--green)]/10 border-[var(--green)]/40 text-[var(--green)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {f === "all" ? "전체" : f === "promo" ? "프로모" : f === "trialing" ? "Trial" : "WS 없음"}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {err}
          </div>
        )}

        {/* 테이블 */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[var(--muted)] text-xs">
                <tr>
                  <th className="text-left px-3 py-2.5">이메일 / 이름</th>
                  <th className="text-left px-3 py-2.5">연락처</th>
                  <th className="text-left px-3 py-2.5">워크스페이스</th>
                  <th className="text-left px-3 py-2.5">플랜 / 상태</th>
                  <th className="text-right px-3 py-2.5">Trial 남음</th>
                  <th className="text-right px-3 py-2.5">분석권</th>
                  <th className="text-right px-3 py-2.5">24h AI</th>
                  <th className="text-left px-3 py-2.5">가입일</th>
                  <th className="text-right px-3 py-2.5">상세</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-12 text-center text-[var(--muted)]">로딩 중...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-12 text-center text-[var(--muted)]">결과 없음</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border)] hover:bg-white/[0.02] cursor-pointer" onClick={() => window.location.assign(`/admin/users/${u.id}`)}>
                      <td className="px-3 py-2.5">
                        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2 hover:text-[var(--green)] hover:underline" onClick={(e) => e.stopPropagation()}>
                          {u.isPromoSignup && <span title="프로모 가입자" className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />}
                          <div>
                            <div className="font-medium">{u.email}</div>
                            <div className="text-xs text-[var(--muted)]">{u.name}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{u.phone || "—"}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {u.workspaceName || <span className="text-amber-400">없음</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <PlanBadge plan={u.plan} status={u.status} />
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs">
                        {u.trialDaysLeft === null ? "—" : (
                          <span className={u.trialDaysLeft <= 3 ? "text-amber-400" : ""}>
                            {u.trialDaysLeft}일
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs">
                        {u.creditsTotal > 0 ? (
                          <span>
                            <span className={u.creditsRemaining <= 0 ? "text-red-400" : ""}>{u.creditsRemaining}</span>
                            <span className="text-[var(--muted)]"> / {u.creditsTotal}</span>
                          </span>
                        ) : "—"}
                      </td>
                      <td className={`px-3 py-2.5 text-right text-xs ${u.aiCalls24h >= 100 ? "text-red-400 font-medium" : u.aiCalls24h >= 50 ? "text-amber-400" : ""}`}>
                        {u.aiCalls24h}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{fmtDate(u.createdAt)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          href={`/admin/users/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-[var(--green)]/10 text-[var(--green)] text-xs font-medium hover:bg-[var(--green)]/20"
                        >
                          상세 →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {meta && (
          <p className="mt-3 text-xs text-[var(--muted)] text-right">
            표시: {filtered.length} / 조회됨: {items.length} / 전체: {meta.total}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "green" | "amber" | "red";
}) {
  const color =
    accent === "green" ? "text-[var(--green)]" :
    accent === "amber" ? "text-amber-400" :
    accent === "red" ? "text-red-400" : "text-[var(--foreground)]";
  return (
    <div className="p-3 rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">{icon} {label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function PlanBadge({ plan, status }: { plan: string; status: string }) {
  const isTrial = status === "trialing";
  const bg =
    plan === "pro" ? (isTrial ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--green)]/20 text-[var(--green)]") :
    plan === "starter" ? "bg-blue-500/10 text-blue-400" :
    "bg-white/5 text-[var(--muted)]";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${bg}`}>
      {plan.toUpperCase()}{isTrial && " · trial"}
    </span>
  );
}
