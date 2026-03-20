"use client";

import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

const PLAN_STYLES: Record<PlanId, string> = {
  free: "bg-white/[0.06] text-[var(--muted)]",
  starter: "bg-blue-500/10 text-blue-400",
  pro: "bg-[var(--green)]/10 text-[var(--green)]",
  enterprise: "bg-yellow-500/10 text-yellow-400",
};

interface PlanBadgeProps {
  plan: PlanId;
  size?: "sm" | "md";
}

export default function PlanBadge({ plan, size = "sm" }: PlanBadgeProps) {
  const config = PLANS[plan];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${PLAN_STYLES[plan]}`}>
      {config.name}
    </span>
  );
}
