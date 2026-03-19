"use client";

import { useEffect, useState } from "react";
import { Plus, Hammer, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmtDate } from "@/lib/utils";
import { TRADES, PHASE_STATUSES } from "@/lib/constants";

interface Phase {
  id: string;
  category: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  progress: number;
  status: string;
  memo: string | null;
  siteId: string;
  siteName: string | null;
}

interface Site {
  id: string;
  name: string;
}

export default function ConstructionPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    siteId: "",
    category: "철거",
    plannedStart: "",
    plannedEnd: "",
    memo: "",
  });

  // Edit/Delete states
  const [editPhase, setEditPhase] = useState<Phase | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    category: "철거",
    plannedStart: "",
    plannedEnd: "",
    progress: "0",
    status: "대기",
    memo: "",
  });
  const [deletePhaseId, setDeletePhaseId] = useState<string | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/construction").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ])
      .then(([phaseData, siteData]) => {
        setPhases(phaseData);
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
    const res = await fetch("/api/construction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ siteId: "", category: "철거", plannedStart: "", plannedEnd: "", memo: "" });
      fetchData();
    }
    setSaving(false);
  };

  const openEdit = (phase: Phase) => {
    setEditPhase(phase);
    setEditForm({
      category: phase.category,
      plannedStart: phase.plannedStart || "",
      plannedEnd: phase.plannedEnd || "",
      progress: String(phase.progress),
      status: phase.status,
      memo: phase.memo || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhase) return;
    setPhases((prev) =>
      prev.map((p) =>
        p.id === editPhase.id
          ? {
              ...p,
              category: editForm.category,
              plannedStart: editForm.plannedStart || null,
              plannedEnd: editForm.plannedEnd || null,
              progress: parseInt(editForm.progress) || 0,
              status: editForm.status,
              memo: editForm.memo || null,
            }
          : p
      )
    );
    setShowEditModal(false);
    setEditPhase(null);
  };

  const handleDeletePhase = (phaseId: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== phaseId));
    setDeletePhaseId(null);
  };

  // Group by site
  const grouped: Record<string, { siteName: string; phases: Phase[] }> = {};
  phases.forEach((p) => {
    if (!grouped[p.siteId]) {
      grouped[p.siteId] = { siteName: p.siteName || "미지정", phases: [] };
    }
    grouped[p.siteId].phases.push(p);
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">시공 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
        >
          <Plus size={18} />
          공정 추가
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="등록된 공정이 없습니다"
          description="현장별 공정을 등록하고 진행률을 관리해보세요."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
            >
              첫 공정 추가하기
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([siteId, group]) => (
            <div
              key={siteId}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <h2 className="text-lg font-semibold mb-4">{group.siteName}</h2>
              <div className="space-y-3">
                {group.phases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]"
                  >
                    <div className="w-16 text-sm font-medium">{p.category}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${p.progress}%`,
                              backgroundColor:
                                p.progress >= 100
                                  ? "var(--green)"
                                  : p.progress > 0
                                  ? "var(--blue)"
                                  : "var(--muted)",
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {p.progress}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                        {p.plannedStart && <span>계획 {fmtDate(p.plannedStart)}</span>}
                        {p.plannedEnd && <span>~ {fmtDate(p.plannedEnd)}</span>}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        title="편집"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletePhaseId(p.id)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="공정 추가">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">현장 *</label>
            <select
              required
              value={form.siteId}
              onChange={(e) => setForm({ ...form, siteId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
            >
              <option value="">선택</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">공종 *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
            >
              {TRADES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">시작 예정일</label>
              <input
                type="date"
                value={form.plannedStart}
                onChange={(e) => setForm({ ...form, plannedStart: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">종료 예정일</label>
              <input
                type="date"
                value={form.plannedEnd}
                onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none h-20"
            />
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

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="공정 수정">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">공종</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
            >
              {TRADES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">시작 예정일</label>
              <input
                type="date"
                value={editForm.plannedStart}
                onChange={(e) => setEditForm({ ...editForm, plannedStart: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">종료 예정일</label>
              <input
                type="date"
                value={editForm.plannedEnd}
                onChange={(e) => setEditForm({ ...editForm, plannedEnd: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">진행률 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={editForm.progress}
                onChange={(e) => setEditForm({ ...editForm, progress: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              >
                {PHASE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <textarea
              value={editForm.memo}
              onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none h-20"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
            >
              저장
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deletePhaseId} onClose={() => setDeletePhaseId(null)} title="공정 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            이 공정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletePhaseId(null)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
            >
              취소
            </button>
            <button
              onClick={() => deletePhaseId && handleDeletePhase(deletePhaseId)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white font-medium text-sm"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
