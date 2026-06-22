"use client";

import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import Link from "next/link";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-md w-full mx-4">
        <div className="text-center p-8 rounded-2xl border border-red-500/30 bg-red-500/5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <X size={32} className="text-red-500" />
          </div>
          <h1 className="mt-4 text-xl font-bold">결제 실패</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {message || "결제 처리 중 문제가 발생했습니다."}
          </p>
          {code && (
            <p className="mt-1 text-xs text-[var(--muted)]">오류 코드: {code}</p>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:opacity-90 transition-opacity"
            >
              다시 시도
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)] transition-colors"
            >
              대시보드로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
