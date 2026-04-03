"use client";

import { useEffect, useState } from "react";
import { Plus, FileCheck, AlertTriangle, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { fmt, fmtDate, fmtShort, cn } from "@/lib/utils";
import Link from "next/link";

const PAYMENT_STATUSES = ["전체", "미납", "완납", "부분납"];

interface ContractPayment {
  id: string;
  type: string;
  amount: number;
  dueDate: string | null;
  paidDate: string | null;
  status: string;
}

interface Contract {
  id: string;
  contractAmount: number;
  contractDate: string | null;
  siteName: string | null;
  payments: ContractPayment[];
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
}

interface UnpaidSummary {
  totalUnpaid: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  count: number;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [unpaid, setUnpaid] = useState<UnpaidSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const [form, setForm] = useState({
    siteId: "",
    contractAmount: "",
    contractDate: "",
    memo: "",
  });
  const [payments, setPayments] = useState([
    { type: "계약금", amount: "", dueDate: "" },
    { type: "착수금", amount: "", dueDate: "" },
    { type: "중도금", amount: "", dueDate: "" },
    { type: "잔금", amount: "", dueDate: "" },
  ]);

  const fetchData = () => {
    Promise.all([
      apiFetch("/api/contracts").then((r) => r.json()),
      apiFetch("/api/sites").then((r) => r.json()),
      apiFetch("/api/unpaid").then((r) => r.json()),
    ])
      .then(([contractData, siteData, unpaidData]) => {
        setContracts(Array.isArray(contractData) ? contractData : []);
        setSites(Array.isArray(siteData) ? siteData : []);
        setUnpaid(unpaidData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: form.siteId || null,
        contractAmount: parseInt(form.contractAmount) || 0,
        contractDate: form.contractDate || null,
        memo: form.memo || null,
        payments: payments
          .filter((p) => p.amount)
          .map((p) => ({
            type: p.type,
            amount: parseInt(p.amount) || 0,
            dueDate: p.dueDate || null,
          })),
      }),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ siteId: "", contractAmount: "", contractDate: "", memo: "" });
      setPayments([
        { type: "계약금", amount: "", dueDate: "" },
        { type: "착수금", amount: "", dueDate: "" },
        { type: "중도금", amount: "", dueDate: "" },
        { type: "잔금", amount: "", dueDate: "" },
      ]);
      fetchData();
    }
    setSaving(false);
  };

  const totalContractAmount = contracts.reduce((s, c) => s + c.contractAmount, 0);
  const totalPaid = contracts.reduce(
    (s, c) => s + c.payments.filter((p) => p.status === "완납").reduce((ps, p) => ps + p.amount, 0),
    0
  );

  const filtered = contracts.filter((c) => {
    if (search && !c.siteName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "전체") {
      const hasPending = c.payments.some((p) => p.status === statusFilter);
      if (!hasPending) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">계약 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
        >
          <Plus size={18} />
          계약 등록
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">총 계약금액</p>
          <p className="text-xl font-bold mt-1">{fmtShort(totalContractAmount)}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{contracts.length}건</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">수금 완료</p>
          <p className="text-xl font-bold text-[var(--green)] mt-1">{fmtShort(totalPaid)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">미수금 총액</p>
          <p className="text-xl font-bold text-[var(--red)] mt-1">
            {fmtShort(unpaid?.totalUnpaid || 0)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{unpaid?.count || 0}건</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          {unpaid && (unpaid.overdue30 > 0 || unpaid.overdue60 > 0 || unpaid.overdue90 > 0) ? (
            <>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-[var(--orange)]" />
                <p className="text-sm text-[var(--orange)]">연체 현황</p>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {unpaid.overdue90 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--red)]">D+90 이상</span>
                    <span className="font-medium text-[var(--red)]">{fmtShort(unpaid.overdue90)}</span>
                  </div>
                )}
                {unpaid.overdue60 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--orange)]">D+60~89</span>
                    <span className="font-medium text-[var(--orange)]">{fmtShort(unpaid.overdue60)}</span>
                  </div>
                )}
                {unpaid.overdue30 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">D+30~59</span>
                    <span className="font-medium">{fmtShort(unpaid.overdue30)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)]">연체</p>
              <p className="text-xl font-bold text-[var(--green)] mt-1">없음</p>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex-1">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="현장명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={search || statusFilter !== "전체" ? "조건에 맞는 계약이 없습니다" : "등록된 계약이 없습니다"}
          description={!search && statusFilter === "전체" ? "계약을 등록하고 결제 일정을 관리해보세요." : undefined}
          action={
            !search && statusFilter === "전체" ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
              >
                첫 계약 등록하기
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const paidAmount = c.payments
              .filter((p) => p.status === "완납")
              .reduce((sum, p) => sum + p.amount, 0);
            const unpaidAmount = c.contractAmount - paidAmount;
            return (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="block p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{c.siteName || "현장 미지정"}</p>
                    <p className="text-sm text-[var(--muted)]">
                      계약일 {fmtDate(c.contractDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{fmt(c.contractAmount)}</p>
                    {unpaidAmount > 0 && (
                      <p className="text-sm text-[var(--red)]">미수금 {fmt(unpaidAmount)}</p>
                    )}
                  </div>
                </div>
                {c.payments.length > 0 && (
                  <div className="flex gap-2">
                    {c.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex-1 p-3 rounded-xl bg-white/[0.03]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--muted)]">{p.type}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-sm font-medium">{fmt(p.amount)}</p>
                        {p.dueDate && (
                          <p className="text-xs text-[var(--muted)]">
                            {fmtDate(p.dueDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="계약 등록"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">현장</label>
              <select
                value={form.siteId}
                onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none"
              >
                <option value="">선택</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">계약금액 *</label>
              <input
                type="number"
                required
                value={form.contractAmount}
                onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none"
                placeholder="원"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">계약일</label>
            <input
              type="date"
              value={form.contractDate}
              onChange={(e) => setForm({ ...form, contractDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none"
              placeholder="메모를 입력하세요..."
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">결제 일정</label>
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2">
                  <span className="px-3 py-2 rounded-lg bg-white/[0.03] text-sm flex items-center">
                    {p.type}
                  </span>
                  <input
                    type="number"
                    placeholder="금액"
                    value={p.amount}
                    onChange={(e) => {
                      const newP = [...payments];
                      newP[idx].amount = e.target.value;
                      setPayments(newP);
                    }}
                    className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none"
                  />
                  <input
                    type="date"
                    value={p.dueDate}
                    onChange={(e) => {
                      const newP = [...payments];
                      newP[idx].dueDate = e.target.value;
                      setPayments(newP);
                    }}
                    className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
