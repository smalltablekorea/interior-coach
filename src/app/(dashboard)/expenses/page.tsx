"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Receipt, Filter, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fmt, fmtDate, fmtShort } from "@/lib/utils";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  siteId: string;
  siteName: string;
  paymentMethod: string;
  receiptUrl: string | null;
}

interface Site {
  id: string;
  name: string;
}

const EXPENSE_CATEGORIES = ["자재비", "인건비", "운반비", "장비비", "기타"] as const;
const PAYMENT_METHODS = ["카드", "계좌이체", "현금"] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  자재비: { bg: "bg-blue-500/10", text: "text-blue-400" },
  인건비: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  운반비: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  장비비: { bg: "bg-purple-500/10", text: "text-purple-400" },
  기타: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    siteId: "",
    category: "자재비" as string,
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "카드" as string,
  });

  // Edit/Delete states
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    category: "자재비",
    description: "",
    amount: "",
    date: "",
    paymentMethod: "카드",
  });
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/expenses").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ])
      .then(([expData, siteData]) => {
        setExpenses(expData);
        setSites(siteData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || e.description.includes(search) || e.siteName.includes(search);
    const matchSite = !filterSite || e.siteId === filterSite;
    const matchCategory = !filterCategory || e.category === filterCategory;
    return matchSearch && matchSite && matchCategory;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  filtered.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseInt(form.amount) || 0,
      }),
    });
    setSaving(false);
    if (res.status === 503) {
      setShowModal(false);
      alert("데모 모드에서는 등록할 수 없습니다.");
    }
  };

  const openEditExpense = (expense: Expense) => {
    setEditExpense(expense);
    setEditForm({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date,
      paymentMethod: expense.paymentMethod,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpense) return;
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === editExpense.id
          ? {
              ...exp,
              category: editForm.category,
              description: editForm.description,
              amount: parseInt(editForm.amount) || 0,
              date: editForm.date,
              paymentMethod: editForm.paymentMethod,
            }
          : exp
      )
    );
    setShowEditModal(false);
    setEditExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    setDeleteExpenseId(null);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">지출 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
        >
          <Plus size={18} />
          지출 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">총 지출</p>
          <p className="text-xl font-bold mt-1">{fmtShort(totalAmount)}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{filtered.length}건</p>
        </div>
        {Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, amount]) => {
            const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["기타"];
            return (
              <div key={cat} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {cat}
                  </span>
                </div>
                <p className="text-xl font-bold mt-2">{fmtShort(amount)}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {Math.round((amount / totalAmount) * 100)}%
                </p>
              </div>
            );
          })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex-1">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="내역 또는 현장명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          className="px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-white focus:outline-none"
        >
          <option value="">전체 현장</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory("")}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              !filterCategory
                ? "bg-[var(--green)]/10 text-[var(--green)]"
                : "bg-white/[0.04] text-[var(--muted)]"
            }`}
          >
            전체
          </button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "bg-white/[0.04] text-[var(--muted)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Category Breakdown Bar */}
      {totalAmount > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold text-[var(--muted)] mb-3">카테고리별 비율</h3>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const pct = (amount / totalAmount) * 100;
                const colorMap: Record<string, string> = {
                  자재비: "bg-blue-500",
                  인건비: "bg-[var(--green)]",
                  운반비: "bg-[var(--orange)]",
                  장비비: "bg-purple-500",
                  기타: "bg-gray-500",
                };
                return (
                  <div
                    key={cat}
                    className={`${colorMap[cat] || "bg-gray-500"} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${cat}: ${fmtShort(amount)} (${Math.round(pct)}%)`}
                  />
                );
              })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["기타"];
                return (
                  <div key={cat} className="flex items-center gap-1.5 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-sm ${colors.bg}`} />
                    <span className="text-[var(--muted)]">{cat}</span>
                    <span className="font-medium">{fmtShort(amount)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={search || filterSite || filterCategory ? "조건에 맞는 지출이 없습니다" : "등록된 지출이 없습니다"}
          description={!search && !filterSite && !filterCategory ? "지출 내역을 등록해보세요." : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => {
            const colors = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS["기타"];
            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Receipt size={18} className="text-[var(--muted)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium">{expense.description}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                        {expense.category}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {expense.siteName} · {expense.paymentMethod} · {fmtDate(expense.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-bold text-[var(--red)]">-{fmt(expense.amount)}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditExpense(expense)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      title="편집"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteExpenseId(expense.id)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Expense Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="지출 등록">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">현장</label>
            <select
              value={form.siteId}
              onChange={(e) => setForm({ ...form, siteId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none text-sm"
            >
              <option value="">선택</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none text-sm"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">결제수단</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none text-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">내역</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="지출 내역을 입력하세요"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none text-sm placeholder:text-[var(--muted)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">금액</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none text-sm"
              />
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
              {saving ? "저장 중..." : "등록"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="지출 수정">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">카테고리</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">결제수단</label>
              <select
                value={editForm.paymentMethod}
                onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">내역</label>
            <input
              type="text"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">금액</label>
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">날짜</label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
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

      {/* Delete Expense Confirmation */}
      <Modal open={!!deleteExpenseId} onClose={() => setDeleteExpenseId(null)} title="지출 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">이 지출 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteExpenseId(null)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
            >
              취소
            </button>
            <button
              onClick={() => deleteExpenseId && handleDeleteExpense(deleteExpenseId)}
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
