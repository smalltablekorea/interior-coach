"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Building2, FileText, FileCheck, Pencil, Trash2, Save, X } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";

interface SiteRef {
  id: string;
  name: string;
  status: string;
  areaPyeong: number;
}

interface EstimateRef {
  id: string;
  siteName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ContractRef {
  id: string;
  siteName: string;
  contractAmount: number;
  paidAmount: number;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  memo: string | null;
  createdAt: string;
  sites: SiteRef[];
  estimates: EstimateRef[];
  contracts: ContractRef[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", address: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setCustomer(null);
        else setCustomer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
    } catch {}
    setCustomer((prev) => prev ? { ...prev, ...editForm } : prev);
    setIsEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
    } catch {}
    window.location.href = "/customers";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-[400px] rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">고객을 찾을 수 없습니다.</p>
        <Link href="/customers" className="text-[var(--green)] hover:underline text-sm mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const totalContract = customer.contracts.reduce((s, c) => s + c.contractAmount, 0);
  const totalPaid = customer.contracts.reduce((s, c) => s + c.paidAmount, 0);

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 flex items-center justify-center text-[var(--green)] text-xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{customer.name}</h1>
              <p className="text-sm text-[var(--muted)]">등록일 {fmtDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(true);
                setEditForm({
                  name: customer.name,
                  phone: customer.phone || "",
                  email: customer.email || "",
                  address: customer.address || "",
                  memo: customer.memo || "",
                });
              }}
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
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
            >
              <X size={16} /> 취소
            </button>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contact Info */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--muted)] mb-4">연락처 정보</h2>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">이름</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="이름"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">전화번호</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="전화번호"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">이메일</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="이메일"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">주소</label>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="주소"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">메모</label>
                <textarea
                  value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  placeholder="메모"
                  rows={3}
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-[var(--muted)]" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[var(--muted)]" />
                  <span className="text-sm">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-[var(--muted)]" />
                  <span className="text-sm">{customer.address}</span>
                </div>
              )}
              {customer.memo && (
                <div className="mt-3 p-3 rounded-xl bg-white/[0.03] text-sm text-[var(--muted)]">
                  {customer.memo}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
            <p className="text-3xl font-bold">{customer.sites.length}</p>
            <p className="text-sm text-[var(--muted)] mt-1">현장</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
            <p className="text-2xl font-bold text-[var(--blue)]">{fmt(totalContract)}</p>
            <p className="text-sm text-[var(--muted)] mt-1">총 계약액</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
            <p className="text-2xl font-bold text-[var(--green)]">{fmt(totalPaid)}</p>
            <p className="text-sm text-[var(--muted)] mt-1">수금액</p>
          </div>
        </div>
      </div>

      {/* Sites */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-[var(--muted)]" />
          <h2 className="text-lg font-semibold">연결된 현장</h2>
        </div>
        {customer.sites.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">연결된 현장이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {customer.sites.map((s) => (
              <Link
                key={s.id}
                href={`/sites/${s.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{s.name}</p>
                  <StatusBadge status={s.status} />
                </div>
                <span className="text-sm text-[var(--muted)]">{s.areaPyeong}평</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Estimates */}
      {customer.estimates.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-[var(--muted)]" />
            <h2 className="text-lg font-semibold">견적서</h2>
          </div>
          <div className="space-y-2">
            {customer.estimates.map((e) => (
              <Link
                key={e.id}
                href={`/estimates/${e.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{e.siteName}</p>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="text-xs text-[var(--muted)]">{fmtDate(e.createdAt)}</p>
                </div>
                <p className="font-bold">{fmt(e.totalAmount)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Contracts */}
      {customer.contracts.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck size={18} className="text-[var(--muted)]" />
            <h2 className="text-lg font-semibold">계약</h2>
          </div>
          <div className="space-y-2">
            {customer.contracts.map((c) => (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <p className="font-medium">{c.siteName}</p>
                <div className="text-right">
                  <p className="font-bold">{fmt(c.contractAmount)}</p>
                  <p className="text-xs text-[var(--muted)]">수금 {fmt(c.paidAmount)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">삭제 확인</h3>
            <p className="text-sm text-[var(--muted)] mb-4">정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">
                취소
              </button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-[var(--red)] text-white text-sm font-medium">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
