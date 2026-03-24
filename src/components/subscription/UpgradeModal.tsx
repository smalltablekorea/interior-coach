"use client";

import { Crown, Check, X } from "lucide-react";
import type { PlanId } from "@/lib/plans";
import { PLANS, formatPrice } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";

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
  const { plan: currentPlan, changePlan } = useSubscription();

  if (!open) return null;

  const targetPlan = PLANS[requiredPlan];

  const handleUpgrade = async () => {
    const ok = await changePlan(requiredPlan);
    if (ok) onClose();
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

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--border)]"
            >
              나중에
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 py-2.5 rounded-xl bg-[var(--green)] text-black font-semibold text-sm hover:opacity-90"
            >
              {targetPlan.nameKo}로 업그레이드
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
