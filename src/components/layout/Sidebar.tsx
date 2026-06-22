"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "use-intl";
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
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAgencyOperator } from "@/lib/agency/operator";
import PlanBadge from "@/components/subscription/PlanBadge";
import type { FeatureKey } from "@/lib/plans";
import { checkPermission, pathToCategory, type WorkspaceRole } from "@/lib/workspace/permissions";
import { apiFetch } from "@/lib/api-client";

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  /** messages/{locale}.json 의 nav.* 키 — useTranslations("nav") 로 룩업 */
  labelKey: string;
  requiredFeature?: FeatureKey;
  badgeKey?: "agencyAlerts";
}

interface NavGroup {
  key: string;
  /** messages/{locale}.json 의 nav.groups.* 키 */
  labelKey: string;
  icon: typeof ClipboardList;
  defaultOpen: boolean;
  items: NavItem[];
  operatorOnly?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: "operations",
    labelKey: "groups.operations",
    icon: ClipboardList,
    defaultOpen: true,
    items: [
      { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
      { href: "/sites", icon: Building2, labelKey: "sites" },
      { href: "/schedule", icon: CalendarDays, labelKey: "schedule" },
      { href: "/construction", icon: Hammer, labelKey: "construction" },
      { href: "/daily-logs", icon: ClipboardList, labelKey: "dailyLogs" },
      { href: "/defects", icon: ShieldAlert, labelKey: "defects" },
      { href: "/materials", icon: Package, labelKey: "materials", requiredFeature: "materialsManagement" },
      { href: "/workers", icon: HardHat, labelKey: "workers", requiredFeature: "workersManagement" },
    ],
  },
  {
    key: "money",
    labelKey: "groups.money",
    icon: Wallet,
    defaultOpen: true,
    items: [
      { href: "/contracts", icon: FileCheck, labelKey: "contracts" },
      { href: "/expenses", icon: Receipt, labelKey: "expenses" },
      { href: "/settlement", icon: BarChart3, labelKey: "settlement" },
      { href: "/tax", icon: Calculator, labelKey: "tax" },
    ],
  },
  {
    key: "tools",
    labelKey: "groups.tools",
    icon: Wrench,
    defaultOpen: false,
    items: [
      { href: "/customers", icon: Users, labelKey: "customers" },
      { href: "/estimates", icon: FileText, labelKey: "estimates" },
      { href: "/estimates/coach", icon: Sparkles, labelKey: "estimatesCoach" },
      { href: "/specbook", icon: ClipboardList, labelKey: "specbook" },
      { href: "/marketing", icon: Megaphone, labelKey: "marketing", requiredFeature: "marketingAutomation" },
      { href: "/settings", icon: Settings, labelKey: "settings" },
    ],
  },
  {
    key: "agency",
    labelKey: "groups.agency",
    icon: Megaphone,
    defaultOpen: false,
    operatorOnly: true,
    items: [
      { href: "/agency", icon: LayoutDashboard, labelKey: "agencyDashboard" },
      { href: "/agency/clients", icon: Users, labelKey: "agencyClients" },
      { href: "/agency/jobs", icon: FileText, labelKey: "agencyJobs" },
      { href: "/agency/alerts", icon: BarChart3, labelKey: "agencyAlerts", badgeKey: "agencyAlerts" },
    ],
  },
];

const MOBILE_TABS = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/sites", icon: Building2, labelKey: "sitesShort" },
  { href: "/schedule", icon: CalendarDays, labelKey: "scheduleShort" },
  { href: "/_more", icon: MoreHorizontal, labelKey: "more" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [collapsed, setCollapsed] = useState(false);
  const { plan, checkFeature } = useSubscription();
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const myRole = (workspace?.myRole || "owner") as WorkspaceRole;
  const isOperator = isAgencyOperator(user?.email);
  const visibleGroups = NAV_GROUPS.filter((g) => !g.operatorOnly || isOperator);
  const [agencyAlertsCount, setAgencyAlertsCount] = useState<number>(0);

  useEffect(() => {
    if (!isOperator) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetch("/api/agency/alerts?unresolved=true&limit=1");
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setAgencyAlertsCount(j.unresolvedCount || 0);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [isOperator, pathname]);

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
    const badge = item.badgeKey === "agencyAlerts" ? agencyAlertsCount : 0;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all relative",
          active
            ? "bg-[var(--green)]/10 text-[var(--green)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]",
        )}
      >
        <item.icon size={18} />
        {!collapsed && (
          <span className="flex-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              {t(item.labelKey)}
              {badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
                  {badge}
                </span>
              )}
            </span>
            {isLocked && <Lock size={12} className="text-[var(--muted)]" />}
            {isReadOnly && !isLocked && <Eye size={12} className="text-[var(--muted)]" />}
          </span>
        )}
        {collapsed && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
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
          {visibleGroups.map((group) => {
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
                    aria-label={t(group.labelKey)}
                  >
                    <group.icon size={14} />
                    <span className="flex-1 text-left">{t(group.labelKey)}</span>
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
                  <span>{t(tab.labelKey)}</span>
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
                <span>{t(tab.labelKey)}</span>
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
              {visibleGroups.map((group) => (
                <div key={group.key} className="mb-4">
                  <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <group.icon size={12} /> {t(group.labelKey)}
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
                          <span className="truncate">{t(item.labelKey)}</span>
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
