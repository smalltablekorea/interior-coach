"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Calendar, AlertTriangle,
  Building2, Users, FileText, Sparkles, Cpu, Layers,
  HardHat, Package, Receipt, FileSignature, Wrench, ClipboardList,
  MessageSquare, Calculator, Megaphone, Bell, CalendarDays,
} from "lucide-react";

interface Detail {
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
  stats: {
    siteCount: number; customerCount: number; estimateCount: number;
    workerCount: number; attendanceCount: number;
    materialCount: number; materialOrderCount: number;
    expenseCount: number; expenseTotal: number;
    billingCount: number;
    contractCount: number; contractValueTotal: number;
    paymentReceived: number; paymentPending: number;
    defectCount: number; defectOpen: number;
    dailyLogCount: number; commLogCount: number;
    photoCount: number; schedulePlanCount: number;
    taxRevenueCount: number; taxRevenueTotal: number;
    taxExpenseCount: number; taxExpenseTotal: number;
    taxInvoiceCount: number; taxConsultCount: number;
    marketingPostCount: number; threadsPostCount: number;
    analysisCount: number;
    aiCalls24h: number; aiTokensIn: number; aiTokensOut: number;
  };
  sites: any[];
  customers: any[];
  estimates: any[];
  workers: any[];
  attendance: any[];
  materials: any[];
  materialOrders: any[];
  expenses: any[];
  contracts: any[];
  contractPayments: any[];
  billings: any[];
  defects: any[];
  dailyLogs: any[];
  communicationLogs: any[];
  schedulePlans: any[];
  notifications: any[];
  activityLog: any[];
  recentAi: any[];
  recentAnalysis: any[];
}

const TABS = [
  { id: "overview", label: "개요", icon: Layers },
  { id: "sites", label: "현장·공정", icon: Building2 },
  { id: "workers", label: "작업자·근태", icon: HardHat },
  { id: "materials", label: "자재·발주", icon: Package },
  { id: "finance", label: "정산·계약·지출", icon: Receipt },
  { id: "estimates", label: "견적·계약서", icon: FileSignature },
  { id: "site_ops", label: "작업일지·하자·사진", icon: Wrench },
  { id: "customers", label: "고객·상담", icon: Users },
  { id: "schedule", label: "스케줄플랜", icon: CalendarDays },
  { id: "tax", label: "세무", icon: Calculator },
  { id: "marketing", label: "마케팅", icon: Megaphone },
  { id: "ai", label: "AI 이력", icon: Cpu },
  { id: "system", label: "알림·활동로그", icon: Bell },
] as const;
type TabId = typeof TABS[number]["id"];

function fmt(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtT(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${fmt(s)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function won(n: number | null | undefined): string {
  if (!n) return "—";
  return `₩${Number(n).toLocaleString()}`;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${id}`, { credentials: "include" });
        const j = await res.json();
        if (!res.ok || j?.success === false) { setErr(j?.error || "조회 실패"); return; }
        setData(j?.data ?? j);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "네트워크 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">로딩 중...</div>;
  if (err || !data) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/admin/users" className="text-sm text-[var(--green)] hover:underline">← 목록</Link>
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{err || "데이터 없음"}</div>
      </div>
    );
  }

  const d = data;
  const trialDaysLeft = d.subscription?.trialEndsAt
    ? Math.ceil((new Date(d.subscription.trialEndsAt).getTime() - Date.now()) / 86400000)
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
            <h1 className="text-2xl font-bold">{d.user.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><Mail size={12} /> {d.user.email}</span>
              {d.user.phone && <span className="flex items-center gap-1"><Phone size={12} /> {d.user.phone}</span>}
              <span className="flex items-center gap-1"><Calendar size={12} /> 가입 {fmtT(d.user.createdAt)}</span>
              {d.user.activeWorkspaceName && <span>· {d.user.activeWorkspaceName}</span>}
            </p>
          </div>
          {d.subscription && (
            <div className="text-right">
              <PlanBadge plan={d.subscription.plan} status={d.subscription.status} />
              {d.subscription.status === "trialing" && trialDaysLeft !== null && (
                <p className="text-xs mt-1 text-[var(--muted)]">trial {trialDaysLeft}일 남음</p>
              )}
              {d.credits && <p className="text-xs mt-0.5 text-[var(--muted)]">분석권 {d.credits.remaining}/{d.credits.total}</p>}
            </div>
          )}
        </div>

        {/* 탭 */}
        <div className="border-b border-[var(--border)] overflow-x-auto -mx-6 px-6 mb-6">
          <div className="flex gap-1 text-sm">
            {TABS.map(({ id: tid, label, icon: Icon }) => (
              <button
                key={tid}
                onClick={() => setTab(tid)}
                className={`flex items-center gap-1.5 px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${
                  tab === tid
                    ? "border-[var(--green)] text-[var(--green)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {tab === "overview" && <Overview d={d} />}
        {tab === "sites" && <SitesTab sites={d.sites} />}
        {tab === "workers" && <WorkersTab workers={d.workers} attendance={d.attendance} />}
        {tab === "materials" && <MaterialsTab materials={d.materials} orders={d.materialOrders} />}
        {tab === "finance" && <FinanceTab expenses={d.expenses} billings={d.billings} contracts={d.contracts} payments={d.contractPayments} stats={d.stats} />}
        {tab === "estimates" && <EstimatesTab estimates={d.estimates} contracts={d.contracts} sites={d.sites} />}
        {tab === "site_ops" && <SiteOpsTab dailyLogs={d.dailyLogs} defects={d.defects} photoCount={d.stats.photoCount} />}
        {tab === "customers" && <CustomersTab customers={d.customers} commLogs={d.communicationLogs} />}
        {tab === "schedule" && <ScheduleTab plans={d.schedulePlans} />}
        {tab === "tax" && <TaxTab stats={d.stats} />}
        {tab === "marketing" && <MarketingTab stats={d.stats} />}
        {tab === "ai" && <AiTab recentAi={d.recentAi} recentAnalysis={d.recentAnalysis} stats={d.stats} />}
        {tab === "system" && <SystemTab notifications={d.notifications} activity={d.activityLog} />}
      </div>
    </div>
  );
}

// ────── Tab content ──────

function Overview({ d }: { d: Detail }) {
  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-[var(--muted)]">전체 활동 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Stat label="현장" value={d.stats.siteCount} icon={<Building2 size={14} />} />
          <Stat label="고객" value={d.stats.customerCount} icon={<Users size={14} />} />
          <Stat label="견적" value={d.stats.estimateCount} icon={<FileText size={14} />} />
          <Stat label="계약" value={d.stats.contractCount} icon={<FileSignature size={14} />} />
          <Stat label="작업자" value={d.stats.workerCount} icon={<HardHat size={14} />} />
          <Stat label="근태" value={d.stats.attendanceCount} icon={<Calendar size={14} />} />
          <Stat label="자재" value={d.stats.materialCount} icon={<Package size={14} />} />
          <Stat label="발주" value={d.stats.materialOrderCount} icon={<Package size={14} />} />
          <Stat label="지출" value={d.stats.expenseCount} sub={won(d.stats.expenseTotal)} icon={<Receipt size={14} />} />
          <Stat label="정산" value={d.stats.billingCount} icon={<Receipt size={14} />} />
          <Stat label="하자" value={`${d.stats.defectOpen}/${d.stats.defectCount}`} sub="미해결/전체" icon={<AlertTriangle size={14} />} accent={d.stats.defectOpen > 0 ? "amber" : undefined} />
          <Stat label="작업일지" value={d.stats.dailyLogCount} icon={<ClipboardList size={14} />} />
          <Stat label="현장 사진" value={d.stats.photoCount} icon={<Layers size={14} />} />
          <Stat label="상담 이력" value={d.stats.commLogCount} icon={<MessageSquare size={14} />} />
          <Stat label="스케줄플랜" value={d.stats.schedulePlanCount} icon={<CalendarDays size={14} />} />
          <Stat label="분석권" value={d.credits ? `${d.credits.remaining}/${d.credits.total}` : "—"} icon={<Sparkles size={14} />} />
          <Stat label="24h AI" value={d.stats.aiCalls24h} sub={`in ${d.stats.aiTokensIn}/out ${d.stats.aiTokensOut}`} icon={<Cpu size={14} />} accent={d.stats.aiCalls24h >= 50 ? "amber" : undefined} />
          <Stat label="마케팅/Threads" value={`${d.stats.marketingPostCount}/${d.stats.threadsPostCount}`} icon={<Megaphone size={14} />} />
        </div>
      </div>

      {/* 금액 요약 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-[var(--muted)]">금액 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="계약 총액" value={won(d.stats.contractValueTotal)} />
          <Stat label="수금 완료" value={won(d.stats.paymentReceived)} accent="green" />
          <Stat label="미수금" value={won(d.stats.paymentPending)} accent={d.stats.paymentPending > 0 ? "amber" : undefined} />
          <Stat label="지출 누적" value={won(d.stats.expenseTotal)} />
          <Stat label="세무 매출" value={won(d.stats.taxRevenueTotal)} sub={`${d.stats.taxRevenueCount}건`} />
          <Stat label="세무 지출" value={won(d.stats.taxExpenseTotal)} sub={`${d.stats.taxExpenseCount}건`} />
          <Stat label="세금계산서" value={`${d.stats.taxInvoiceCount}건`} />
          <Stat label="AI 세무상담" value={`${d.stats.taxConsultCount}회`} />
        </div>
      </div>

      {/* 워크스페이스 */}
      <Section title="워크스페이스" count={d.workspaces.length}>
        {d.workspaces.length === 0 ? <Empty label="워크스페이스 없음" warn /> : (
          <div className="space-y-2">
            {d.workspaces.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {w.name}
                    {w.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)]">활성</span>}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">역할: {w.role} · 가입 {fmt(w.joinedAt)}</div>
                </div>
                <div className="text-xs text-[var(--muted)] font-mono">{w.id.slice(0, 8)}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function SitesTab({ sites }: { sites: any[] }) {
  if (sites.length === 0) return <Empty label="등록된 현장 없음" />;
  return (
    <div className="space-y-3">
      {sites.map((s) => (
        <div key={s.id} className="rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                {[s.buildingType, s.areaPyeong ? `${s.areaPyeong}평` : null, s.address].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5">{s.status}</span>
              <div className="text-xs text-[var(--muted)] mt-1">{fmt(s.startDate)} ~ {fmt(s.endDate)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div><span className="text-[var(--muted)]">진행</span> <strong>{s.progress ?? 0}%</strong></div>
            <div><span className="text-[var(--muted)]">예산</span> {won(s.budget)}</div>
            <div><span className="text-[var(--muted)]">지출</span> {won(s.spent)}</div>
          </div>
          {s.phases.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--muted)] mb-2">공정 일정 ({s.phases.length})</div>
              <div className="space-y-1">
                {s.phases.map((p: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-2 text-xs items-center">
                    <div className="col-span-3 truncate">{p.category}</div>
                    <div className="col-span-3 text-[var(--muted)]">계획 {fmt(p.plannedStart)} ~ {fmt(p.plannedEnd)}</div>
                    <div className="col-span-3 text-[var(--muted)]">실제 {fmt(p.actualStart)} ~ {fmt(p.actualEnd)}</div>
                    <div className="col-span-2"><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5">{p.status ?? "대기"}</span></div>
                    <div className="col-span-1 text-right">{p.progress ?? 0}%</div>
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

function WorkersTab({ workers, attendance }: { workers: any[]; attendance: any[] }) {
  return (
    <div className="space-y-6">
      <Section title="작업자" count={workers.length}>
        {workers.length === 0 ? <Empty label="작업자 없음" /> : (
          <Table headers={["이름", "역할", "연락처", "단가", "메모", "등록일"]}>
            {workers.map((w) => (
              <tr key={w.id} className="border-b border-[var(--border)]">
                <td className="py-2">{w.name}</td>
                <td className="py-2 text-xs">{w.role || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{w.phone || "—"}</td>
                <td className="py-2 text-xs">{won(w.dailyRate)}</td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{w.memo || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmt(w.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
      <Section title="근태" count={attendance.length} subtitle={`최근 ${attendance.length}건`}>
        {attendance.length === 0 ? <Empty label="근태 기록 없음" /> : (
          <Table headers={["일자", "이름", "역할", "출근", "퇴근", "근무시간", "상태"]}>
            {attendance.map((a) => (
              <tr key={a.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(a.workDate)}</td>
                <td className="py-2 text-xs">{a.memberName}</td>
                <td className="py-2 text-xs">{a.role}</td>
                <td className="py-2 text-xs">{a.checkIn || "—"}</td>
                <td className="py-2 text-xs">{a.checkOut || "—"}</td>
                <td className="py-2 text-xs text-right">{a.hoursWorked ?? "—"}h</td>
                <td className="py-2 text-xs"><span className="px-1.5 py-0.5 rounded-full bg-white/5">{a.status}</span></td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function MaterialsTab({ materials, orders }: { materials: any[]; orders: any[] }) {
  return (
    <div className="space-y-6">
      <Section title="자재" count={materials.length}>
        {materials.length === 0 ? <Empty label="자재 없음" /> : (
          <Table headers={["품명", "공종", "단위", "단가", "거래처", "등록일"]}>
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-[var(--border)]">
                <td className="py-2">{m.name}</td>
                <td className="py-2 text-xs">{m.category || "—"}</td>
                <td className="py-2 text-xs">{m.unit || "—"}</td>
                <td className="py-2 text-xs text-right">{won(m.unitPrice)}</td>
                <td className="py-2 text-xs">{m.vendor || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmt(m.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
      <Section title="자재 발주" count={orders.length}>
        {orders.length === 0 ? <Empty label="발주 이력 없음" /> : (
          <Table headers={["일자", "거래처", "총액", "상태", "메모"]}>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(o.orderDate || o.createdAt)}</td>
                <td className="py-2 text-xs">{o.vendor || "—"}</td>
                <td className="py-2 text-xs text-right">{won(o.totalAmount)}</td>
                <td className="py-2 text-xs"><span className="px-1.5 py-0.5 rounded-full bg-white/5">{o.status}</span></td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{o.memo || "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function FinanceTab({ expenses, billings, contracts, payments, stats }: { expenses: any[]; billings: any[]; contracts: any[]; payments: any[]; stats: Detail["stats"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="계약 총액" value={won(stats.contractValueTotal)} />
        <Stat label="수금 완료" value={won(stats.paymentReceived)} accent="green" />
        <Stat label="미수금" value={won(stats.paymentPending)} accent={stats.paymentPending > 0 ? "amber" : undefined} />
        <Stat label="지출 누적" value={won(stats.expenseTotal)} />
      </div>

      <Section title="계약" count={contracts.length}>
        {contracts.length === 0 ? <Empty label="계약 없음" /> : (
          <Table headers={["계약일", "금액", "메모", "생성일"]}>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(c.contractDate)}</td>
                <td className="py-2 text-xs text-right">{won(c.contractAmount)}</td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{c.memo || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmt(c.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="계약금 결제" count={payments.length}>
        {payments.length === 0 ? <Empty label="결제 기록 없음" /> : (
          <Table headers={["종류", "금액", "예정일", "결제일", "상태"]}>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{p.type}</td>
                <td className="py-2 text-xs text-right">{won(p.amount)}</td>
                <td className="py-2 text-xs">{fmt(p.dueDate)}</td>
                <td className="py-2 text-xs">{fmt(p.paidDate)}</td>
                <td className="py-2 text-xs"><span className={`px-1.5 py-0.5 rounded-full ${p.status === "완납" ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-amber-500/10 text-amber-400"}`}>{p.status}</span></td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="지출" count={expenses.length}>
        {expenses.length === 0 ? <Empty label="지출 기록 없음" /> : (
          <Table headers={["일자", "카테고리", "내용", "금액", "결제방식"]}>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(e.date || e.createdAt)}</td>
                <td className="py-2 text-xs">{e.category}</td>
                <td className="py-2 text-xs truncate max-w-xs">{e.description || "—"}</td>
                <td className="py-2 text-xs text-right">{won(e.amount)}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{e.paymentMethod || "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="정산 (현장별)" count={billings.length}>
        {billings.length === 0 ? <Empty label="정산 없음" /> : (
          <Table headers={["일자", "공종", "금액", "상태", "메모"]}>
            {billings.map((b) => (
              <tr key={b.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(b.billingDate || b.createdAt)}</td>
                <td className="py-2 text-xs">{b.tradeCategory || "—"}</td>
                <td className="py-2 text-xs text-right">{won(b.amount)}</td>
                <td className="py-2 text-xs"><span className="px-1.5 py-0.5 rounded-full bg-white/5">{b.status}</span></td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{b.memo || "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function EstimatesTab({ estimates, contracts, sites }: { estimates: any[]; contracts: any[]; sites: any[] }) {
  return (
    <div className="space-y-6">
      <Section title="견적서" count={estimates.length}>
        {estimates.length === 0 ? <Empty label="견적 없음" /> : (
          <Table headers={["현장", "버전", "총액", "수익률", "상태", "생성일"]}>
            {estimates.map((e) => {
              const site = sites.find((s) => s.id === e.siteId);
              return (
                <tr key={e.id} className="border-b border-[var(--border)]">
                  <td className="py-2 text-xs">{site?.name || "—"}</td>
                  <td className="py-2 text-xs">v{e.version}</td>
                  <td className="py-2 text-xs text-right">{won(e.totalAmount)}</td>
                  <td className="py-2 text-xs">{e.profitRate ?? 0}%</td>
                  <td className="py-2 text-xs">{e.status}</td>
                  <td className="py-2 text-xs text-[var(--muted)]">{fmtT(e.createdAt)}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Section>
      <Section title="계약서" count={contracts.length}>
        {contracts.length === 0 ? <Empty label="계약서 없음" /> : (
          <Table headers={["계약일", "금액", "메모", "생성일"]}>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(c.contractDate)}</td>
                <td className="py-2 text-xs text-right">{won(c.contractAmount)}</td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{c.memo || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmt(c.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function SiteOpsTab({ dailyLogs, defects, photoCount }: { dailyLogs: any[]; defects: any[]; photoCount: number }) {
  return (
    <div className="space-y-6">
      <Section title="작업일지" count={dailyLogs.length}>
        {dailyLogs.length === 0 ? <Empty label="작업일지 없음" /> : (
          <Table headers={["일자", "작성자", "요약", "공종", "이슈", "날씨"]}>
            {dailyLogs.map((l) => (
              <tr key={l.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(l.logDate)}</td>
                <td className="py-2 text-xs">{l.authorName}</td>
                <td className="py-2 text-xs truncate max-w-xs">{l.summary}</td>
                <td className="py-2 text-xs">{Array.isArray(l.tradesWorkedNames) ? l.tradesWorkedNames.join(", ") : "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{l.issues || "—"}</td>
                <td className="py-2 text-xs">{l.weather || "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
      <Section title="하자 처리" count={defects.length}>
        {defects.length === 0 ? <Empty label="하자 없음" /> : (
          <Table headers={["발견일", "공종", "내용", "심각도", "상태"]}>
            {defects.map((df) => (
              <tr key={df.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmt(df.discoveredDate || df.createdAt)}</td>
                <td className="py-2 text-xs">{df.trade || "—"}</td>
                <td className="py-2 text-xs truncate max-w-xs">{df.description}</td>
                <td className="py-2 text-xs">{df.severity || "—"}</td>
                <td className="py-2 text-xs"><span className={`px-1.5 py-0.5 rounded-full ${df.status === "완료" ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-amber-500/10 text-amber-400"}`}>{df.status}</span></td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
      <Section title="현장 사진" count={photoCount}>
        <p className="text-sm text-[var(--muted)]">총 {photoCount}장 업로드됨</p>
      </Section>
    </div>
  );
}

function CustomersTab({ customers, commLogs }: { customers: any[]; commLogs: any[] }) {
  return (
    <div className="space-y-6">
      <Section title="고객" count={customers.length}>
        {customers.length === 0 ? <Empty label="고객 없음" /> : (
          <Table headers={["이름", "연락처", "주소", "상태", "메모", "등록일"]}>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)]">
                <td className="py-2">{c.name}</td>
                <td className="py-2 text-xs">{c.phone || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{c.address || "—"}</td>
                <td className="py-2 text-xs"><span className="px-1.5 py-0.5 rounded-full bg-white/5">{c.status}</span></td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{c.memo || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmt(c.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
      <Section title="상담 이력" count={commLogs.length}>
        {commLogs.length === 0 ? <Empty label="상담 이력 없음" /> : (
          <Table headers={["일시", "유형", "내용", "결과"]}>
            {commLogs.map((l) => (
              <tr key={l.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmtT(l.createdAt)}</td>
                <td className="py-2 text-xs">{l.type || "—"}</td>
                <td className="py-2 text-xs truncate max-w-xs">{l.content || l.note || "—"}</td>
                <td className="py-2 text-xs">{l.outcome || "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function ScheduleTab({ plans }: { plans: any[] }) {
  if (plans.length === 0) return <Empty label="스케줄 플랜 없음" />;
  return (
    <Table headers={["현장명", "주소", "시작일", "평형", "계절", "공종", "상태"]}>
      {plans.map((p) => (
        <tr key={p.id} className="border-b border-[var(--border)]">
          <td className="py-2 text-xs">{p.siteName}</td>
          <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{p.siteAddress || "—"}</td>
          <td className="py-2 text-xs">{fmt(p.startDate)}</td>
          <td className="py-2 text-xs">{p.sizeId}</td>
          <td className="py-2 text-xs">{p.season}</td>
          <td className="py-2 text-xs">{Array.isArray(p.selectedTrades) ? p.selectedTrades.length : 0}개</td>
          <td className="py-2 text-xs">{p.status}</td>
        </tr>
      ))}
    </Table>
  );
}

function TaxTab({ stats }: { stats: Detail["stats"] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="세무 매출" value={won(stats.taxRevenueTotal)} sub={`${stats.taxRevenueCount}건`} />
      <Stat label="세무 지출" value={won(stats.taxExpenseTotal)} sub={`${stats.taxExpenseCount}건`} />
      <Stat label="세금계산서" value={`${stats.taxInvoiceCount}건`} />
      <Stat label="AI 세무 상담" value={`${stats.taxConsultCount}회`} />
    </div>
  );
}

function MarketingTab({ stats }: { stats: Detail["stats"] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="마케팅 포스트" value={stats.marketingPostCount} />
      <Stat label="Threads 포스트" value={stats.threadsPostCount} />
    </div>
  );
}

function AiTab({ recentAi, recentAnalysis, stats }: { recentAi: any[]; recentAnalysis: any[]; stats: Detail["stats"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="24h 호출" value={stats.aiCalls24h} accent={stats.aiCalls24h >= 50 ? "amber" : undefined} />
        <Stat label="총 input 토큰" value={stats.aiTokensIn.toLocaleString()} />
        <Stat label="총 output 토큰" value={stats.aiTokensOut.toLocaleString()} />
        <Stat label="분석권 사용" value={stats.analysisCount} />
      </div>
      <Section title="분석권 사용 이력" count={recentAnalysis.length}>
        {recentAnalysis.length === 0 ? <Empty label="분석 이력 없음" /> : (
          <Table headers={["평수", "등급", "건물", "사용일시"]}>
            {recentAnalysis.map((a) => (
              <tr key={a.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{a.area}평</td>
                <td className="py-2 text-xs">{a.grade}</td>
                <td className="py-2 text-xs">{a.buildingType || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmtT(a.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
      <Section title="AI 호출 이력" count={recentAi.length}>
        {recentAi.length === 0 ? <Empty label="AI 호출 없음" /> : (
          <Table headers={["엔드포인트", "모델", "in", "out", "시각"]}>
            {recentAi.map((a, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs font-mono">{a.endpoint}</td>
                <td className="py-2 text-xs">{a.model.replace(/^claude-/, "")}</td>
                <td className="py-2 text-xs text-right">{a.inputTokens}</td>
                <td className="py-2 text-xs text-right">{a.outputTokens}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmtT(a.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function SystemTab({ notifications, activity }: { notifications: any[]; activity: any[] }) {
  return (
    <div className="space-y-6">
      <Section title="알림" count={notifications.length}>
        {notifications.length === 0 ? <Empty label="알림 없음" /> : (
          <Table headers={["유형", "제목", "내용", "읽음", "생성일"]}>
            {notifications.map((n) => (
              <tr key={n.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{n.type || "—"}</td>
                <td className="py-2 text-xs">{n.title}</td>
                <td className="py-2 text-xs truncate max-w-xs">{n.message || n.body || "—"}</td>
                <td className="py-2 text-xs">{n.isRead || n.readAt ? "읽음" : "안 읽음"}</td>
                <td className="py-2 text-xs text-[var(--muted)]">{fmtT(n.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
      <Section title="활동 로그" count={activity.length}>
        {activity.length === 0 ? <Empty label="활동 로그 없음" /> : (
          <Table headers={["시각", "액션", "리소스", "메타"]}>
            {activity.map((a) => (
              <tr key={a.id} className="border-b border-[var(--border)]">
                <td className="py-2 text-xs">{fmtT(a.createdAt)}</td>
                <td className="py-2 text-xs">{a.action}</td>
                <td className="py-2 text-xs">{a.resourceType || "—"}</td>
                <td className="py-2 text-xs text-[var(--muted)] truncate max-w-xs">{a.metadata ? JSON.stringify(a.metadata).slice(0, 80) : "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

// ────── 공통 컴포넌트 ──────

function Section({ title, count, subtitle, children }: {
  title: string; count?: number; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">
        {title}
        {typeof count === "number" && <span className="text-xs text-[var(--muted)] ml-2">({count})</span>}
        {subtitle && <span className="text-xs text-[var(--muted)] ml-2">{subtitle}</span>}
      </h3>
      <div className="rounded-xl border border-[var(--border)] p-4 overflow-x-auto">{children}</div>
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

function Stat({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon?: React.ReactNode; accent?: "amber" | "red" | "green";
}) {
  const color =
    accent === "amber" ? "text-amber-400" :
    accent === "red" ? "text-red-400" :
    accent === "green" ? "text-[var(--green)]" : "text-[var(--foreground)]";
  return (
    <div className="p-3 rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">{icon} {label}</div>
      <div className={`text-lg font-bold mt-1 ${color}`}>
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

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-[var(--muted)]">
        <tr className="border-b border-[var(--border)]">
          {headers.map((h, i) => (
            <th key={i} className="text-left py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
