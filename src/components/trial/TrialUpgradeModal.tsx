"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, CreditCard, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface TrialUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "trial_expired" | "usage_limit" | "feature_locked" | "payment_overdue";
  currentPlan?: string;
  daysLeft?: number;
  usageCurrent?: number;
  usageLimit?: number;
  featureName?: string;
  className?: string;
}

export function TrialUpgradeModal({
  isOpen,
  onClose,
  reason,
  currentPlan = "free",
  daysLeft,
  usageCurrent,
  usageLimit,
  featureName,
  className
}: TrialUpgradeModalProps) {
  const handleUpgrade = (plan: "starter" | "pro") => {
    const utmParams = new URLSearchParams({
      utm_source: 'upgrade_modal',
      utm_medium: reason,
      utm_campaign: 'trial_conversion',
      plan: plan
    });

    window.open(`/pricing?${utmParams.toString()}`, '_self');
  };

  const getModalContent = () => {
    switch (reason) {
      case "trial_expired":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
          title: "무료체험이 종료되었습니다",
          description: "체험 기간이 만료되어 일부 기능이 제한됩니다. 구독하시면 모든 기능을 계속 이용하실 수 있어요.",
          urgency: "high" as const,
        };

      case "usage_limit":
        return {
          icon: <Sparkles className="h-8 w-8 text-blue-500" />,
          title: `${featureName} 한계에 도달했습니다`,
          description: `현재 ${usageCurrent}/${usageLimit}개를 사용 중입니다. 더 많은 ${featureName}를 관리하려면 상위 플랜으로 업그레이드하세요.`,
          urgency: "medium" as const,
        };

      case "feature_locked":
        return {
          icon: <CreditCard className="h-8 w-8 text-purple-500" />,
          title: `${featureName} 기능이 필요합니다`,
          description: "이 기능은 유료 플랜에서만 이용할 수 있습니다. 업그레이드하고 더 많은 기능을 활용해보세요.",
          urgency: "low" as const,
        };

      case "payment_overdue":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          title: "결제가 연체되었습니다",
          description: "결제를 완료하시면 즉시 모든 기능을 정상적으로 이용하실 수 있습니다.",
          urgency: "high" as const,
        };

      default:
        return {
          icon: <Sparkles className="h-8 w-8 text-blue-500" />,
          title: "플랜 업그레이드가 필요합니다",
          description: "더 많은 기능을 이용하려면 상위 플랜으로 업그레이드하세요.",
          urgency: "medium" as const,
        };
    }
  };

  const content = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl", className)}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {content.icon}
          </div>
          <DialogTitle className="text-center text-xl">{content.title}</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trial Status Info (if applicable) */}
          {daysLeft !== undefined && daysLeft >= 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-blue-800">
                  {daysLeft === 0 ? "체험 종료" : `체험 ${daysLeft}일 남음`}
                </span>
                {daysLeft <= 1 && (
                  <Badge variant="destructive" className="text-xs">
                    마지막 기회
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Starter Plan */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{PLANS.starter.nameKo}</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ₩{PLANS.starter.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/월</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {PLANS.starter.highlights.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade("starter")}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                스타터로 업그레이드
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="border border-purple-300 rounded-lg p-6 relative bg-purple-50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">
                  인기
                </Badge>
              </div>

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{PLANS.pro.nameKo}</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ₩{PLANS.pro.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/월</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {PLANS.pro.highlights.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade("pro")}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                프로로 업그레이드
              </Button>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              ✅ 업그레이드 혜택
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 모든 기존 데이터 보존 및 즉시 이용 가능</li>
              <li>• 무제한 현장 및 고객 관리</li>
              <li>• 고급 기능: 마케팅 자동화, 전자계약, 세무관리</li>
              <li>• 24/7 고객 지원</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              나중에 하기
            </Button>
            <Button
              onClick={() => window.open('/pricing', '_self')}
              className="flex-1 bg-gray-900 hover:bg-gray-800"
            >
              전체 요금제 보기
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing upgrade modal state
export function useTrialUpgradeModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    reason: TrialUpgradeModalProps["reason"];
    data: Partial<TrialUpgradeModalProps>;
  }>({
    isOpen: false,
    reason: "trial_expired",
    data: {},
  });

  const openModal = (reason: TrialUpgradeModalProps["reason"], data?: Partial<TrialUpgradeModalProps>) => {
    setModalState({
      isOpen: true,
      reason,
      data: data || {},
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    isOpen: modalState.isOpen,
    reason: modalState.reason,
    data: modalState.data,
    openModal,
    closeModal,
  };
}

import { useState } from "react";