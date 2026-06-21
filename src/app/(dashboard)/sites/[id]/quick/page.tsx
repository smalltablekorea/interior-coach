"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, User, Phone, Wallet,
  Calendar, Hammer, Receipt, ListChecks, ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface QuickDetail {
  site: {
    id: string;
    name: string;
    address: string | null;
    areaPyeong: number | null;
    scope: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    trades: string[] | null;
    progress: number | null;
    customerName: string | null;
    customerPhone: string | null;
  };
  phases: Array<{
    id: string;
    category: string;
    plannedStart: string | null;
    plannedEnd: string | null;
    actualStart: string | null;
    actualEnd: string | null;
    progress: number;
    status: string;
    sortOrder: number | null;
  }>;
  contracts: Array<{
    id: string;
    contractAmount: number;
    contractDate: string | null;
    memo: string | null;
  }>;
  payments: Array<{
    id: string;
    contractId: string;
    type: string;
    amount: number;
    dueDate: string | null;
    paidDate: string | null;
    status: string;
  }>;
  schedules?: Array<{
    id: string;
    trade: string;
    taskName: string | null;
    startDate: string;
    endDate: string;
    sortOrder: number;
  }>;
}

type Tab = "phases" | "contract" | "schedule";

function fmtKrw(n: number | null | undefined): string {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("ko-KR");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) return null;
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

export default function QuickSiteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<QuickDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("phases");

  useEffect(() => {
    apiFetch(`/api/sites/${id}/quick-detail`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (d?.site?.id) setData(d as QuickDetail);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const splitTotal = useMemo(
    () => (data?.payments || []).reduce((s, p) => s + p.amount, 0),
    [data],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-72 rounded-xl animate-shimmer" />
        <div className="h-40 rounded-2xl animate-shimmer" />
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-[var(--muted)]">현장을 찾을 수 없습니다.</p>;
  }

  const { site, phases, contracts, payments } = data;
  const schedules = data.schedules || [];
  const totalDays = daysBetween(site.startDate, site.endDate);

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/sites"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] shrink-0"
            aria-label="현장 목록"
          >
            <ArrowLeft size={18} />
          </Link>
          <Building2 size={22} className="text-[var(--green)] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{site.name}</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
              {site.status} · {site.scope || "—"}
              {site.areaPyeong ? ` · ${site.areaPyeong}평` : ""}
            </p>
          </div>
        </div>
        <Link
          href={`/sites/${id}`}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--muted)] hover:border-[var(--green)] hover:text-[var(--green)]"
          title="모든 탭(9개) 상세 보기"
        >
          <ExternalLink size={12} />
          상세 보기
        </Link>
      </div>

      {/* 기본 정보 카드 — 한 번만 입력한 값을 여기서 읽어서 보여줌 */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-xs font-semibold text-[var(--muted)] mb-3">현장 기본 정보</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <InfoRow icon={User} label="고객">
            {site.customerName || "—"}
          </InfoRow>
          <InfoRow icon={Phone} label="연락처">
            {site.customerPhone ? (
              <a href={`tel:${site.customerPhone}`} className="hover:text-[var(--green)]">
                {site.customerPhone}
              </a>
            ) : (
              "—"
            )}
          </InfoRow>
          <InfoRow icon={MapPin} label="주소">
            {site.address || "—"}
          </InfoRow>
          <InfoRow icon={Wallet} label="총 예산">
            <span className="font-semibold">{fmtKrw(site.budget)}원</span>
          </InfoRow>
        </div>
      </section>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-[var(--border)]">
        <TabBtn icon={Hammer} label="공정" count={phases.length} active={tab === "phases"} onClick={() => setTab("phases")} />
        <TabBtn icon={Receipt} label="계약" count={contracts.length} active={tab === "contract"} onClick={() => setTab("contract")} />
        <TabBtn icon={Calendar} label="일정" active={tab === "schedule"} onClick={() => setTab("schedule")} />
      </div>

      {/* 탭 본문 */}
      {tab === "phases" && (
        <section className="space-y-3">
          {phases.length === 0 ? (
            <EmptyTab icon={Hammer} text="등록된 공정이 없습니다" />
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-[10px] text-[var(--muted)] uppercase">
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-4 py-2.5 font-semibold">공종</th>
                    <th className="text-left px-4 py-2.5 font-semibold">예정 기간</th>
                    <th className="text-center px-4 py-2.5 font-semibold">진행률</th>
                    <th className="text-center px-4 py-2.5 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)]/60 last:border-0">
                      <td className="px-4 py-3 font-medium">{p.category}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--background)] overflow-hidden">
                            <div className="h-full bg-[var(--green)]" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs text-[var(--muted)] w-8 text-right">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusPill status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "contract" && (
        <section className="space-y-3">
          {contracts.length === 0 ? (
            <EmptyTab icon={Receipt} text="등록된 계약이 없습니다" />
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <SummaryCard label="계약금액" value={`${fmtKrw(contracts[0].contractAmount)}원`} highlight />
                <SummaryCard label="계약일" value={fmtDate(contracts[0].contractDate)} />
                <SummaryCard label="분할 합계" value={`${fmtKrw(splitTotal)}원`} sub={splitTotal === contracts[0].contractAmount ? "일치 ✓" : "불일치"} />
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
                  <ListChecks size={14} className="text-[var(--muted)]" />
                  <p className="text-xs font-semibold text-[var(--muted)]">대금 분할 ({payments.length}건)</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-[10px] text-[var(--muted)] uppercase">
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2.5 font-semibold">항목</th>
                      <th className="text-right px-4 py-2.5 font-semibold">금액</th>
                      <th className="text-center px-4 py-2.5 font-semibold">비율</th>
                      <th className="text-center px-4 py-2.5 font-semibold">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const ratio = contracts[0].contractAmount > 0
                        ? Math.round((p.amount / contracts[0].contractAmount) * 100)
                        : 0;
                      return (
                        <tr key={p.id} className="border-b border-[var(--border)]/60 last:border-0">
                          <td className="px-4 py-3 font-medium">{p.type}</td>
                          <td className="px-4 py-3 text-right font-mono">{fmtKrw(p.amount)}</td>
                          <td className="px-4 py-3 text-center text-xs text-[var(--muted)]">{ratio}%</td>
                          <td className="px-4 py-3 text-center">
                            <StatusPill status={p.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "schedule" && (
        <section className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <SummaryCard label="착수일" value={fmtDate(site.startDate)} highlight />
            <SummaryCard label="준공일" value={fmtDate(site.endDate)} />
            <SummaryCard
              label="총 공사기간"
              value={totalDays !== null ? `${totalDays}일` : "—"}
              sub={
                totalDays !== null && totalDays > 0
                  ? `${Math.round(totalDays / 7 * 10) / 10}주`
                  : undefined
              }
            />
          </div>

          {/* 공정/작업별 일정 — site_schedules 가 있으면 우선, 없으면 phases 로 fallback */}
          {schedules.length > 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs font-semibold text-[var(--muted)] mb-3">
                공정·작업 일정 ({schedules.length}개)
              </p>
              <div className="space-y-2">
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 py-2 border-b border-[var(--border)]/60 last:border-0"
                  >
                    <span className="min-w-[80px] text-xs font-medium">{s.trade}</span>
                    <div className="flex-1 min-w-0">
                      {s.taskName && (
                        <p className="text-xs text-[var(--foreground)] truncate">
                          {s.taskName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] mt-0.5">
                        <Calendar size={11} />
                        {fmtDate(s.startDate)} ~ {fmtDate(s.endDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : phases.length > 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs font-semibold text-[var(--muted)] mb-3">
                공정별 일정 ({phases.length}개)
              </p>
              <div className="space-y-2">
                {phases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 py-2 border-b border-[var(--border)]/60 last:border-0"
                  >
                    <span className="min-w-[80px] text-xs font-medium">{p.category}</span>
                    <div className="flex-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Calendar size={11} />
                      {fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)}
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyTab icon={Calendar} text="공정 일정이 없습니다" />
          )}
        </section>
      )}
    </div>
  );
}

function TabBtn({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
        active
          ? "border-[var(--green)] text-[var(--foreground)] font-bold"
          : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      <Icon size={14} />
      {label}
      {typeof count === "number" && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? "bg-[var(--green)]/15 text-[var(--green)]" : "bg-white/[0.05]"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[var(--background)] flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-[var(--muted)]" />
      </div>
      <div className="min-w-0 text-sm">
        <p className="text-[10px] text-[var(--muted)] uppercase">{label}</p>
        <p className="mt-0.5 truncate">{children}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border ${
        highlight
          ? "border-[var(--green)]/40 bg-[var(--green)]/5"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <p className="text-[10px] text-[var(--muted)] uppercase">{label}</p>
      <p className={`mt-1 text-base font-bold ${highlight ? "text-[var(--green)]" : ""}`}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    예정: "bg-white/[0.06] text-[var(--muted)]",
    대기: "bg-white/[0.06] text-[var(--muted)]",
    진행중: "bg-[var(--green)]/15 text-[var(--green)]",
    완료: "bg-white/[0.06] text-[var(--muted)]",
    보류: "bg-[var(--orange)]/15 text-[var(--orange)]",
    미수: "bg-[var(--red)]/15 text-[var(--red)]",
    완납: "bg-[var(--green)]/15 text-[var(--green)]",
  };
  const cls = map[status] || "bg-white/[0.06] text-[var(--muted)]";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function EmptyTab({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
      <Icon size={28} className="mx-auto text-[var(--muted)] mb-2" />
      <p className="text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}
