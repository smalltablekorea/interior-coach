"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Filter, ArrowLeft, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { fmt, fmtDate } from "@/lib/utils";

interface Revenue {
  id: string;
  date: string;
  type: string;
  description: string | null;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  isCollected: boolean;
  collectedAt: string | null;
  memo: string | null;
  siteId: string | null;
  siteName: string | null;
  customerName: string | null;
}

interface Site { id: string; name: string; }

const TYPE_LABELS: Record<string, string> = {
  construction: "공사 매출", design: "설계/디자인", supervision: "감리", as: "A/S", other: "기타",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "현금", card: "카드", transfer: "계좌이체", invoice: "세금계산서",
};

export default function TaxRevenuePage() {
  const [rows, setRows] = useState<Revenue[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCollected, setFilterCollected] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = { date: new Date().toISOString().slice(0, 10), type: "construction", description: "", supplyAmount: "", vatAmount: "", siteId: "", paymentMethod: "", isCollected: false, memo: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => {
    Promise.all([
      fetch("/api/tax?type=revenue").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ]).then(([rev, s]) => {
      setRows(rev);
      setSites(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.description?.toLowerCase().includes(q) && !r.siteName?.toLowerCase().includes(q) && !r.customerName?.toLowerCase().includes(q)) return false;
      }
      if (filterType && r.type !== filterType) return false;
      if (filterCollected === "yes" && !r.isCollected) return false;
      if (filterCollected === "no" && r.isCollected) return false;
      return true;
    });
  }, [rows, search, filterType, filterCollected]);

  const totalFiltered = useMemo(() => filtered.reduce((s, r) => s + r.totalAmount, 0), [filtered]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (r: Revenue) => {
    setEditId(r.id);
    setForm({
      date: r.date, type: r.type, description: r.description || "", supplyAmount: String(r.supplyAmount),
      vatAmount: String(r.vatAmount || 0), siteId: r.siteId || "", paymentMethod: r.paymentMethod || "",
      isCollected: r.isCollected, memo: r.memo || "",
    });
    setShowModal(true);
  };

  const handleSupplyChange = (val: string) => {
    const supply = parseInt(val) || 0;
    setForm({ ...form, supplyAmount: val, vatAmount: String(Math.round(supply * 0.1)) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supply = parseInt(form.supplyAmount) || 0;
    const vat = parseInt(form.vatAmount) || 0;
    const payload = { ...form, supplyAmount: supply, vatAmount: vat, totalAmount: supply + vat, id: editId };
    const res = await fetch(`/api/tax?type=revenue`, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tax?type=revenue&id=${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  };

  const toggleCollected = async (r: Revenue) => {
    await fetch(`/api/tax?type=revenue`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, isCollected: !r.isCollected, collectedAt: !r.isCollected ? new Date().toISOString().slice(0, 10) : null }),
    });
    fetchData();
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tax" className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold">매출 관리</h1>
          {!loading && <span className="px-2.5 py-1 rounded-lg bg-[var(--green)]/10 text-[var(--green)] text-xs font-medium">{filtered.length}건</span>}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm">
          <Plus size={18} /> 매출 등록
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <Search size={18} className="text-[var(--muted)]" />
        <input type="text" placeholder="설명, 현장명, 고객명 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]" />
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none">
          <option value="">매출 유형 전체</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterCollected} onChange={(e) => setFilterCollected(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none">
          <option value="">수금 전체</option>
          <option value="yes">수금 완료</option>
          <option value="no">미수금</option>
        </select>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)]">
          <span className="text-sm text-[var(--muted)]">{filtered.length}건</span>
          <span className="text-sm font-medium">합계 {fmt(totalFiltered)}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl animate-shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="매출 내역이 없습니다" action={<button onClick={openAdd} className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium">첫 매출 등록하기</button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] group">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleCollected(r)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${r.isCollected ? "border-[var(--green)] bg-[var(--green)]" : "border-[var(--border)] hover:border-[var(--green)]"}`}>
                  {r.isCollected && <CheckCircle2 size={14} className="text-black" />}
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium">{r.description || TYPE_LABELS[r.type] || r.type}</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">{TYPE_LABELS[r.type]}</span>
                    {r.paymentMethod && <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">{METHOD_LABELS[r.paymentMethod] || r.paymentMethod}</span>}
                    {!r.isCollected && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--orange)]/10 text-[var(--orange)]">미수금</span>}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {fmtDate(r.date)}{r.siteName && ` · ${r.siteName}`}{r.customerName && ` · ${r.customerName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium tabular-nums">{fmt(r.totalAmount)}</p>
                  <p className="text-[10px] text-[var(--muted)]">공급가 {fmt(r.supplyAmount)} + VAT {fmt(r.vatAmount)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-[var(--red)]"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "매출 수정" : "매출 등록"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">날짜 *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">매출 유형</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">설명</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="매출 내용" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">공급가액 *</label>
              <input type="number" required value={form.supplyAmount} onChange={(e) => handleSupplyChange(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="원" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">부가세 (자동)</label>
              <input type="number" value={form.vatAmount} onChange={(e) => setForm({ ...form, vatAmount: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">현장</label>
              <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none">
                <option value="">선택</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">결제수단</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none">
                <option value="">선택</option>
                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isCollected" checked={form.isCollected} onChange={(e) => setForm({ ...form, isCollected: e.target.checked })} className="rounded" />
            <label htmlFor="isCollected" className="text-sm">수금 완료</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="매출 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">이 매출을 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button onClick={() => deleteId && handleDelete(deleteId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white font-medium text-sm"><Trash2 size={16} /> 삭제</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
