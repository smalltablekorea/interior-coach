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
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "대시보드" },
  { href: "/customers", icon: Users, label: "고객 관리" },
  { href: "/sites", icon: Building2, label: "현장 관리" },
  { href: "/estimates", icon: FileText, label: "견적 관리" },
  { href: "/contracts", icon: FileCheck, label: "계약 관리" },
  { href: "/construction", icon: Hammer, label: "시공 관리" },
  { href: "/schedule", icon: CalendarDays, label: "일정 관리" },
  { href: "/materials", icon: Package, label: "자재 관리" },
  { href: "/workers", icon: HardHat, label: "작업자 관리" },
  { href: "/expenses", icon: Receipt, label: "지출 관리" },
  { href: "/marketing", icon: Megaphone, label: "마케팅" },
  { href: "/settlement", icon: BarChart3, label: "정산 리포트" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen bg-[var(--sidebar)] border-r border-[var(--border)] z-40 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[var(--border)]">
          {!collapsed && (
            <span className="text-lg font-bold text-[var(--green)]">
              인테리어코치
            </span>
          )}
          {collapsed && (
            <span className="text-lg font-bold text-[var(--green)] mx-auto">IC</span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-[var(--green)]/10 text-[var(--green)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-[var(--border)]">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-all"
          >
            <Settings size={20} />
            {!collapsed && <span>설정</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-all"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span>접기</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--sidebar)] border-t border-[var(--border)] flex items-center justify-around z-40">
        {navItems.slice(0, 5).map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-[10px]",
                isActive ? "text-[var(--green)]" : "text-[var(--muted)]"
              )}
            >
              <item.icon size={20} />
              <span>{item.label.replace(" 관리", "")}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
