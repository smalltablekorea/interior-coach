"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, Receipt, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fmt, fmtDate } from "@/lib/utils";

interface Expense {
  id: string;
  date: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  isDeductible: boolean;
  isVerified: boolean;
  siteId: string | null;
  siteName: string | null;
  vendorId: string | null;
  vendorName: string | null;
}

interface Site { id: string; name: string; }
interface Vendor { id: string; name: string; }

const CATEGORY_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: "material", label: "자재비", icon: "🧱" },
  { value: "subcontract", label: "외주인건비", icon: "👷" },
  { value: "salary", label: "직원인건비", icon: "💰" },
  { value: "vehicle", label: "차량유지비", icon: "🚗" },
  { value: "office", label: "사무실경비", icon: "🏢" },
  { value: "welfare", label: "접대/복리", icon: "🍽️" },
  { value: "transport", label: "이동/폐기물", icon: "🚛" },
  { value: "insurance", label: "보험/보증", icon: "🛡️" },
  { value: "other", label: "기타", icon: "📦" },
];

const METHOD_LABELS: Record<string, string> = { cash: "현금", card: "카드", transfer: "계좌이체", invoice: "세금계산서" };

export default function TaxExpensesPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDeductible, setFilterDeductible] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = { date: new Date().toISOString().slice(0, 10), category: "material", subcategory: "", description: "", supplyAmount: "", vatAmount: "", siteId: "", vendorId: "", paymentMethod: "", isDeductible: true, memo: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => {
    Promise.all([
      fetch("/api/tax?type=expenses").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/tax?type=vendors").then((r) => r.json()),
    ]).then(([exp, s, v]) => {
      setRows(exp);
      setSites(s);
      setVendors(v);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.description?.toLowerCase().includes(q) && !r.siteName?.toLowerCase().includes(q) && !r.vendorName?.toLowerCase().includes(q)) return false;
      }
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterDeductible === "yes" && !r.isDeductible) return false;
      if (filterDeductible === "no" && r.isDeductible) return false;
      return true;
    });
  }, [rows, search, filterCategory, filterDeductible]);

  const totalFiltered = useMemo(() => filtered.reduce((s, r) => s + r.totalAmount, 0), [filtered]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (r: Expense) => {
    setEditId(r.id);
    setForm({
      date: r.date, category: r.category, subcategory: r.subcategory || "", description: r.description || "",
      supplyAmount: String(r.supplyAmount), vatAmount: String(r.vatAmount || 0), siteId: r.siteId || "",
      vendorId: r.vendorId || "", paymentMethod: r.paymentMethod || "", isDeductible: r.isDeductible, memo: "",
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
    const res = await fetch(`/api/tax?type=expenses`, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tax?type=expenses&id=${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  };

  const catInfo = (cat: string) => CATEGORY_OPTIONS.find((c) => c.value === cat);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tax" className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold">매입/경비 관리</h1>
          {!loading && <span className="px-2.5 py-1 rounded-lg bg-[var(--red)]/10 text-[var(--red)] text-xs font-medium">{filtered.length}건</span>}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm">
          <Plus size={18} /> 경비 등록
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <Search size={18} className="text-[var(--muted)]" />
        <input type="text" placeholder="설명, 현장명, 거래처 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]" />
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none">
          <option value="">카테고리 전체</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <select value={filterDeductible} onChange={(e) => setFilterDeductible(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none">
          <option value="">공제 전체</option>
          <option value="yes">공제 가능</option>
          <option value="no">불공제</option>
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
        <EmptyState icon={Receipt} title="경비 내역이 없습니다" action={<button onClick={openAdd} className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium">첫 경비 등록하기</button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const ci = catInfo(r.category);
            return (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{ci?.icon || "📦"}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium">{r.description || ci?.label || r.category}</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">{ci?.label}</span>
                      {r.paymentMethod && <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">{METHOD_LABELS[r.paymentMethod] || r.paymentMethod}</span>}
                      {!r.isDeductible && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--red)]/10 text-[var(--red)]">불공제</span>}
                      {r.isDeductible && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--green)]/10 text-[var(--green)]">공제</span>}
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {fmtDate(r.date)}{r.siteName && ` · ${r.siteName}`}{r.vendorName && ` · ${r.vendorName}`}
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
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "경비 수정" : "경비 등록"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">날짜 *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">카테고리 *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none">
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">설명</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="경비 내용" />
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
              <label className="block text-sm text-[var(--muted)] mb-1">거래처</label>
              <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none">
                <option value="">선택</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">결제수단</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none">
                <option value="">선택</option>
                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input type="checkbox" id="isDeductible" checked={form.isDeductible} onChange={(e) => setForm({ ...form, isDeductible: e.target.checked })} className="rounded" />
              <label htmlFor="isDeductible" className="text-sm">매입세액공제 가능</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="경비 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">이 경비를 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button onClick={() => deleteId && handleDelete(deleteId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white font-medium text-sm"><Trash2 size={16} /> 삭제</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
