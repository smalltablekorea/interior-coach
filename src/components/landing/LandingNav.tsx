"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { landingCopy } from "@/content/landing";

export default function LandingNav() {
  const { nav } = landingCopy;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-[rgba(0,55,112,0.08)_0px_1px_3px]"
          : "bg-white"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-[var(--landing-heading)]"
          aria-label="인테리어코치 홈으로"
        >
          <span className="text-[var(--landing-accent)]">인테리어</span>코치
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {nav.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-normal text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href={nav.ctaLogin.href}
            className="text-sm font-normal text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors"
          >
            {nav.ctaLogin.label}
          </Link>
          <Link
            href={nav.ctaSignup.href}
            className="px-5 py-2 rounded-md bg-[var(--landing-accent)] text-white text-sm font-medium hover:bg-[var(--landing-accent-hover)] transition-colors shadow-[rgba(50,50,93,0.25)_0px_2px_5px_-1px,rgba(0,0,0,0.3)_0px_1px_3px_-1px]"
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
          {open ? (
            <X size={22} className="text-[var(--landing-heading)]" />
          ) : (
            <Menu size={22} className="text-[var(--landing-heading)]" />
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--landing-border)] bg-white">
          <div className="px-6 py-4 flex flex-col gap-3">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-normal text-[var(--landing-body)] hover:text-[var(--landing-heading)] py-2"
              >
                {l.label}
              </a>
            ))}
            <Link
              href={nav.ctaLogin.href}
              className="text-sm font-normal text-[var(--landing-body)] py-2"
            >
              {nav.ctaLogin.label}
            </Link>
            <Link
              href={nav.ctaSignup.href}
              className="mt-2 py-3 rounded-md bg-[var(--landing-accent)] text-white text-sm font-medium text-center"
            >
              {nav.ctaSignup.label}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
