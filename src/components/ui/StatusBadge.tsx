"use client";

import { STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || {
    bg: "bg-white/[0.06]",
    text: "text-[var(--muted)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        colors.bg,
        colors.text
      )}
    >
      {status}
    </span>
  );
}
