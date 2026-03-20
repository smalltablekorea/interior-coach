"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, User, Calendar, CheckCircle, Clock, AlertCircle, Pencil, Trash2, Save, X, Banknote } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";

interface Payment {
  id: string;
  type: string;
  amount: number;
  dueDate: string | null;
  paidDate: string | null;
  status: string;
  memo: string | null;
}

interface ContractDetail {
  id: string;
  contractAmount: number;
  contractDate: string | null;
  siteName: string | null;
  siteId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  memo: string | null;
  createdAt: string;
  estimateId: string | null;
  estimateAmount: number | null;
  payments: Payment[];
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ contractAmount: "", memo: "" });
  const [editPayments, setEditPayments] = useState<Payment[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToComplete, setPaymentToComplete] = useState<Payment | null>(null);

  const fetchContract = () => {
    fetch(`/api/contracts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setContract(null);
        else setContract(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchContract();
  }, [id]);

  const startEditing = () => {
    if (!contract) return;
    setEditForm({
      contractAmount: String(contract.contractAmount),
      memo: contract.memo || "",
    });
    setEditPayments(contract.payments.map((p) => ({ ...p })));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!contract) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAmount: parseInt(editForm.contractAmount) || contract.contractAmount,
          memo: editForm.memo || null,
          payments: editPayments,
        }),
      });
      if (res.ok) {
        fetchContract();
        setIsEditing(false);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    router.push("/contracts");
  };

  const togglePaymentStatus = (paymentId: string) => {
    setEditPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: p.status === "완납" ? "미수" : "완납" }
          : p
      )
    );
  };

  const handleCompletePayment = async () => {
    if (!paymentToComplete) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: [{
            id: paymentToComplete.id,
            status: "완납",
            paidDate: new Date().toISOString().split("T")[0],
          }],
        }),
      });
      if (res.ok) fetchContract();
    } catch {
      // ignore
    }
    setPaymentToComplete(null);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-[400px] rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">계약을 찾을 수 없습니다.</p>
        <Link href="/contracts" className="text-[var(--green)] hover:underline text-sm mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const paidAmount = contract.payments.filter((p) => p.status === "완납").reduce((s, p) => s + p.amount, 0);
  const unpaidAmt = contract.contractAmount - paidAmount;
  const paidPct = contract.contractAmount > 0 ? Math.round((paidAmount / contract.contractAmount) * 100) : 0;

  const statusIcon = (status: string) => {
    if (status === "완납") return <CheckCircle size={20} className="text-[var(--green)]" />;
    return <Clock size={20} className="text-[var(--orange)]" />;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/contracts"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{contract.siteName || "현장 미지정"}</h1>
            <p className="text-sm text-[var(--muted)]">계약일 {fmtDate(contract.contractDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
              >
                <X size={16} /> 취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50"
              >
                <Save size={16} /> {saving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
              >
                <Pencil size={16} /> 수정
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--red)]/30 text-sm text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
              >
                <Trash2 size={16} /> 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-sm text-[var(--muted)] mb-1">계약금액</p>
          {isEditing ? (
            <input
              type="number"
              value={editForm.contractAmount}
              onChange={(e) => setEditForm({ ...editForm, contractAmount: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-center text-2xl font-bold focus:border-[var(--green)] focus:outline-none"
            />
          ) : (
            <p className="text-2xl font-bold">{fmt(contract.contractAmount)}</p>
          )}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-sm text-[var(--muted)] mb-1">수금완료</p>
          <p className="text-2xl font-bold text-[var(--green)]">{fmt(paidAmount)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-sm text-[var(--muted)] mb-1">미수금</p>
          <p className="text-2xl font-bold text-[var(--red)]">{fmt(unpaidAmt)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">수금 진행률</h2>
          <span className="text-lg font-bold text-[var(--green)]">{paidPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--green)] transition-all" style={{ width: `${paidPct}%` }} />
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold mb-4">결제 일정</h2>
        <div className="space-y-3">
          {(isEditing ? editPayments : contract.payments).map((p) => {
            const isOverdue = p.status === "미수" && p.dueDate && new Date(p.dueDate) < new Date();
            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border ${
                  p.status === "완납"
                    ? "border-[var(--green)]/20 bg-[var(--green)]/5"
                    : isOverdue
                      ? "border-[var(--red)]/20 bg-[var(--red)]/5"
                      : "border-[var(--border)] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon(p.status)}
                    <div>
                      <p className="font-medium">{p.type}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {p.status === "완납"
                          ? `납부일 ${fmtDate(p.paidDate)}`
                          : `납부예정 ${fmtDate(p.dueDate)}`}
                        {isOverdue && (
                          <span className="text-[var(--red)] ml-1">
                            (D+{Math.floor((new Date().getTime() - new Date(p.dueDate!).getTime()) / (1000 * 60 * 60 * 24))})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold">{fmt(p.amount)}</p>
                    {isEditing ? (
                      <button
                        onClick={() => togglePaymentStatus(p.id)}
                        className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          p.status === "완납"
                            ? "bg-[var(--green)]/20 text-[var(--green)]"
                            : "bg-[var(--orange)]/20 text-[var(--orange)]"
                        }`}
                      >
                        {p.status === "완납" ? "완납 ✓" : "미수 → 완납"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        {p.status === "미수" && (
                          <button
                            onClick={() => setPaymentToComplete(p)}
                            className="text-xs px-2 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)] hover:bg-[var(--green)]/20 transition-colors"
                          >
                            완납 처리
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contract Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--muted)] mb-4">계약 정보</h2>
          <div className="space-y-3 text-sm">
            {contract.siteName && (
              <div className="flex items-center gap-3">
                <Building2 size={16} className="text-[var(--muted)]" />
                <Link href={`/sites/${contract.siteId}`} className="text-[var(--green)] hover:underline">
                  {contract.siteName}
                </Link>
              </div>
            )}
            {contract.customerName && (
              <div className="flex items-center gap-3">
                <User size={16} className="text-[var(--muted)]" />
                <span>{contract.customerName}</span>
                {contract.customerPhone && <span className="text-[var(--muted)]">{contract.customerPhone}</span>}
              </div>
            )}
            {contract.contractDate && (
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-[var(--muted)]" />
                <span>계약일 {fmtDate(contract.contractDate)}</span>
              </div>
            )}
            {contract.estimateId && (
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-[var(--muted)]" />
                <Link href={`/estimates/${contract.estimateId}`} className="text-[var(--green)] hover:underline">
                  견적서 보기 ({fmt(contract.estimateAmount)})
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--muted)] mb-4">메모</h2>
          {isEditing ? (
            <textarea
              value={editForm.memo}
              onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none resize-none"
              placeholder="메모를 입력하세요..."
            />
          ) : (
            <p className="text-sm">{contract.memo || "메모 없음"}</p>
          )}
        </div>
      </div>

      {/* Payment Completion Modal */}
      <Modal open={!!paymentToComplete} onClose={() => setPaymentToComplete(null)} title="완납 처리">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <Banknote size={20} className="text-[var(--green)]" />
              <div>
                <p className="font-medium">{paymentToComplete?.type}</p>
                <p className="text-lg font-bold">{fmt(paymentToComplete?.amount || 0)}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-[var(--muted)]">
            이 금액을 완납 처리하시겠습니까? 오늘 날짜로 기록됩니다.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setPaymentToComplete(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button
              onClick={handleCompletePayment}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm disabled:opacity-50"
            >
              <CheckCircle size={16} /> {saving ? "처리 중..." : "완납 처리"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="삭제 확인">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-[var(--red)] text-white text-sm font-medium">삭제</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
