"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

interface TrialStatus {
  isLoading: boolean;
  isTrialExpired: boolean;
  isReadOnly: boolean;
  canWrite: boolean;
  plan: string;
  daysLeft: number | null;
  trialEndsAt: string | null;
  usageCounts: {
    sites: number;
    customers: number;
    sitesLimit: number;
    customersLimit: number;
    sitesPercentage: number;
    customersPercentage: number;
  };
  error: string | null;
}

interface UpgradeModal {
  isOpen: boolean;
  reason: string;
  data: Record<string, any>;
}

export function useTrialStatus() {
  const { data: session } = useSession();
  const user = session?.user;
  const [status, setStatus] = useState<TrialStatus>({
    isLoading: true,
    isTrialExpired: false,
    isReadOnly: false,
    canWrite: true,
    plan: "free",
    daysLeft: null,
    trialEndsAt: null,
    usageCounts: {
      sites: 0,
      customers: 0,
      sitesLimit: 3,
      customersLimit: 20,
      sitesPercentage: 0,
      customersPercentage: 0,
    },
    error: null,
  });

  const [upgradeModal, setUpgradeModal] = useState<UpgradeModal>({
    isOpen: false,
    reason: "",
    data: {},
  });

  // Fetch trial status from API
  const fetchTrialStatus = useCallback(async () => {
    if (!user) return;

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch subscription info
      const subResponse = await fetch("/api/subscription");
      if (!subResponse.ok) throw new Error("Failed to fetch subscription");
      const subData = await subResponse.json();

      // Calculate trial status
      const now = new Date();
      let daysLeft = null;
      let isTrialExpired = false;

      if (subData.subscription?.trialEndsAt) {
        const trialEnd = new Date(subData.subscription.trialEndsAt);
        daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        isTrialExpired = daysLeft <= 0;
      }

      // Determine read-only status
      const isReadOnly = (subData.subscription?.plan === "free" && isTrialExpired) ||
                        (subData.subscription?.status === "past_due");

      // Calculate usage percentages
      const sitesPercentage = (subData.usage.sites / subData.limits.maxSites) * 100;
      const customersPercentage = (subData.usage.customers / subData.limits.maxCustomers) * 100;

      setStatus({
        isLoading: false,
        isTrialExpired,
        isReadOnly,
        canWrite: !isReadOnly,
        plan: subData.subscription?.plan || "free",
        daysLeft,
        trialEndsAt: subData.subscription?.trialEndsAt || null,
        usageCounts: {
          sites: subData.usage.sites,
          customers: subData.usage.customers,
          sitesLimit: subData.limits.maxSites,
          customersLimit: subData.limits.maxCustomers,
          sitesPercentage: subData.limits.maxSites === -1 ? 0 : sitesPercentage,
          customersPercentage: subData.limits.maxCustomers === -1 ? 0 : customersPercentage,
        },
        error: null,
      });

    } catch (error) {
      console.error("Failed to fetch trial status:", error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [user]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchTrialStatus();

    // Refresh every 5 minutes
    const interval = setInterval(fetchTrialStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrialStatus]);

  // Check if an action is allowed
  const checkActionAllowed = useCallback((
    action: "create" | "edit" | "delete" | "view",
    resourceType?: "sites" | "customers" | "estimates"
  ): {
    allowed: boolean;
    reason?: string;
    shouldShowUpgrade?: boolean;
  } => {
    if (status.isLoading) {
      return { allowed: false, reason: "loading" };
    }

    // View actions are always allowed
    if (action === "view") {
      return { allowed: true };
    }

    // Check read-only status
    if (status.isReadOnly) {
      return {
        allowed: false,
        reason: status.isTrialExpired ? "trial_expired" : "payment_overdue",
        shouldShowUpgrade: true,
      };
    }

    // Check usage limits for create actions
    if (action === "create" && resourceType) {
      if (resourceType === "sites" && status.usageCounts.sitesPercentage >= 100) {
        return {
          allowed: false,
          reason: "usage_limit_sites",
          shouldShowUpgrade: true,
        };
      }

      if (resourceType === "customers" && status.usageCounts.customersPercentage >= 100) {
        return {
          allowed: false,
          reason: "usage_limit_customers",
          shouldShowUpgrade: true,
        };
      }
    }

    return { allowed: true };
  }, [status]);

  // Handle blocked actions with upgrade modal
  const handleBlockedAction = useCallback((
    action: string,
    resourceType?: string,
    additionalData?: Record<string, any>
  ) => {
    const checkResult = checkActionAllowed(action as any, resourceType as any);

    if (!checkResult.allowed && checkResult.shouldShowUpgrade) {
      let reason = "trial_expired";
      let modalData = { ...additionalData };

      switch (checkResult.reason) {
        case "trial_expired":
          reason = "trial_expired";
          modalData = { ...modalData, daysLeft: status.daysLeft };
          break;
        case "payment_overdue":
          reason = "payment_overdue";
          break;
        case "usage_limit_sites":
          reason = "usage_limit";
          modalData = {
            ...modalData,
            featureName: "현장",
            usageCurrent: status.usageCounts.sites,
            usageLimit: status.usageCounts.sitesLimit,
          };
          break;
        case "usage_limit_customers":
          reason = "usage_limit";
          modalData = {
            ...modalData,
            featureName: "고객",
            usageCurrent: status.usageCounts.customers,
            usageLimit: status.usageCounts.customersLimit,
          };
          break;
      }

      setUpgradeModal({
        isOpen: true,
        reason,
        data: modalData,
      });

      return false; // Action was blocked
    }

    return checkResult.allowed;
  }, [checkActionAllowed, status]);

  // Get trial countdown info for UI
  const getCountdownInfo = useCallback(() => {
    if (!status.daysLeft || status.daysLeft <= 0 || status.isTrialExpired) {
      return null;
    }

    let urgency: "high" | "medium" | "low";
    if (status.daysLeft <= 1) urgency = "high";
    else if (status.daysLeft <= 3) urgency = "medium";
    else urgency = "low";

    return {
      daysLeft: status.daysLeft,
      urgency,
      message: status.daysLeft === 1
        ? "체험이 내일 종료됩니다! 지금 구독하고 모든 기능을 계속 이용하세요."
        : `체험이 ${status.daysLeft}일 후 종료됩니다. 지금 구독하여 데이터를 보존하세요.`,
      ctaText: status.daysLeft === 1 ? "지금 즉시 구독" : "구독하기",
    };
  }, [status]);

  // Get usage warning info
  const getUsageWarnings = useCallback(() => {
    const warnings = [];

    if (status.usageCounts.sitesPercentage >= 80) {
      warnings.push({
        type: "sites" as const,
        percentage: status.usageCounts.sitesPercentage,
        current: status.usageCounts.sites,
        limit: status.usageCounts.sitesLimit,
        message: `현장 ${status.usageCounts.sites}/${status.usageCounts.sitesLimit}개 사용 중`,
        urgent: status.usageCounts.sitesPercentage >= 100,
      });
    }

    if (status.usageCounts.customersPercentage >= 80) {
      warnings.push({
        type: "customers" as const,
        percentage: status.usageCounts.customersPercentage,
        current: status.usageCounts.customers,
        limit: status.usageCounts.customersLimit,
        message: `고객 ${status.usageCounts.customers}/${status.usageCounts.customersLimit}명 관리 중`,
        urgent: status.usageCounts.customersPercentage >= 100,
      });
    }

    return warnings;
  }, [status]);

  // Close upgrade modal
  const closeUpgradeModal = useCallback(() => {
    setUpgradeModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Navigate to pricing page
  const goToPricing = useCallback((utmCampaign?: string) => {
    const params = new URLSearchParams({
      utm_source: "trial_hook",
      utm_medium: "upgrade_action",
      ...(utmCampaign && { utm_campaign: utmCampaign }),
    });

    window.open(`/pricing?${params.toString()}`, '_self');
  }, []);

  return {
    // Status data
    ...status,

    // Helper methods
    checkActionAllowed,
    handleBlockedAction,
    getCountdownInfo,
    getUsageWarnings,

    // Actions
    refresh: fetchTrialStatus,
    goToPricing,

    // Upgrade modal state
    upgradeModal,
    closeUpgradeModal,
  };
}