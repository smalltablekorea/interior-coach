"use client";

import { useState, useCallback } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface CardRegisterButtonProps {
  customerKey: string;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * 토스페이먼츠 빌링키 발급 (카드 등록) 버튼
 * 
 * 플로우:
 * 1. 버튼 클릭 → loadTossPayments() → payment.requestBillingAuth()
 * 2. 토스 카드 인증 페이지로 리다이렉트
 * 3. 성공 시 /payment/billing?authKey=xxx로 리다이렉트
 * 4. /payment/billing 페이지에서 POST /api/billing/billing-key 호출
 */
export function CardRegisterButton({
  customerKey,
  className = "",
  children,
  onError,
}: CardRegisterButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    setLoading(true);
    try {
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

      if (!clientKey) {
        onError?.("결제 설정이 완료되지 않았습니다. 관리자에게 문의하세요.");
        return;
      }

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey });

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/payment/billing`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: undefined,
        customerName: undefined,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "카드 등록 중 오류가 발생했습니다";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [customerKey, onError]);

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CreditCard size={16} />
      )}
      {children || (loading ? "처리 중..." : "카드 등록하기")}
    </button>
  );
}
