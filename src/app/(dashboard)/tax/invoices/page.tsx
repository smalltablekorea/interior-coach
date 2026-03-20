"use client";

import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";

export default function TaxInvoicesPage() {
  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <Link href="/tax" className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold">세금계산서</h1>
      </div>

      <EmptyState
        icon={FileText}
        title="세금계산서 관리"
        description="홈택스 연동 및 세금계산서 발행/수취 관리 기능이 준비 중입니다."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h3 className="font-semibold mb-2">매출 세금계산서</h3>
          <p className="text-sm text-[var(--muted)]">홈택스 API 연동을 통해 매출 세금계산서를 자동 발행하고 관리합니다.</p>
          <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            <p>- 거래처 선택 → 공급가액 입력 → 자동 발행</p>
            <p>- 현장관리 연동: 기성금 청구 시 자동 발행</p>
            <p>- 수정 세금계산서 발행</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h3 className="font-semibold mb-2">매입 세금계산서</h3>
          <p className="text-sm text-[var(--muted)]">홈택스에서 매입 세금계산서를 자동 수집하여 경비와 교차 검증합니다.</p>
          <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            <p>- 홈택스 자동 동기화 (매일 1회)</p>
            <p>- 미수집 세금계산서 알림</p>
            <p>- 매입처별 세금계산서 합계 조회</p>
          </div>
        </div>
      </div>
    </div>
  );
}
