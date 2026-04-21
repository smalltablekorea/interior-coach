"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import PlanBadge from "@/components/subscription/PlanBadge";
import { PLANS, formatPrice, formatLimit, type PlanId } from "@/lib/plans";
import { Crown, ExternalLink, Bell, ChevronRight, Users, Loader2, Check } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();
  const { plan, status, billingCycle, limits, usage, loading, changePlan } = useSubscription();
  const searchParams = useSearchParams();
  const [upgradeStatus, setUpgradeStatus] = useState<"idle" | "upgrading" | "success" | "error">("idle");
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const upgradeAttempted = useRef(false);
  const planConfig = PLANS[plan];

  // Auto-complete upgrade after card registration redirect
  useEffect(() => {
    if (loading || upgradeAttempted.current) return;
    const upgradePlan = searchParams.get("upgrade") as PlanId | null;
    if (!upgradePlan || !["starter", "pro"].includes(upgradePlan)) return;
    if (plan === upgradePlan) return; // Already on this plan

    upgradeAttempted.current = true;
    setUpgradeStatus("upgrading");

    const cycle = searchParams.get("billingCycle") || undefined;
    changePlan(upgradePlan, cycle).then((result) => {
      if (result.success) {
        setUpgradeStatus("success");
        // Clean up the URL params
        const url = new URL(window.location.href);
        url.searchParams.delete("upgrade");
        url.searchParams.delete("billingCycle");
        window.history.replaceState({}, "", url.toString());
      } else {
        setUpgradeStatus("error");
        setUpgradeError(result.error || "업그레이드에 실패했습니다");
      }
    });
  }, [loading, searchParams, plan, changePlan]);

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold">설정</h1>

      {/* Upgrade status banner */}
      {upgradeStatus === "upgrading" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/5">
          <Loader2 size={20} className="animate-spin text-[var(--green)]" />
          <p className="text-sm">플랜 업그레이드 진행 중...</p>
        </div>
      )}
      {upgradeStatus === "success" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/5">
          <Check size={20} className="text-[var(--green)]" />
          <p className="text-sm">플랜이 성공적으로 업그레이드 되었습니다!</p>
        </div>
      )}
      {upgradeStatus === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-400">업그레이드 실패: {upgradeError}</p>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold mb-4">계정 정보</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--muted)]">이름</span>
            <span className="text-sm">{user?.name || "-"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--muted)]">이메일</span>
            <span className="text-sm">{user?.email || "-"}</span>
          </div>
        </div>
      </div>

      {/* 요금제 섹션 */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">요금제</h2>
          <PlanBadge plan={plan} size="md" />
        </div>

        {!loading && (
          <div className="space-y-4">
            {/* Current Plan Info */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--muted)]">현재 플랜</span>
              <span className="text-sm font-medium">{planConfig.nameKo} ({formatPrice(planConfig.monthlyPrice)}/월)</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--muted)]">결제 주기</span>
              <span className="text-sm">{billingCycle === "yearly" ? "연간" : "월간"}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--muted)]">상태</span>
              <span className={`text-sm ${status === "active" || status === "trialing" ? "text-[var(--green)]" : "text-[var(--muted)]"}`}>
                {status === "active" ? "활성" : status === "trialing" ? "체험 중" : status === "canceled" ? "취소됨" : "만료됨"}
              </span>
            </div>

            {/* Usage */}
            <div className="pt-2">
              <p className="text-sm font-medium mb-3">사용량</p>
              <div className="space-y-2.5">
                <UsageBar label="현장" current={usage.sites || 0} limit={limits?.maxSites ?? 3} />
                <UsageBar label="고객" current={usage.customers || 0} limit={limits?.maxCustomers ?? 20} />
                <UsageBar label="AI 세무 상담 (이번 달)" current={usage.aiTaxAdvisor || 0} limit={limits?.maxAiTaxAdvisorPerMonth ?? 0} />
              </div>
            </div>

            {/* Upgrade CTA */}
            {plan !== "pro" && (
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--green)]/10 text-[var(--green)] text-sm font-medium hover:bg-[var(--green)]/20 transition-colors"
              >
                <Crown size={16} />
                요금제 변경
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 바로가기 */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-2">
        <h2 className="text-lg font-semibold mb-3">설정 메뉴</h2>
        <Link
          href="/settings/notifications"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          <Bell size={18} style={{ color: "var(--orange)" }} />
          <span className="flex-1 text-sm">알림 설정</span>
          <ChevronRight size={16} className="text-[var(--muted)]" />
        </Link>
        <Link
          href="/settings/workspace/members"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          <Users size={18} style={{ color: "var(--blue)" }} />
          <span className="flex-1 text-sm">멤버 관리</span>
          <ChevronRight size={16} className="text-[var(--muted)]" />
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold mb-2">앱 정보</h2>
        <p className="text-sm text-[var(--muted)]">인테리어코치 v0.1.0</p>
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isNearLimit = !isUnlimited && pct >= 80;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[var(--muted)]">{label}</span>
        <span className={isNearLimit ? "text-[var(--orange)]" : ""}>
          {current} / {formatLimit(limit)}
        </span>
      </div>
      {!isUnlimited && limit > 0 && (
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isNearLimit ? "bg-[var(--orange)]" : "bg-[var(--green)]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="h-1.5 rounded-full bg-[var(--green)]/20" />
      )}
    </div>
  );
}
