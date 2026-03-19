"use client";

import { useEffect, useState } from "react";
import { Plus, FileCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";
import { PAYMENT_TYPES } from "@/lib/constants";
import Link from "next/link";

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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    siteId: "",
    contractAmount: "",
    contractDate: "",
    memo: "",
  });
  const [payments, setPayments] = useState([
    { type: "계약금", amount: "", dueDate: "" },
    { type: "중도금", amount: "", dueDate: "" },
    { type: "잔금", amount: "", dueDate: "" },
  ]);

  const fetchData = () => {
    Promise.all([
      fetch("/api/contracts").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ])
      .then(([contractData, siteData]) => {
        setContracts(contractData);
        setSites(siteData);
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
    const res = await fetch("/api/contracts", {
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
      fetchData();
    }
    setSaving(false);
  };

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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="등록된 계약이 없습니다"
          description="계약을 등록하고 결제 일정을 관리해보세요."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
            >
              첫 계약 등록하기
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const paidAmount = c.payments
              .filter((p) => p.status === "완납")
              .reduce((sum, p) => sum + p.amount, 0);
            const unpaid = c.contractAmount - paidAmount;
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
                    {unpaid > 0 && (
                      <p className="text-sm text-[var(--red)]">미수금 {fmt(unpaid)}</p>
                    )}
                  </div>
                </div>
                {/* Payment schedule */}
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none"
              placeholder="메모를 입력하세요..."
            />
          </div>

          {/* Payment schedule */}
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
                    className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-white text-sm focus:outline-none"
                  />
                  <input
                    type="date"
                    value={p.dueDate}
                    onChange={(e) => {
                      const newP = [...payments];
                      newP[idx].dueDate = e.target.value;
                      setPayments(newP);
                    }}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-white text-sm focus:outline-none"
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
