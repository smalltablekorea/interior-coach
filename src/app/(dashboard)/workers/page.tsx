"use client";

import { useEffect, useState } from "react";
import { Plus, Search, HardHat, Phone } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import FeatureGate from "@/components/subscription/FeatureGate";
import { apiFetch } from "@/lib/api-client";
import { KoreanInput, KoreanTextarea } from "@/components/ui/KoreanInput";
import { fmt } from "@/lib/utils";
import { TRADES } from "@/lib/constants";
import Link from "next/link";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  trade: string;
  dailyWage: number | null;
  memo: string | null;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTrade, setFilterTrade] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    trade: "목공",
    dailyWage: "",
    memo: "",
  });

  const fetchWorkers = () => {
    apiFetch("/api/workers")
      .then((r) => r.json())
      .then((data) => {
        setWorkers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dailyWage: form.dailyWage ? parseInt(form.dailyWage) : null,
      }),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", phone: "", trade: "목공", dailyWage: "", memo: "" });
      fetchWorkers();
    }
    setSaving(false);
  };

  const filtered = workers.filter((w) => {
    const matchSearch =
      !search || w.name.includes(search) || w.phone?.includes(search);
    const matchTrade = !filterTrade || w.trade === filterTrade;
    return matchSearch && matchTrade;
  });

  return (
    <FeatureGate feature="workersManagement" label="작업자 관리">
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">작업자 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
        >
          <Plus size={18} />
          작업자 등록
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex-1">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="이름, 전화번호로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterTrade("")}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              !filterTrade
                ? "bg-[var(--green)]/10 text-[var(--green)]"
                : "bg-white/[0.04] text-[var(--muted)]"
            }`}
          >
            전체
          </button>
          {TRADES.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTrade(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filterTrade === t
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "bg-white/[0.04] text-[var(--muted)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title={search || filterTrade ? "조건에 맞는 작업자가 없습니다" : "등록된 작업자가 없습니다"}
          description={!search && !filterTrade ? "작업자를 등록하고 공정에 배정해보세요." : undefined}
          action={
            !search &&
            !filterTrade && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
              >
                첫 작업자 등록하기
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((w) => (
            <Link
              key={w.id}
              href={`/workers/${w.id}`}
              className="block p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--blue)]/10 flex items-center justify-center text-[var(--blue)] font-medium">
                  {w.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{w.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--muted)]">
                    {w.trade}
                  </span>
                </div>
              </div>
              {w.phone && (
                <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-1">
                  <Phone size={14} />
                  {w.phone}
                </div>
              )}
              {w.dailyWage && (
                <p className="text-sm">
                  일당 <span className="font-medium">{fmt(w.dailyWage)}</span>
                </p>
              )}
              {w.memo && (
                <p className="text-xs text-[var(--muted)] mt-2">{w.memo}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="작업자 등록">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">이름 *</label>
              <KoreanInput
                type="text"
                required
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                placeholder="이름"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                placeholder="010-0000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">직종 *</label>
              <select
                value={form.trade}
                onChange={(e) => setForm({ ...form, trade: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none"
              >
                {TRADES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">일당</label>
              <input
                type="number"
                value={form.dailyWage}
                onChange={(e) => setForm({ ...form, dailyWage: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                placeholder="원"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <KoreanTextarea
              value={form.memo}
              onChange={(v) => setForm({ ...form, memo: v })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none h-20"
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
    </div>
    </FeatureGate>
  );
}
