"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  FileCheck,
  Hammer,
  Package,
  HardHat,
  Receipt,
  Megaphone,
  BarChart3,
  CalendarDays,
  Calculator,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  Crown,
  Sparkles,
  Eye,
  Wallet,
  MoreHorizontal,
  ClipboardList,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import PlanBadge from "@/components/subscription/PlanBadge";
import type { FeatureKey } from "@/lib/plans";
import { checkPermission, pathToCategory, type WorkspaceRole } from "@/lib/workspace/permissions";

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  requiredFeature?: FeatureKey;
}

interface NavGroup {
  key: string;
  label: string;
  icon: typeof ClipboardList;
  defaultOpen: boolean;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: "operations",
    label: "현장 운영",
    icon: ClipboardList,
    defaultOpen: true,
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
      { href: "/sites", icon: Building2, label: "현장 관리" },
      { href: "/schedule", icon: CalendarDays, label: "일정 관리" },
      { href: "/construction", icon: Hammer, label: "시공 관리" },
      { href: "/materials", icon: Package, label: "자재 관리", requiredFeature: "materialsManagement" },
      { href: "/workers", icon: HardHat, label: "작업자 관리", requiredFeature: "workersManagement" },
    ],
  },
  {
    key: "money",
    label: "돈 관리",
    icon: Wallet,
    defaultOpen: true,
    items: [
      { href: "/finance", icon: TrendingUp, label: "재무 대시보드" },
      { href: "/contracts", icon: FileCheck, label: "계약 관리" },
      { href: "/expenses", icon: Receipt, label: "지출 관리" },
      { href: "/settlement", icon: BarChart3, label: "정산 리포트" },
      { href: "/tax", icon: Calculator, label: "세무/회계" },
    ],
  },
  {
    key: "tools",
    label: "도구",
    icon: Wrench,
    defaultOpen: false,
    items: [
      { href: "/customers", icon: Users, label: "고객 관리" },
      { href: "/estimates", icon: FileText, label: "견적 관리" },
      { href: "/estimates/coach", icon: Sparkles, label: "견적코치 AI" },
      { href: "/marketing", icon: Megaphone, label: "마케팅", requiredFeature: "marketingAutomation" },
      { href: "/settings", icon: Settings, label: "설정" },
    ],
  },
];

const MOBILE_TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
  { href: "/sites", icon: Building2, label: "현장" },
  { href: "/schedule", icon: CalendarDays, label: "일정" },
  { href: "/_more", icon: MoreHorizontal, label: "더보기" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { plan, checkFeature } = useSubscription();
  const { workspace } = useWorkspace();
  const myRole = (workspace?.myRole || "owner") as WorkspaceRole;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.key, g.defaultOpen])),
  );
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const renderNavItem = (item: NavItem) => {
    const category = pathToCategory(item.href);
    const canRead = category ? checkPermission(myRole, category, "read") : true;
    const canWrite = category ? checkPermission(myRole, category, "write") : true;
    const isReadOnly = canRead && !canWrite;
    if (!canRead) return null;

    const active = isActive(item.href);
    const isLocked = item.requiredFeature ? !checkFeature(item.requiredFeature).allowed : false;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
          active
            ? "bg-[var(--green)]/10 text-[var(--green)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]",
        )}
      >
        <item.icon size={18} />
        {!collapsed && (
          <span className="flex-1 flex items-center justify-between">
            {item.label}
            {isLocked && <Lock size={12} className="text-[var(--muted)]" />}
            {isReadOnly && !isLocked && <Eye size={12} className="text-[var(--muted)]" />}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ═══ Desktop Sidebar ═══ */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen bg-[var(--sidebar)] border-r border-[var(--border)] z-40 transition-all duration-200",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {/* Logo — click to go home */}
        <a href="/" className="h-16 flex items-center px-4 border-b border-[var(--border)] gap-2 hover:bg-white/[0.03] transition-colors cursor-pointer">
          {!collapsed ? (
            <>
              <span className="text-lg font-bold text-[var(--green)] truncate">
                {workspace?.name || "인테리어코치"}
              </span>
              <PlanBadge plan={plan} />
            </>
          ) : (
            <span className="text-lg font-bold text-[var(--green)] mx-auto">
              {workspace?.name?.charAt(0) || "IC"}
            </span>
          )}
        </a>

        {/* Grouped Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
          {NAV_GROUPS.map((group) => {
            const isOpen = openGroups[group.key];
            const hasActiveChild = group.items.some((item) => isActive(item.href));

            return (
              <div key={group.key}>
                {/* Group Header */}
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                      hasActiveChild ? "text-[var(--foreground)]" : "text-[var(--muted)]",
                      "hover:text-[var(--foreground)]",
                    )}
                    aria-expanded={isOpen}
                    aria-label={`${group.label} 그룹 ${isOpen ? "접기" : "펼치기"}`}
                  >
                    <group.icon size={14} />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      size={12}
                      className={cn("transition-transform", isOpen ? "" : "-rotate-90")}
                    />
                  </button>
                ) : (
                  <div className="h-px bg-[var(--border)] my-2 mx-2" />
                )}

                {/* Group Items */}
                {(collapsed || isOpen) && (
                  <div className={cn("space-y-0.5", !collapsed && "ml-1")}>
                    {group.items.map(renderNavItem)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-[var(--border)] space-y-1">
          {(plan === "free" || plan === "starter") && !collapsed && (
            <Link
              href="/pricing"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-[var(--green)]/10 text-[var(--green)] hover:bg-[var(--green)]/20 transition-all"
            >
              <Crown size={20} />
              <span>업그레이드</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span>접기</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--sidebar)] border-t border-[var(--border)] z-40 safe-area-inset-bottom">
        <div className="h-16 flex items-center justify-around">
          {MOBILE_TABS.map((tab) => {
            if (tab.href === "/_more") {
              return (
                <button
                  key="more"
                  onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 text-[10px]",
                    mobileMoreOpen ? "text-[var(--green)]" : "text-[var(--muted)]",
                  )}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            }
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-0.5 text-[10px]",
                  active ? "text-[var(--green)]" : "text-[var(--muted)]",
                )}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* More Menu Drawer */}
        {mobileMoreOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setMobileMoreOpen(false)}
            />
            <div className="absolute bottom-16 left-0 right-0 z-40 bg-[var(--sidebar)] border-t border-[var(--border)] rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto animate-fade-up">
              <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />
              {NAV_GROUPS.map((group) => (
                <div key={group.key} className="mb-4">
                  <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <group.icon size={12} /> {group.label}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {group.items.map((item) => {
                      const category = pathToCategory(item.href);
                      const canRead = category ? checkPermission(myRole, category, "read") : true;
                      if (!canRead) return null;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMoreOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] transition-colors",
                            active ? "bg-[var(--green)]/10 text-[var(--green)]" : "text-[var(--muted)] hover:text-[var(--foreground)]",
                          )}
                        >
                          <item.icon size={18} />
                          <span className="truncate">{item.label.replace(" 관리", "").replace("코치 ", "")}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </nav>
    </>
  );
}
