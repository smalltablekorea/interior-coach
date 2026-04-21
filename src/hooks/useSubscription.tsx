"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { PlanId, FeatureKey, FeatureLimits } from "@/lib/plans";
import { PLANS, isPlanAtLeast, FEATURE_REQUIRED_PLAN } from "@/lib/plans";

interface SubscriptionData {
  subscription: {
    plan: PlanId;
    status: string;
    billingCycle: string;
    trialEndsAt?: string | null;
    currentPeriodEnd?: string | null;
  };
  planConfig: { name: string; nameKo: string; monthlyPrice: number };
  usage: Record<string, number>;
  limits: FeatureLimits;
}

interface FeatureCheck {
  allowed: boolean;
  reason?: string;
  requiredPlan?: PlanId;
  current?: number;
  limit?: number;
}

interface SubscriptionContextType {
  plan: PlanId;
  status: string;
  billingCycle: string;
  planConfig: { name: string; nameKo: string; monthlyPrice: number } | null;
  limits: FeatureLimits | null;
  usage: Record<string, number>;
  loading: boolean;
  checkFeature: (key: FeatureKey) => FeatureCheck;
  changePlan: (newPlan: PlanId) => Promise<boolean>;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  plan: "free",
  status: "active",
  billingCycle: "monthly",
  planConfig: null,
  limits: null,
  usage: {},
  loading: true,
  checkFeature: () => ({ allowed: true }),
  changePlan: async () => false,
  refresh: () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(() => {
    fetch("/api/subscription")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((d) => {
        if (d?.subscription) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const plan = (data?.subscription?.plan || "free") as PlanId;
  const status = data?.subscription?.status || "active";
  const billingCycle = data?.subscription?.billingCycle || "monthly";

  const checkFeature = useCallback(
    (key: FeatureKey): FeatureCheck => {
      const requiredPlan = FEATURE_REQUIRED_PLAN[key];

      if (!isPlanAtLeast(plan, requiredPlan)) {
        return {
          allowed: false,
          reason: `${PLANS[requiredPlan].nameKo} 플랜 이상에서 사용 가능합니다`,
          requiredPlan,
        };
      }

      // Count-based limits
      const limitMap: Record<string, number> = {
        sites: data?.limits?.maxSites ?? 3,
        customers: data?.limits?.maxCustomers ?? 20,
        aiTaxAdvisor: data?.limits?.maxAiTaxAdvisorPerMonth ?? 0,
      };

      if (key in limitMap) {
        const limit = limitMap[key];
        if (limit === -1) return { allowed: true };
        const current = data?.usage?.[key] ?? 0;
        if (current >= limit) {
          return {
            allowed: false,
            reason: `${key === "sites" ? "현장" : key === "customers" ? "고객" : "AI 상담"} 등록 한도(${limit}개)에 도달했습니다`,
            requiredPlan: plan === "free" ? "starter" : "pro",
            current,
            limit,
          };
        }
        return { allowed: true, current, limit };
      }

      return { allowed: true };
    },
    [plan, data]
  );

  const changePlan = useCallback(async (newPlan: PlanId): Promise<boolean> => {
    try {
      // For paid plans, use billing/payment endpoint for actual payment
      if (newPlan !== "free") {
        const res = await fetch("/api/billing/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: newPlan, billingCycle }),
        });
        if (res.ok) {
          fetchSubscription();
          return true;
        }
        return false;
      }
      // Downgrade to free — just update subscription
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (res.ok) {
        fetchSubscription();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchSubscription, billingCycle]);

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        status,
        billingCycle,
        planConfig: data?.planConfig || null,
        limits: data?.limits || null,
        usage: data?.usage || {},
        loading,
        checkFeature,
        changePlan,
        refresh: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
