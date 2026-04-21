"use client";

import { Clock, Crown, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface TrialBannerProps {
  trialEndsAt: string | null | undefined;
  plan: string;
  status: string;
}

export default function TrialBanner({ trialEndsAt, plan, status }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (plan !== "free" && status !== "trialing") return null;

  // Calculate days remaining
  let daysLeft: number | null = null;
  let isTrialing = status === "trialing";

  if (trialEndsAt) {
    const now = new Date();
    const end = new Date(trialEndsAt);
    daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    isTrialing = true;
  }

  // Different banner styles based on urgency
  const isUrgent = daysLeft !== null && daysLeft <= 3;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  if (isExpired) {
    return (
      <div className="mx-4 mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Clock size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">무료 체험이 종료되었습니다</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">유료 플랜으로 업그레이드하여 모든 기능을 이용하세요</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
          >
            업그레이드
          </Link>
        </div>
      </div>
    );
  }

  if (isTrialing && daysLeft !== null) {
    return (
      <div className={`mx-4 mb-4 p-4 rounded-xl ${
        isUrgent 
          ? "bg-amber-500/10 border border-amber-500/20" 
          : "bg-[var(--green)]/5 border border-[var(--green)]/20"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isUrgent ? "bg-amber-500/20" : "bg-[var(--green)]/10"
            }`}>
              <Clock size={16} className={isUrgent ? "text-amber-400" : "text-[var(--green)]"} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isUrgent ? "text-amber-400" : "text-[var(--green)]"}`}>
                무료 체험 {daysLeft}일 남음
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {isUrgent 
                  ? "곧 체험이 종료됩니다. 지금 업그레이드하면 데이터가 유지됩니다."
                  : "Pro 플랜의 모든 기능을 체험 중입니다"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/pricing"
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90 ${
                isUrgent 
                  ? "bg-amber-500 text-black" 
                  : "bg-[var(--green)] text-black"
              }`}
            >
              <Crown size={12} className="inline mr-1" />
              업그레이드
            </Link>
            {!isUrgent && (
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Free plan, no trial — show upgrade nudge
  if (plan === "free") {
    return (
      <div className="mx-4 mb-4 p-3.5 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Crown size={16} className="text-[var(--green)]" />
            <span className="text-xs text-[var(--muted)]">
              무료 플랜 사용 중 · 유료 플랜으로 더 많은 기능을 사용해보세요
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/pricing"
              className="text-xs font-bold text-[var(--green)] hover:underline"
            >
              요금제 보기
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
