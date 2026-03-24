"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Eye } from "lucide-react";
import { TRADES } from "@/lib/constants";
import { fmt } from "@/lib/utils";

interface Site {
  id: string;
  name: string;
  customerName: string;
  areaPyeong: number;
  address: string;
}

interface EstimateItem {
  category: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const fmtNum = (n: number) => n.toLocaleString("ko-KR");

export default function NewEstimatePage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    siteId: "",
    profitRate: "10",
    overheadRate: "5",
    vatEnabled: true,
  });

  const [items, setItems] = useState<EstimateItem[]>([
    { category: "철거", itemName: "", unit: "식", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then(setSites)
      .catch(() => {});
  }, []);

  const selectedSite = sites.find((s) => s.id === form.siteId);

  const updateItem = (idx: number, field: keyof EstimateItem, value: string | number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      newItems[idx].amount = Number(newItems[idx].quantity) * Number(newItems[idx].unitPrice);
    }
    setItems(newItems);
  };

  const addItem = (category?: string) => {
    setItems([
      ...items,
      { category: category || "목공", itemName: "", unit: "식", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const directCost = items.reduce((sum, item) => sum + item.amount, 0);
  const overhead = Math.round(directCost * (parseFloat(form.overheadRate) || 0) / 100);
  const profit = Math.round(directCost * (parseFloat(form.profitRate) || 0) / 100);
  const subtotal = directCost + overhead + profit;
  const vat = form.vatEnabled ? Math.round(subtotal * 0.1) : 0;
  const grandTotal = subtotal + vat;

  // Group items by category
  const grouped: Record<string, { items: EstimateItem[]; total: number }> = {};
  items.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = { items: [], total: 0 };
    grouped[item.category].items.push(item);
    grouped[item.category].total += item.amount;
  });

  const handleSubmit = async () => {
    setSaving(true);
    const res = await fetch("/api/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: form.siteId || null,
        totalAmount: grandTotal,
        profitRate: parseFloat(form.profitRate),
        overheadRate: parseFloat(form.overheadRate),
        vatEnabled: form.vatEnabled,
        items: items.filter((item) => item.itemName),
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/estimates");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/estimates"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold">견적서 제작</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
          >
            <Eye size={16} />
            {showPreview ? "편집" : "미리보기"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div
          className="bg-white text-gray-900 rounded-2xl overflow-hidden"
          style={{ fontFamily: "'Pretendard Variable', -apple-system, 'Noto Sans KR', sans-serif" }}
        >
          <div className="p-10 max-w-[900px] mx-auto">
            <div className="text-center mb-8">
              <div className="text-3xl font-extrabold tracking-[12px] text-gray-900">견 적 서</div>
              <div className="text-[10px] text-gray-400 mt-1 tracking-[2px]">ESTIMATE</div>
              <div className="w-16 h-0.5 bg-blue-600 mx-auto mt-3" />
            </div>

            <div className="bg-gray-50 border-2 border-gray-900 rounded-lg p-4 px-6 mb-7 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-gray-500 font-semibold">
                  견적 총액 (VAT {form.vatEnabled ? "포함" : "별도"})
                </div>
                {selectedSite && (
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {selectedSite.areaPyeong}평 · {selectedSite.name}
                  </div>
                )}
              </div>
              <div className="text-2xl font-extrabold text-gray-900">
                {fmtNum(grandTotal)}<span className="text-sm font-semibold ml-1">원</span>
              </div>
            </div>

            {selectedSite && (
              <div className="grid grid-cols-2 gap-4 mb-7">
                <div>
                  <div className="text-[13px] font-bold border-b-2 border-gray-900 pb-1.5 mb-3">발주자 정보</div>
                  <table className="w-full text-[11px]">
                    <tbody>
                      <tr>
                        <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold w-[30%]">성명</td>
                        <td className="border border-gray-200 px-2 py-1.5">{selectedSite.customerName}</td>
                      </tr>
                      <tr>
                        <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">현장주소</td>
                        <td className="border border-gray-200 px-2 py-1.5">{selectedSite.address}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <div className="text-[13px] font-bold border-b-2 border-gray-900 pb-1.5 mb-3">시공사 정보</div>
                  <table className="w-full text-[11px]">
                    <tbody>
                      <tr>
                        <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold w-[30%]">상호</td>
                        <td className="border border-gray-200 px-2 py-1.5">인테리어코치</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mb-7">
              <div className="text-[13px] font-bold border-b-2 border-gray-900 pb-1.5 mb-3">견적 명세</div>
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr>
                    <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[5%]">No.</th>
                    <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center">항목명</th>
                    <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[10%]">단위</th>
                    <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[10%]">수량</th>
                    <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[16%]">단가</th>
                    <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[16%]">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([cat, data]) => [
                    <tr key={`cat-${cat}`} className="bg-blue-50 font-bold">
                      <td className="border border-gray-200 px-2 py-1.5 text-center" colSpan={5}>{cat}</td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(data.total)}</td>
                    </tr>,
                    ...data.items.filter((i) => i.itemName).map((item, idx) => (
                      <tr key={`${cat}-${idx}`}>
                        <td className="border border-gray-200 px-2 py-1.5 text-center">{idx + 1}</td>
                        <td className="border border-gray-200 px-2 py-1.5">{item.itemName}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center">{item.unit}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-right">{item.quantity}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(item.unitPrice)}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(item.amount)}</td>
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-[13px] font-bold border-b-2 border-gray-900 pb-1.5 mb-3">금액 합산</div>
              <table className="w-full text-[11px] border-collapse">
                <tbody>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold w-[40%]">직접공사비</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(directCost)}원</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">일반관리비 ({form.overheadRate}%)</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(overhead)}원</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">이윤 ({form.profitRate}%)</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(profit)}원</td>
                  </tr>
                  <tr className="bg-green-50 font-bold">
                    <td className="border border-gray-200 px-2 py-1.5">소계</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(subtotal)}원</td>
                  </tr>
                  {form.vatEnabled && (
                    <tr>
                      <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">부가세 (10%)</td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(vat)}원</td>
                    </tr>
                  )}
                  <tr className="bg-gray-900 text-white font-bold text-[13px]">
                    <td className="border border-gray-700 px-2 py-2">총 공사비</td>
                    <td className="border border-gray-700 px-2 py-2 text-right text-[14px]">{fmtNum(grandTotal)}원</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-4">
          {/* Site & Rate Settings */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-[var(--muted)] mb-1">현장</label>
                <select
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none text-sm"
                >
                  <option value="">현장 선택</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">이윤 (%)</label>
                <input
                  type="number"
                  value={form.profitRate}
                  onChange={(e) => setForm({ ...form, profitRate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">경비 (%)</label>
                <input
                  type="number"
                  value={form.overheadRate}
                  onChange={(e) => setForm({ ...form, overheadRate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-[var(--muted)]">
              <input
                type="checkbox"
                checked={form.vatEnabled}
                onChange={(e) => setForm({ ...form, vatEnabled: e.target.checked })}
                className="accent-[var(--green)]"
              />
              부가세 포함
            </label>
          </div>

          {/* Items by Category */}
          {Object.entries(grouped).map(([category, data]) => (
            <div key={category} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{category}</h3>
                  <span className="text-sm text-[var(--muted)]">{fmt(data.total)}</span>
                </div>
                <button
                  onClick={() => addItem(category)}
                  className="text-sm text-[var(--green)] hover:underline"
                >
                  + 항목 추가
                </button>
              </div>
              <div className="space-y-2">
                {data.items.map((item) => {
                  const globalIdx = items.indexOf(item);
                  return (
                    <div key={globalIdx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="항목명"
                        value={item.itemName}
                        onChange={(e) => updateItem(globalIdx, "itemName", e.target.value)}
                        className="col-span-4 px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="단위"
                        value={item.unit}
                        onChange={(e) => updateItem(globalIdx, "unit", e.target.value)}
                        className="col-span-1 px-2 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm text-center focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="수량"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(globalIdx, "quantity", parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="단가"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(globalIdx, "unitPrice", parseInt(e.target.value) || 0)}
                        className="col-span-3 px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none"
                      />
                      <div className="col-span-1 flex items-center justify-between">
                        <span className="text-xs text-[var(--muted)]">
                          {item.amount > 0 ? (item.amount / 10000).toFixed(0) + "만" : "-"}
                        </span>
                        <button
                          onClick={() => removeItem(globalIdx)}
                          className="text-[var(--red)] hover:bg-[var(--red)]/10 rounded-lg p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add Category */}
          <div className="flex flex-wrap gap-2">
            {TRADES.filter((t) => !grouped[t]).map((trade) => (
              <button
                key={trade}
                onClick={() => addItem(trade)}
                className="px-3 py-2 rounded-xl text-xs bg-white/[0.04] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              >
                + {trade}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] mb-3">금액 합산</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-[var(--muted)]">직접공사비</span>
                <span>{fmt(directCost)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--muted)]">일반관리비 ({form.overheadRate}%)</span>
                <span>{fmt(overhead)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--muted)]">이윤 ({form.profitRate}%)</span>
                <span>{fmt(profit)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-[var(--border)]">
                <span className="text-[var(--muted)]">소계</span>
                <span className="font-medium">{fmt(subtotal)}</span>
              </div>
              {form.vatEnabled && (
                <div className="flex justify-between py-1">
                  <span className="text-[var(--muted)]">부가세 (10%)</span>
                  <span>{fmt(vat)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-[var(--border)]">
                <span className="font-bold text-base">총 공사비</span>
                <span className="font-bold text-lg text-[var(--green)]">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
