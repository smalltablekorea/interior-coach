"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, HardHat, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { fmt } from "@/lib/utils";

interface Payroll {
  id: string;
  siteId: string | null;
  siteName: string | null;
  workerName: string;
  workerType: string;
  payPeriod: string | null;
  workDays: number | null;
  grossAmount: number;
  incomeTax: number;
  localTax: number;
  nationalPension: number;
  healthInsurance: number;
  employmentInsurance: number;
  netAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  paymentMethod: string | null;
  memo: string | null;
}

interface Site { id: string; name: string; }

const TYPE_LABELS: Record<string, string> = {
  "일용직": "일용직", "프리랜서": "프리랜서", "정규직": "정규직",
};

const TYPE_COLORS: Record<string, string> = {
  "일용직": "var(--orange)", "프리랜서": "var(--blue)", "정규직": "var(--green)",
};

const METHOD_LABELS: Record<string, string> = { cash: "현금", card: "카드", transfer: "계좌이체" };

export default function TaxPayrollPage() {
  const [rows, setRows] = useState<Payroll[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPaid, setFilterPaid] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = {
    workerName: "", workerType: "일용직", siteId: "",
    payPeriod: new Date().toISOString().slice(0, 7), workDays: "",
    grossAmount: "", paymentMethod: "", memo: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Preview calculated taxes
  const taxPreview = useMemo(() => {
    const gross = parseInt(form.grossAmount) || 0;
    if (!gross) return null;
    let incomeTax = 0, localTax = 0, nationalPension = 0, healthInsurance = 0, employmentInsurance = 0;
    if (form.workerType === "일용직") {
      incomeTax = Math.round(gross * 0.027);
      localTax = Math.round(incomeTax * 0.1);
    } else if (form.workerType === "프리랜서") {
      incomeTax = Math.round(gross * 0.03);
      localTax = Math.round(gross * 0.003);
    } else if (form.workerType === "정규직") {
      incomeTax = Math.round(gross * 0.035);
      localTax = Math.round(incomeTax * 0.1);
      nationalPension = Math.round(gross * 0.045);
      healthInsurance = Math.round(gross * 0.03545);
      employmentInsurance = Math.round(gross * 0.009);
    }
    const totalDeductions = incomeTax + localTax + nationalPension + healthInsurance + employmentInsurance;
    return { incomeTax, localTax, nationalPension, healthInsurance, employmentInsurance, totalDeductions, netAmount: gross - totalDeductions };
  }, [form.grossAmount, form.workerType]);

  const fetchData = () => {
    Promise.all([
      fetch("/api/tax/payroll").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()).catch(() => []),
    ]).then(([p, s]) => {
      setRows(Array.isArray(p) ? p : []);
      setSites(Array.isArray(s) ? s : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.workerName.toLowerCase().includes(q) && !r.siteName?.toLowerCase().includes(q)) return false;
      }
      if (filterType && r.workerType !== filterType) return false;
      if (filterPaid === "yes" && !r.isPaid) return false;
      if (filterPaid === "no" && r.isPaid) return false;
      return true;
    });
  }, [rows, search, filterType, filterPaid]);

  const totalGross = useMemo(() => filtered.reduce((s, r) => s + r.grossAmount, 0), [filtered]);
  const totalNet = useMemo(() => filtered.reduce((s, r) => s + r.netAmount, 0), [filtered]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (r: Payroll) => {
    setEditId(r.id);
    setForm({
      workerName: r.workerName, workerType: r.workerType,
      siteId: r.siteId || "", payPeriod: r.payPeriod || "", workDays: String(r.workDays || ""),
      grossAmount: String(r.grossAmount), paymentMethod: r.paymentMethod || "", memo: r.memo || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const gross = parseInt(form.grossAmount) || 0;
    const taxes = taxPreview || { incomeTax: 0, localTax: 0, nationalPension: 0, healthInsurance: 0, employmentInsurance: 0, totalDeductions: 0, netAmount: gross };
    const payload = {
      ...form,
      grossAmount: gross,
      workDays: parseInt(form.workDays) || null,
      incomeTax: taxes.incomeTax,
      localTax: taxes.localTax,
      nationalPension: taxes.nationalPension,
      healthInsurance: taxes.healthInsurance,
      employmentInsurance: taxes.employmentInsurance,
      netAmount: taxes.netAmount,
      id: editId,
    };
    const res = await fetch("/api/tax/payroll", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tax/payroll?id=${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  };

  const togglePaid = async (r: Payroll) => {
    await fetch("/api/tax/payroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, isPaid: !r.isPaid }),
    });
    fetchData();
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tax" className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold">급여 관리</h1>
          {!loading && <span className="px-2.5 py-1 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-medium">{filtered.length}건</span>}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm">
          <Plus size={18} /> 급여 등록
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <Search size={18} className="text-[var(--muted)]" />
        <input type="text" placeholder="작업자명, 현장명 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]" />
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none">
          <option value="">작업자 유형 전체</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none">
          <option value="">지급 전체</option>
          <option value="yes">지급 완료</option>
          <option value="no">미지급</option>
        </select>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)]">
          <span className="text-sm text-[var(--muted)]">{filtered.length}건</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--muted)]">총급여 <span className="font-medium text-[var(--foreground)]">{fmt(totalGross)}</span></span>
            <span className="text-sm text-[var(--muted)]">실지급 <span className="font-medium text-[var(--green)]">{fmt(totalNet)}</span></span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl animate-shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={HardHat} title="급여 내역이 없습니다" action={<button onClick={openAdd} className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium">첫 급여 등록하기</button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] group">
              <div className="flex items-center gap-3">
                <button onClick={() => togglePaid(r)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${r.isPaid ? "border-[var(--green)] bg-[var(--green)]" : "border-[var(--border)] hover:border-[var(--green)]"}`}>
                  {r.isPaid && <CheckCircle2 size={14} className="text-black" />}
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium">{r.workerName}</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: `color-mix(in srgb, ${TYPE_COLORS[r.workerType] || "var(--muted)"} 15%, transparent)`, color: TYPE_COLORS[r.workerType] || "var(--muted)" }}>
                      {TYPE_LABELS[r.workerType] || r.workerType}
                    </span>
                    {!r.isPaid && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--orange)]/10 text-[var(--orange)]">미지급</span>}
                    {r.paymentMethod && <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">{METHOD_LABELS[r.paymentMethod] || r.paymentMethod}</span>}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {r.payPeriod && `${r.payPeriod}`}{r.workDays && ` · ${r.workDays}일`}{r.siteName && ` · ${r.siteName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium tabular-nums">{fmt(r.netAmount)}</p>
                  <p className="text-[10px] text-[var(--muted)]">
                    총 {fmt(r.grossAmount)} − 공제 {fmt(r.grossAmount - r.netAmount)}
                  </p>
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "급여 수정" : "급여 등록"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">작업자명 *</label>
              <input type="text" required value={form.workerName} onChange={(e) => setForm({ ...form, workerName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="이름" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">작업자 유형 *</label>
              <select value={form.workerType} onChange={(e) => setForm({ ...form, workerType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none">
                <option value="일용직">일용직</option>
                <option value="프리랜서">프리랜서</option>
                <option value="정규직">정규직</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">급여 기간</label>
              <input type="month" value={form.payPeriod} onChange={(e) => setForm({ ...form, payPeriod: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">근무일수</label>
              <input type="number" value={form.workDays} onChange={(e) => setForm({ ...form, workDays: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="일" />
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
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">총 급여 *</label>
            <input type="number" required value={form.grossAmount} onChange={(e) => setForm({ ...form, grossAmount: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="원" />
          </div>

          {/* Tax Preview */}
          {taxPreview && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)] space-y-1.5">
              <p className="text-xs font-medium text-[var(--muted)] mb-2">세금 자동 계산</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-[var(--muted)]">소득세</span>
                <span className="text-right tabular-nums">{fmt(taxPreview.incomeTax)}</span>
                <span className="text-[var(--muted)]">지방소득세</span>
                <span className="text-right tabular-nums">{fmt(taxPreview.localTax)}</span>
                {form.workerType === "정규직" && (
                  <>
                    <span className="text-[var(--muted)]">국민연금</span>
                    <span className="text-right tabular-nums">{fmt(taxPreview.nationalPension)}</span>
                    <span className="text-[var(--muted)]">건강보험</span>
                    <span className="text-right tabular-nums">{fmt(taxPreview.healthInsurance)}</span>
                    <span className="text-[var(--muted)]">고용보험</span>
                    <span className="text-right tabular-nums">{fmt(taxPreview.employmentInsurance)}</span>
                  </>
                )}
              </div>
              <div className="border-t border-[var(--border)] pt-1.5 mt-1.5 flex justify-between text-sm">
                <span className="text-[var(--muted)]">실지급액</span>
                <span className="font-medium text-[var(--green)]">{fmt(taxPreview.netAmount)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <input type="text" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="메모" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="급여 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">이 급여 내역을 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button onClick={() => deleteId && handleDelete(deleteId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white font-medium text-sm"><Trash2 size={16} /> 삭제</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
