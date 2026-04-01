"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  onClick?: () => void;
  href?: string;
  trend?: { direction: "up" | "down"; label: string };
  warning?: boolean;
  badge?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "var(--green)",
  onClick,
  href,
  trend,
  warning,
  badge,
}: KPICardProps) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend?.direction === "up" ? "var(--green)" : "var(--red)";

  const className = cn(
    "rounded-2xl border bg-[var(--card)] p-5 transition-all block",
    warning ? "border-[var(--red)]/40" : "border-[var(--border)] hover:border-[var(--border-hover)]",
    (onClick || href) && "cursor-pointer hover:bg-[var(--card-hover)]",
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        <CardInner
          title={title}
          value={value}
          subtitle={subtitle}
          Icon={Icon}
          color={color}
          badge={badge}
          trend={trend}
          TrendIcon={TrendIcon}
          trendColor={trendColor}
        />
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={className}>
      <CardInner
        title={title}
        value={value}
        subtitle={subtitle}
        Icon={Icon}
        color={color}
        badge={badge}
        trend={trend}
        TrendIcon={TrendIcon}
        trendColor={trendColor}
      />
    </div>
  );
}

function CardInner({
  title,
  value,
  subtitle,
  Icon,
  color,
  badge,
  trend,
  TrendIcon,
  trendColor,
}: {
  title: string;
  value: string;
  subtitle?: string;
  Icon: LucideIcon;
  color: string;
  badge?: string;
  trend?: { direction: "up" | "down"; label: string };
  TrendIcon: LucideIcon;
  trendColor: string;
}) {
  return (
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[var(--muted)]">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold">{value}</p>
            {badge && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <TrendIcon size={12} style={{ color: trendColor }} />
              <span className="text-[11px]" style={{ color: trendColor }}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
  );
}
