"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Filter,
  Users,
  Layers,
  Zap,
  Target,
  Settings,
  FlaskConical,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/marketing", label: "개요", icon: LayoutDashboard, exact: true },
  { href: "/admin/marketing/funnel", label: "퍼널", icon: Filter },
  { href: "/admin/marketing/leads", label: "리드", icon: Users },
  { href: "/admin/marketing/segments", label: "세그먼트", icon: Layers },
  { href: "/admin/marketing/automations", label: "자동화", icon: Zap },
  { href: "/admin/marketing/campaigns", label: "캠페인", icon: Target },
  { href: "/admin/marketing/experiments", label: "실험", icon: FlaskConical },
  { href: "/admin/marketing/settings", label: "설정", icon: Settings },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">마케팅 센터</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            견적코치 퍼널 운영 & 전환 최적화
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
