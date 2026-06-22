"use client";

import { Link } from "@/i18n/navigation";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "onboarding", label: "온보딩" },
  { key: "uploads", label: "주간 업로드" },
  { key: "jobs", label: "콘텐츠 잡" },
  { key: "reports", label: "리포트" },
] as const;

export default function AgencyClientDetailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/agency/clients"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← 클라이언트 목록
        </Link>
        <h1 className="text-2xl font-bold mt-2">클라이언트 #{clientId}</h1>
      </header>

      <nav className="flex gap-1 border-b border-[var(--border)]">
        {TABS.map((tab) => {
          const href = `/agency/clients/${clientId}/${tab.key}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "px-4 py-2 text-sm border-b-2 transition",
                active
                  ? "border-[var(--green)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
