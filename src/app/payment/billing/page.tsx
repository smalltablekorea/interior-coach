"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import Link from "next/link";

type BillingResult =
  | { status: "loading" }
  | { status: "success"; card: { number: string; cardType: string } }
  | { status: "error"; message: string };

export default function BillingCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<BillingResult>({ status: "loading" });

  useEffect(() => {
    const authKey = searchParams.get("authKey");
    const customerKey = searchParams.get("customerKey");

    if (!authKey) {
      setResult({ status: "error", message: "인증 정보가 없습니다." });
      return;
    }

    // POST authKey to our billing-key API to issue billingKey
    fetch("/api/billing/billing-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authKey }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data?.billingKey) {
          setResult({
            status: "success",
            card: data.card || { number: "****", cardType: "카드" },
          });
          // Check if there's a pending plan upgrade
          const pendingPlan = sessionStorage.getItem("pendingPlanUpgrade");
          if (pendingPlan) {
            sessionStorage.removeItem("pendingPlanUpgrade");
            const pendingCycle = sessionStorage.getItem("pendingBillingCycle") || "monthly";
            sessionStorage.removeItem("pendingBillingCycle");
            // Redirect to complete the plan change
            setTimeout(() => {
              router.push(`/settings?upgrade=${pendingPlan}&billingCycle=${pendingCycle}`);
            }, 2000);
          }
        } else {
          setResult({
            status: "error",
            message: data?.error || "빌링키 발급에 실패했습니다.",
          });
        }
      })
      .catch(() => {
        setResult({ status: "error", message: "서버 통신 오류가 발생했습니다." });
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-md w-full mx-4">
        {result.status === "loading" && (
          <div className="text-center p-8">
            <Loader2 size={48} className="animate-spin mx-auto text-[var(--green)]" />
            <p className="mt-4 text-lg font-medium">카드 등록 처리 중...</p>
            <p className="mt-2 text-sm text-[var(--muted)]">잠시만 기다려주세요</p>
          </div>
        )}

        {result.status === "success" && (
          <div className="text-center p-8 rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/5">
            <div className="w-16 h-16 rounded-full bg-[var(--green)]/10 flex items-center justify-center mx-auto">
              <Check size={32} className="text-[var(--green)]" />
            </div>
            <h1 className="mt-4 text-xl font-bold">카드 등록 완료!</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {result.card.cardType} {result.card.number}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              이제 유료 플랜을 이용하실 수 있습니다
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <Link
                href="/settings"
                className="px-4 py-2 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:opacity-90 transition-opacity"
              >
                설정으로 이동
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)] transition-colors"
              >
                대시보드로 이동
              </Link>
            </div>
          </div>
        )}

        {result.status === "error" && (
          <div className="text-center p-8 rounded-2xl border border-red-500/30 bg-red-500/5">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <X size={32} className="text-red-500" />
            </div>
            <h1 className="mt-4 text-xl font-bold">카드 등록 실패</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">{result.message}</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)] transition-colors"
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
        )}
      </div>
    </div>
  );
}
