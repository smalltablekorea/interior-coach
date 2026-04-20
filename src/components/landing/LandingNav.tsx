"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { landingCopy } from "@/content/landing";

export default function LandingNav() {
  const { nav } = landingCopy;
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold text-[var(--green)]"
          aria-label="인테리어코치 홈으로"
        >
          {nav.logo}
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {nav.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href={nav.ctaLogin.href}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {nav.ctaLogin.label}
          </Link>
          <Link
            href={nav.ctaSignup.href}
            className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {nav.ctaSignup.label}
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
          <div className="px-6 py-4 flex flex-col gap-3">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="py-2 text-sm text-[var(--muted)]"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <Link
              href={nav.ctaLogin.href}
              className="py-2 text-sm text-[var(--muted)]"
            >
              {nav.ctaLogin.label}
            </Link>
            <Link
              href={nav.ctaSignup.href}
              className="mt-1 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-semibold text-center"
            >
              {nav.ctaSignup.label}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
