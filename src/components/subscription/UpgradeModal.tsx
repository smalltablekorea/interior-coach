"use client";

import { useState } from "react";
import { Crown, Check, X, CreditCard, Loader2, AlertCircle } from "lucide-react";
import type { PlanId } from "@/lib/plans";
import { PLANS, formatPrice } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";
import { generateCustomerKey } from "@/lib/toss-client";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  requiredPlan: PlanId;
  featureLabel?: string;
  currentUsage?: number;
  limit?: number;
}

export default function UpgradeModal({
  open,
  onClose,
  requiredPlan,
  featureLabel,
  currentUsage,
  limit,
}: UpgradeModalProps) {
  const { plan: currentPlan, hasCard, userId, changePlan } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const targetPlan = PLANS[requiredPlan];

  const handleCardRegister = async () => {
    if (!userId) {
      setError("로그인 정보를 확인할 수 없습니다");
      return;
    }
    // Save the pending plan so we can auto-complete after card registration
    sessionStorage.setItem("pendingPlanUpgrade", requiredPlan);
    sessionStorage.setItem("pendingBillingCycle", "monthly");

    try {
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        setError("결제 설정이 완료되지 않았습니다. 관리자에게 문의하세요.");
        return;
      }

      const tossPayments = await loadTossPayments(clientKey);
      const customerKey = generateCustomerKey(userId);
      const payment = tossPayments.payment({ customerKey });

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/payment/billing`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: undefined,
        customerName: undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "카드 등록 중 오류가 발생했습니다";
      setError(message);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError(null);

    // If no card registered, redirect to card registration first
    if (!hasCard) {
      await handleCardRegister();
      setUpgrading(false);
      return;
    }

    const result = await changePlan(requiredPlan);
    setUpgrading(false);

    if (result.success) {
      onClose();
      return;
    }

    if (result.needsCard) {
      // Card was removed or expired — redirect to card registration
      await handleCardRegister();
      return;
    }

    setError(result.error || "업그레이드에 실패했습니다");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-yellow-400" />
            <h2 className="text-lg font-semibold">업그레이드 필요</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Reason */}
          <div className="text-center space-y-2">
            {featureLabel && (
              <p className="text-sm text-[var(--muted)]">
                {currentUsage !== undefined && limit !== undefined
                  ? `${featureLabel} 한도(${limit}개)에 도달했습니다 (현재 ${currentUsage}개)`
                  : `${featureLabel} 기능은 ${targetPlan.nameKo} 플랜부터 사용 가능합니다`}
              </p>
            )}
          </div>

          {/* Target Plan Card */}
          <div className="p-4 rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{targetPlan.nameKo}</h3>
                <p className="text-xs text-[var(--muted)]">{targetPlan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--green)]">
                  {formatPrice(targetPlan.monthlyPrice)}
                </p>
                <p className="text-[10px] text-[var(--muted)]">/월</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {targetPlan.highlights.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-[var(--green)] shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card registration notice */}
          {!hasCard && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <CreditCard size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--muted)]">
                결제 수단이 등록되어 있지 않습니다. 업그레이드를 진행하면 카드 등록 화면으로 이동합니다.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)]"
              disabled={upgrading}
            >
              나중에
            </button>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="flex-1 py-2.5 rounded-xl bg-[var(--green)] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {upgrading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  처리 중...
                </>
              ) : !hasCard ? (
                <>
                  <CreditCard size={14} />
                  카드 등록 후 업그레이드
                </>
              ) : (
                `${targetPlan.nameKo}로 업그레이드`
              )}
            </button>
          </div>

          <p className="text-[10px] text-center text-[var(--muted)]">
            현재 플랜: {PLANS[currentPlan].nameKo} | 데모 모드에서는 즉시 적용됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
