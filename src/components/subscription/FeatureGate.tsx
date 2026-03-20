"use client";

import { useState } from "react";
import { Lock, Crown } from "lucide-react";
import type { FeatureKey } from "@/lib/plans";
import { PLANS, FEATURE_REQUIRED_PLAN } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "./UpgradeModal";

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  label?: string;
}

export default function FeatureGate({ feature, children, label }: FeatureGateProps) {
  const { checkFeature } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const check = checkFeature(feature);

  if (check.allowed) return <>{children}</>;

  const requiredPlan = FEATURE_REQUIRED_PLAN[feature];
  const planConfig = PLANS[requiredPlan];

  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-sm opacity-50 pointer-events-none select-none">
          {children}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3 p-8 max-w-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.06] flex items-center justify-center">
              <Lock size={24} className="text-[var(--muted)]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {label || `${planConfig.nameKo} 플랜 기능`}
              </h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                {check.reason}
              </p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Crown size={16} />
              {planConfig.nameKo}로 업그레이드
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan={requiredPlan}
        featureLabel={label}
      />
    </>
  );
}
