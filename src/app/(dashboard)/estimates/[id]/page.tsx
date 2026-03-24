"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Send, CheckCircle, Pencil, Save, X } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";

interface EstimateItem {
  id: string;
  category: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface EstimateDetail {
  id: string;
  version: number;
  totalAmount: number;
  status: string;
  siteName: string;
  siteId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  areaPyeong: number;
  profitRate: number;
  overheadRate: number;
  vatEnabled: boolean;
  items: EstimateItem[];
}

const fmtNum = (n: number) => n.toLocaleString("ko-KR");

export default function EstimateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const docRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<EstimateItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/estimates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEstimate(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const startEditing = () => {
    if (!estimate) return;
    setEditItems(estimate.items.map((item) => ({ ...item })));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const updateItem = (itemId: string, field: "quantity" | "unitPrice", value: string) => {
    setEditItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const numVal = parseFloat(value) || 0;
        const updated = { ...item, [field]: numVal };
        updated.amount = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const handleSave = async () => {
    if (!estimate) return;
    setSaving(true);
    try {
      await fetch(`/api/estimates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: editItems }),
      }).catch(() => {});
    } catch {
      // ignore 503
    }
    const newDirectCost = editItems.reduce((s, i) => s + i.amount, 0);
    const newOverhead = Math.round(newDirectCost * (estimate.overheadRate / 100));
    const newProfit = Math.round(newDirectCost * (estimate.profitRate / 100));
    const newSubtotal = newDirectCost + newOverhead + newProfit;
    const newVat = estimate.vatEnabled ? Math.round(newSubtotal * 0.1) : 0;
    const newTotal = newSubtotal + newVat;

    setEstimate({
      ...estimate,
      items: editItems,
      totalAmount: newTotal,
    });
    setIsEditing(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-[600px] rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">견적서를 찾을 수 없습니다.</p>
        <Link href="/estimates" className="text-[var(--green)] hover:underline text-sm mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // Use editItems when editing, otherwise use estimate.items
  const displayItems = isEditing ? editItems : estimate.items;

  // Group items by category
  const grouped: Record<string, EstimateItem[]> = {};
  displayItems.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const directCost = displayItems.reduce((s, i) => s + i.amount, 0);
  const overhead = Math.round(directCost * (estimate.overheadRate / 100));
  const profit = Math.round(directCost * (estimate.profitRate / 100));
  const subtotal = directCost + overhead + profit;
  const vat = estimate.vatEnabled ? Math.round(subtotal * 0.1) : 0;
  const grandTotal = subtotal + vat;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/estimates"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{estimate.siteName}</h1>
              <StatusBadge status={estimate.status} />
              <span className="text-xs text-[var(--muted)]">v{estimate.version}</span>
            </div>
            <p className="text-sm text-[var(--muted)]">{fmtDate(estimate.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              >
                <X size={16} />
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              >
                <Pencil size={16} />
                수정
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              >
                <Printer size={16} />
                인쇄
              </button>
              {estimate.status === "작성중" && (
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--blue)] text-white text-sm font-medium">
                  <Send size={16} />
                  발송
                </button>
              )}
              {estimate.status === "발송" && (
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium">
                  <CheckCircle size={16} />
                  승인 처리
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Document */}
      <div
        ref={docRef}
        className="bg-white text-gray-900 rounded-2xl overflow-hidden print:rounded-none"
        style={{ fontFamily: "'Pretendard Variable', -apple-system, 'Noto Sans KR', sans-serif" }}
      >
        <div className="p-10 max-w-[900px] mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-3xl font-extrabold tracking-[12px] text-gray-900">
              견 적 서
            </div>
            <div className="text-[10px] text-gray-400 mt-1 tracking-[2px]">ESTIMATE</div>
            <div className="w-16 h-0.5 bg-blue-600 mx-auto mt-3" />
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 border-2 border-gray-900 rounded-lg p-4 px-6 mb-7 flex justify-between items-center">
            <div>
              <div className="text-[10px] text-gray-500 font-semibold">
                견적 총액 (VAT {estimate.vatEnabled ? "포함" : "별도"})
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {estimate.areaPyeong}평 · 리모델링
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900">
              {fmtNum(grandTotal)}
              <span className="text-sm font-semibold ml-1">원</span>
            </div>
          </div>

          {/* Client & Company Info */}
          <div className="grid grid-cols-2 gap-4 mb-7">
            <div>
              <div className="text-[13px] font-bold text-gray-900 border-b-2 border-gray-900 pb-1.5 mb-3">
                발주자 정보
              </div>
              <table className="w-full text-[11px]">
                <tbody>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold w-[30%]">성명</td>
                    <td className="border border-gray-200 px-2 py-1.5">{estimate.customerName}</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">연락처</td>
                    <td className="border border-gray-200 px-2 py-1.5">{estimate.customerPhone}</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">현장주소</td>
                    <td className="border border-gray-200 px-2 py-1.5">{estimate.siteAddress}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="text-[13px] font-bold text-gray-900 border-b-2 border-gray-900 pb-1.5 mb-3">
                시공사 정보
              </div>
              <table className="w-full text-[11px]">
                <tbody>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold w-[30%]">상호</td>
                    <td className="border border-gray-200 px-2 py-1.5">인테리어코치</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">대표자</td>
                    <td className="border border-gray-200 px-2 py-1.5">-</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">사업자번호</td>
                    <td className="border border-gray-200 px-2 py-1.5">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-7">
            <div className="text-[13px] font-bold text-gray-900 border-b-2 border-gray-900 pb-1.5 mb-3">
              견적 명세
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[5%]">No.</th>
                  <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[30%]">항목명</th>
                  <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[10%]">단위</th>
                  <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[10%]">수량</th>
                  <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[18%]">단가</th>
                  <th className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-center w-[18%]">금액</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([category, categoryItems]) => {
                  const catTotal = categoryItems.reduce((s, i) => s + i.amount, 0);
                  return [
                    <tr key={`cat-${category}`} className="bg-blue-50 font-bold">
                      <td className="border border-gray-200 px-2 py-1.5 text-center" colSpan={5}>
                        {category}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right">
                        {fmtNum(catTotal)}
                      </td>
                    </tr>,
                    ...categoryItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="border border-gray-200 px-2 py-1.5 text-center">{idx + 1}</td>
                        <td className="border border-gray-200 px-2 py-1.5">{item.itemName}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center">{item.unit}</td>
                        <td className="border border-gray-200 px-2 py-1.5 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-yellow-50 border border-yellow-300 text-gray-900 text-right text-[11px] focus:outline-none"
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-yellow-50 border border-yellow-300 text-gray-900 text-right text-[11px] focus:outline-none"
                            />
                          ) : (
                            fmtNum(item.unitPrice)
                          )}
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(item.amount)}</td>
                      </tr>
                    )),
                  ];
                })}
              </tbody>
            </table>
          </div>

          {/* Cost Summary */}
          <div className="mb-7">
            <div className="text-[13px] font-bold text-gray-900 border-b-2 border-gray-900 pb-1.5 mb-3">
              금액 합산
            </div>
            <table className="w-full text-[11px] border-collapse">
              <tbody>
                <tr>
                  <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold w-[40%]">직접공사비</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(directCost)}원</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">
                    일반관리비 ({estimate.overheadRate}%)
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(overhead)}원</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">
                    이윤 ({estimate.profitRate}%)
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(profit)}원</td>
                </tr>
                <tr className="bg-green-50 font-bold">
                  <td className="bg-green-50 border border-gray-200 px-2 py-1.5 font-bold">소계</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right font-bold">{fmtNum(subtotal)}원</td>
                </tr>
                {estimate.vatEnabled && (
                  <tr>
                    <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold">부가세 (10%)</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtNum(vat)}원</td>
                  </tr>
                )}
                <tr className="bg-gray-900 text-white font-bold text-[13px]">
                  <td className="border border-gray-700 px-2 py-2 font-bold">총 공사비</td>
                  <td className="border border-gray-700 px-2 py-2 text-right font-bold text-[14px]">
                    {fmtNum(grandTotal)}원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature */}
          <div className="border-t-2 border-gray-900 pt-6 flex justify-between items-start">
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-2">발주자</div>
              <div className="border border-gray-300 rounded-md px-6 py-4 min-w-[200px] min-h-[60px]">
                <div className="text-[11px]">{estimate.customerName}</div>
                <div className="text-[9px] text-gray-400 mt-1">(인)</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-400 mb-1">작성일: {fmtDate(estimate.createdAt)}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-2">시공사</div>
              <div className="border border-gray-300 rounded-md px-6 py-4 min-w-[200px] min-h-[60px]">
                <div className="text-[11px]">인테리어코치</div>
                <div className="text-[9px] text-gray-400 mt-1">(인)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
