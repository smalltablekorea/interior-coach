"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SharedItem {
  category: string;
  itemName: string;
  unit: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
}

interface SharedEstimate {
  siteName: string;
  siteAddress: string;
  customerName: string;
  totalAmount: number;
  profitRate: number;
  overheadRate: number;
  vatEnabled: boolean;
  createdAt: string;
  expiresAt: string;
  items: SharedItem[];
  companyInfo: { name?: string; phone?: string; address?: string } | null;
}

export default function SharedEstimatePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedEstimate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/estimates/shared/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error || d.success === false) setError(d.error || "견적을 불러올 수 없습니다");
        else setData(d);
      })
      .catch(() => setError("네트워크 오류가 발생했습니다"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">견적서를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">견적서를 찾을 수 없습니다</h1>
          <p className="text-gray-500">{error || "공유 링크가 만료되었거나 잘못되었습니다."}</p>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString("ko-KR");

  // 공종별 그룹화
  const grouped: Record<string, SharedItem[]> = {};
  for (const item of data.items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const directTotal = data.items.reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
          <h1 className="text-3xl font-bold text-center mb-2">견 적 서</h1>
          {data.companyInfo?.name && (
            <p className="text-center text-blue-100">{data.companyInfo.name}</p>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">현장명</span>
              <p className="font-medium">{data.siteName}</p>
            </div>
            <div>
              <span className="text-gray-500">고객명</span>
              <p className="font-medium">{data.customerName || "-"}</p>
            </div>
            {data.siteAddress && (
              <div className="col-span-2">
                <span className="text-gray-500">주소</span>
                <p className="font-medium">{data.siteAddress}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">작성일</span>
              <p className="font-medium">{new Date(data.createdAt).toLocaleDateString("ko-KR")}</p>
            </div>
            <div>
              <span className="text-gray-500 text-right block">총 금액</span>
              <p className="font-bold text-xl text-blue-600 text-right">{fmt(data.totalAmount)}원</p>
            </div>
          </div>
        </div>

        {/* 항목 테이블 */}
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 font-semibold">공종</th>
                <th className="text-left py-2 font-semibold">항목</th>
                <th className="text-center py-2 font-semibold">단위</th>
                <th className="text-right py-2 font-semibold">수량</th>
                <th className="text-right py-2 font-semibold">단가</th>
                <th className="text-right py-2 font-semibold">금액</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([cat, items]) => (
                items.map((item, i) => (
                  <tr key={`${cat}-${i}`} className="border-b border-gray-100">
                    {i === 0 && (
                      <td rowSpan={items.length} className="py-2 font-medium text-gray-700 align-top">
                        {cat}
                      </td>
                    )}
                    <td className="py-2">{item.itemName}</td>
                    <td className="py-2 text-center text-gray-500">{item.unit || "식"}</td>
                    <td className="py-2 text-right">{item.quantity ?? 1}</td>
                    <td className="py-2 text-right">{fmt(item.unitPrice ?? 0)}</td>
                    <td className="py-2 text-right font-medium">{fmt(item.amount ?? 0)}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>

          {/* 합계 */}
          <div className="mt-6 border-t-2 border-gray-300 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>공사비 합계</span>
              <span>{fmt(directTotal)}원</span>
            </div>
            {data.overheadRate > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>경비 ({data.overheadRate}%)</span>
                <span>{fmt(Math.round(directTotal * data.overheadRate / 100))}원</span>
              </div>
            )}
            {data.profitRate > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>이윤 ({data.profitRate}%)</span>
                <span>{fmt(Math.round(directTotal * data.profitRate / 100))}원</span>
              </div>
            )}
            {data.vatEnabled && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>부가세 (10%)</span>
                <span>{fmt(Math.round(data.totalAmount / 11))}원</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>총 합계</span>
              <span className="text-blue-600">{fmt(data.totalAmount)}원</span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
          본 견적서는 인테리어코치에서 생성되었습니다 · 유효기간: {new Date(data.expiresAt).toLocaleDateString("ko-KR")}까지
        </div>

        {/* 인쇄 버튼 */}
        <div className="p-4 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            인쇄하기
          </button>
        </div>
      </div>
    </div>
  );
}
