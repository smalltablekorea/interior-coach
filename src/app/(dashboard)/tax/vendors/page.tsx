"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, Users, Star, StarOff, Building } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";

interface Vendor {
  id: string;
  name: string;
  businessNumber: string | null;
  representative: string | null;
  businessType: string | null;
  businessItem: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  bankName: string | null;
  bankAccount: string | null;
  isFavorite: boolean;
}

export default function TaxVendorsPage() {
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = { name: "", businessNumber: "", representative: "", businessType: "", businessItem: "", address: "", contactName: "", contactPhone: "", contactEmail: "", bankName: "", bankAccount: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => {
    fetch("/api/tax?type=vendors").then((r) => r.json()).then((d) => { setRows(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.businessNumber?.includes(q) || r.contactName?.toLowerCase().includes(q));
  }, [rows, search]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (v: Vendor) => {
    setEditId(v.id);
    setForm({
      name: v.name, businessNumber: v.businessNumber || "", representative: v.representative || "",
      businessType: v.businessType || "", businessItem: v.businessItem || "", address: v.address || "",
      contactName: v.contactName || "", contactPhone: v.contactPhone || "", contactEmail: v.contactEmail || "",
      bankName: v.bankName || "", bankAccount: v.bankAccount || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, id: editId };
    const res = await fetch(`/api/tax?type=vendors`, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tax?type=vendors&id=${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  };

  const formatBizNum = (n: string | null) => {
    if (!n || n.length !== 10) return n;
    return `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5)}`;
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tax" className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold">거래처 관리</h1>
          {!loading && <span className="px-2.5 py-1 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-medium">{filtered.length}개</span>}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm">
          <Plus size={18} /> 거래처 등록
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <Search size={18} className="text-[var(--muted)]" />
        <input type="text" placeholder="거래처명, 사업자번호, 담당자 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl animate-shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="거래처가 없습니다" action={<button onClick={openAdd} className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium">첫 거래처 등록하기</button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => (
            <div key={v.id} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center">
                    <Building size={20} className="text-[var(--blue)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold">{v.name}</p>
                      {v.businessNumber && <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">{formatBizNum(v.businessNumber)}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--muted)]">
                      {v.representative && <span>대표: {v.representative}</span>}
                      {v.businessType && <span>업태: {v.businessType}</span>}
                      {v.contactName && <span>담당: {v.contactName}</span>}
                      {v.contactPhone && <span>{v.contactPhone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(v.id)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-[var(--red)]"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "거래처 수정" : "거래처 등록"} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">거래처명 *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">사업자등록번호</label>
              <input type="text" value={form.businessNumber} onChange={(e) => setForm({ ...form, businessNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="0000000000" maxLength={10} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">대표자</label>
              <input type="text" value={form.representative} onChange={(e) => setForm({ ...form, representative: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">업태/종목</label>
              <div className="flex gap-2">
                <input type="text" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:outline-none" placeholder="업태" />
                <input type="text" value={form.businessItem} onChange={(e) => setForm({ ...form, businessItem: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:outline-none" placeholder="종목" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">주소</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">담당자</label>
              <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">연락처</label>
              <input type="text" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">이메일</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">은행명</label>
              <input type="text" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">계좌번호</label>
              <input type="text" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="거래처 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">이 거래처를 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button onClick={() => deleteId && handleDelete(deleteId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white font-medium text-sm"><Trash2 size={16} /> 삭제</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
