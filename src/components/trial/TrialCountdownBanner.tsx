"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Clock, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialCountdownBannerProps {
  daysLeft: number;
  urgency: "high" | "medium" | "low";
  message: string;
  ctaText: string;
  onDismiss?: () => void;
  className?: string;
}

export function TrialCountdownBanner({
  daysLeft,
  urgency,
  message,
  ctaText,
  onDismiss,
  className
}: TrialCountdownBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    window.open(`/pricing?utm_source=trial_banner&utm_medium=${urgency}&days_left=${daysLeft}`, '_self');
  };

  if (dismissed) return null;

  const urgencyStyles = {
    high: {
      container: "bg-gradient-to-r from-red-50 to-orange-50 border-red-200",
      icon: "text-red-500",
      text: "text-red-800",
      button: "bg-red-600 hover:bg-red-700 text-white",
      accent: "text-red-600",
      iconComponent: Zap,
    },
    medium: {
      container: "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200",
      icon: "text-amber-500",
      text: "text-amber-800",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
      accent: "text-amber-600",
      iconComponent: Clock,
    },
    low: {
      container: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
      icon: "text-blue-500",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      accent: "text-blue-600",
      iconComponent: Sparkles,
    },
  };

  const styles = urgencyStyles[urgency];
  const IconComponent = styles.iconComponent;

  return (
    <Alert className={cn(styles.container, "relative", className)}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3 flex-1">
          <div className={cn("flex-shrink-0 p-2 rounded-full bg-white/50", styles.icon)}>
            <IconComponent className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className={cn("font-semibold text-sm", styles.accent)}>
                무료체험 {daysLeft}일 남음
              </span>
              {urgency === "high" && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                  마지막 기회
                </span>
              )}
            </div>
            <AlertDescription className={cn("text-sm", styles.text)}>
              {message}
            </AlertDescription>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleUpgrade}
            size="sm"
            className={cn(styles.button, "shadow-md hover:shadow-lg transition-shadow")}
          >
            {ctaText}
          </Button>

          {onDismiss && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className={cn("text-gray-400 hover:text-gray-600", styles.text)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

// Hook for managing banner dismissal state
export function useTrialBannerDismissal() {
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("dismissed_trial_banners");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedBanners(new Set(parsed));
      } catch (e) {
        console.warn("Failed to parse dismissed trial banners:", e);
      }
    }
  }, []);

  const dismissBanner = (bannerKey: string) => {
    const newSet = new Set(dismissedBanners);
    newSet.add(bannerKey);
    setDismissedBanners(newSet);
    localStorage.setItem("dismissed_trial_banners", JSON.stringify([...newSet]));
  };

  const isDismissed = (bannerKey: string) => dismissedBanners.has(bannerKey);

  const clearDismissed = () => {
    setDismissedBanners(new Set());
    localStorage.removeItem("dismissed_trial_banners");
  };

  return {
    dismissBanner,
    isDismissed,
    clearDismissed,
  };
}