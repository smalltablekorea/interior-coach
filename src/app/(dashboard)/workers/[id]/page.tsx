"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Wrench, Wallet, Building2, Pencil, Trash2, Save, X } from "lucide-react";
import { fmt, fmtDate } from "@/lib/utils";
import { TRADES } from "@/lib/constants";

interface Assignment {
  siteId: string;
  siteName: string;
  category: string;
  dates: string;
  dailyWage: number;
  days: number;
  totalWage: number;
}

interface WorkerDetail {
  id: string;
  name: string;
  phone: string | null;
  trade: string;
  dailyWage: number | null;
  memo: string | null;
  assignments: Assignment[];
}

export default function WorkerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", trade: "", dailyWage: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/workers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setWorker(null);
        else setWorker(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...editForm,
      dailyWage: editForm.dailyWage ? Number(editForm.dailyWage) : null,
    };
    try {
      await fetch(`/api/workers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}
    setWorker((prev) =>
      prev
        ? {
            ...prev,
            name: editForm.name,
            phone: editForm.phone || null,
            trade: editForm.trade,
            dailyWage: editForm.dailyWage ? Number(editForm.dailyWage) : null,
            memo: editForm.memo || null,
          }
        : prev
    );
    setIsEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/workers/${id}`, { method: "DELETE" });
    } catch {}
    window.location.href = "/workers";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-[300px] rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">작업자를 찾을 수 없습니다.</p>
        <Link href="/workers" className="text-[var(--green)] hover:underline text-sm mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const totalEarnings = worker.assignments.reduce((s, a) => s + a.totalWage, 0);
  const totalDays = worker.assignments.reduce((s, a) => s + a.days, 0);

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/workers"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--blue)]/10 flex items-center justify-center text-[var(--blue)] text-xl font-bold">
              {worker.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{worker.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--muted)]">
                {worker.trade}
              </span>
            </div>
          </div>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(true);
                setEditForm({
                  name: worker.name,
                  phone: worker.phone || "",
                  trade: worker.trade,
                  dailyWage: worker.dailyWage ? String(worker.dailyWage) : "",
                  memo: worker.memo || "",
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

      {/* Info & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--muted)] mb-4">기본 정보</h2>
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
                <label className="text-xs text-[var(--muted)] mb-1 block">직종</label>
                <select
                  value={editForm.trade}
                  onChange={(e) => setEditForm({ ...editForm, trade: e.target.value })}
                  className={inputClass}
                >
                  {TRADES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">일당</label>
                <input
                  type="number"
                  value={editForm.dailyWage}
                  onChange={(e) => setEditForm({ ...editForm, dailyWage: e.target.value })}
                  placeholder="일당"
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
              {worker.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-[var(--muted)]" />
                  <span>{worker.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Wrench size={16} className="text-[var(--muted)]" />
                <span>직종: {worker.trade}</span>
              </div>
              {worker.dailyWage && (
                <div className="flex items-center gap-3 text-sm">
                  <Wallet size={16} className="text-[var(--muted)]" />
                  <span>일당: {fmt(worker.dailyWage)}</span>
                </div>
              )}
              {worker.memo && (
                <div className="mt-3 p-3 rounded-xl bg-white/[0.03] text-sm text-[var(--muted)]">
                  {worker.memo}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-3xl font-bold">{totalDays}일</p>
          <p className="text-sm text-[var(--muted)] mt-1">총 투입일수</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-2xl font-bold text-[var(--green)]">{fmt(totalEarnings)}</p>
          <p className="text-sm text-[var(--muted)] mt-1">총 인건비</p>
        </div>
      </div>

      {/* Assignment History */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-[var(--muted)]" />
          <h2 className="text-lg font-semibold">배정 이력</h2>
        </div>
        {worker.assignments.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-8">배정 이력이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {worker.assignments.map((a, idx) => (
              <Link
                key={idx}
                href={`/sites/${a.siteId}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div>
                  <p className="font-medium">{a.siteName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {a.category} · {a.dates} · {a.days}일
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{fmt(a.totalWage)}</p>
                  <p className="text-xs text-[var(--muted)]">일당 {fmt(a.dailyWage)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

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
