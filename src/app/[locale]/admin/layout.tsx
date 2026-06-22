"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Clock,
  Sparkles,
  Mail,
  Megaphone,
  Send,
} from "lucide-react";

const NAV: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { href: "/admin", label: "홈", icon: LayoutDashboard },
  { href: "/admin/users", label: "사용자", icon: Users },
  { href: "/admin/activity", label: "활동 통계", icon: Activity },
  { href: "/admin/crons", label: "Cron 실행", icon: Clock },
  { href: "/admin/ai-usage", label: "AI 사용량", icon: Sparkles },
  { href: "/admin/demo-requests", label: "데모 신청", icon: Mail },
  { href: "/admin/broadcast", label: "공지 발송", icon: Send },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
      <aside className="w-52 shrink-0 border-r border-[var(--border)] py-6 px-3 hidden md:flex flex-col gap-1">
        <div className="px-3 mb-4">
          <div className="text-xs text-[var(--muted)] mb-1">인테리어코치</div>
          <div className="font-bold text-lg flex items-center gap-1.5">
            <Megaphone size={16} className="text-[var(--green)]" />
            어드민
          </div>
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-[var(--green)]/10 text-[var(--green)] font-medium"
                  : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-auto px-3 pt-4 text-[10px] text-[var(--muted)]/60 leading-relaxed">
          어드민 전용 페이지.
          <br />
          접근은 SYSTEM_ADMIN_EMAILS 화이트리스트 + role=admin.
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
