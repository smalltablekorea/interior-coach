"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";
import { TRADES, ESTIMATE_STATUSES } from "@/lib/constants";
import Link from "next/link";

interface Estimate {
  id: string;
  version: number;
  totalAmount: number | null;
  status: string;
  siteName: string | null;
  siteId: string | null;
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
}

interface EstimateItem {
  category: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    siteId: "",
    profitRate: "10",
    overheadRate: "5",
    vatEnabled: true,
  });
  const [items, setItems] = useState<EstimateItem[]>([
    { category: "철거", itemName: "", unit: "식", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const fetchData = () => {
    Promise.all([
      fetch("/api/estimates").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ])
      .then(([estData, siteData]) => {
        setEstimates(estData);
        setSites(siteData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateItem = (idx: number, field: keyof EstimateItem, value: string | number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      newItems[idx].amount = Number(newItems[idx].quantity) * Number(newItems[idx].unitPrice);
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { category: "목공", itemName: "", unit: "식", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: form.siteId || null,
        totalAmount,
        profitRate: parseFloat(form.profitRate),
        overheadRate: parseFloat(form.overheadRate),
        vatEnabled: form.vatEnabled,
        items: items.filter((item) => item.itemName),
      }),
    });
    if (res.ok) {
      setShowModal(false);
      setItems([{ category: "철거", itemName: "", unit: "식", quantity: 1, unitPrice: 0, amount: 0 }]);
      fetchData();
    }
    setSaving(false);
  };

  const filtered = estimates.filter((e) => {
    const matchSearch = !search || e.siteName?.includes(search);
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">견적 관리</h1>
        <div className="flex gap-2">
          <Link
            href="/estimates/builder"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
          >
            <Plus size={18} />
            견적 제작
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] font-medium text-sm hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
          >
            <Plus size={18} />
            빠른 작성
          </button>
        </div>
      </div>

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
          <button
            onClick={() => setFilterStatus("")}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              !filterStatus
                ? "bg-[var(--green)]/10 text-[var(--green)]"
                : "bg-white/[0.04] text-[var(--muted)]"
            }`}
          >
            전체
          </button>
          {ESTIMATE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "bg-white/[0.04] text-[var(--muted)]"
              }`}
            >
              {s}
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
          icon={FileText}
          title={search || filterStatus ? "조건에 맞는 견적이 없습니다" : "작성된 견적이 없습니다"}
          description={!search && !filterStatus ? "견적서를 작성해보세요." : undefined}
          action={
            !search &&
            !filterStatus && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
              >
                첫 견적 작성하기
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/estimates/${e.id}`}
              className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{e.siteName || "현장 미지정"}</p>
                  <StatusBadge status={e.status} />
                  <span className="text-xs text-[var(--muted)]">v{e.version}</span>
                </div>
                <p className="text-sm text-[var(--muted)]">{fmtDate(e.createdAt)}</p>
              </div>
              <p className="text-lg font-bold">{fmt(e.totalAmount)}</p>
            </Link>
          ))}
        </div>
      )}

      {/* New Estimate Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="견적 작성"
        maxWidth="max-w-2xl"
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">이윤(%)</label>
                <input
                  type="number"
                  value={form.profitRate}
                  onChange={(e) => setForm({ ...form, profitRate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">경비(%)</label>
                <input
                  type="number"
                  value={form.overheadRate}
                  onChange={(e) => setForm({ ...form, overheadRate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[var(--muted)]">견적 항목</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-[var(--green)] hover:underline"
              >
                + 항목 추가
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-2 md:items-center border-b border-[var(--border)] pb-2 md:border-0 md:pb-0"
                >
                  <div className="flex gap-2 md:contents">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(idx, "category", e.target.value)}
                      className="flex-1 md:col-span-2 px-2 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-white text-sm focus:outline-none"
                    >
                      {TRADES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="항목명"
                      value={item.itemName}
                      onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                      className="flex-[2] md:col-span-3 px-2 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 items-center md:contents">
                    <input
                      type="number"
                      placeholder="수량"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                      className="flex-1 md:col-span-2 px-2 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-white text-sm focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="단가"
                      value={item.unitPrice || ""}
                      onChange={(e) => updateItem(idx, "unitPrice", parseInt(e.target.value) || 0)}
                      className="flex-[2] md:col-span-3 px-2 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-white text-sm focus:outline-none"
                    />
                    <div className="md:col-span-1 text-right text-sm text-[var(--muted)] min-w-[3rem]">
                      {item.amount > 0 ? (item.amount / 10000).toFixed(0) + "만" : "-"}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="md:col-span-1 text-[var(--red)] text-sm hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03]">
            <span className="text-sm text-[var(--muted)]">합계</span>
            <span className="text-lg font-bold">{fmt(totalAmount)}</span>
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
