"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { landingCopy } from "@/content/landing";

export default function LandingNav() {
  const { nav } = landingCopy;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeMobile = useCallback(() => setOpen(false), []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "bg-[rgba(255,255,255,0.85)] backdrop-blur-[12px] border-b border-[var(--landing-border)]"
          : "bg-transparent border-b border-transparent"
      }`}
      style={{ fontFamily: "var(--font-source-sans), sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 rounded-[6px]">
          {/* Logo */}
          <Link
            href="/"
            className="text-[18px] font-medium tracking-tight text-[var(--landing-heading)] flex items-center gap-0"
            aria-label="인테리어코치 홈으로"
          >
            인테리어코치
            <span className="inline-block w-[5px] h-[5px] rounded-full bg-[var(--landing-accent)] ml-[2px] translate-y-[2px]" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[14px] font-normal text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA group */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href={nav.ctaLogin.href}
              className="text-[14px] font-normal text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors duration-200"
            >
              {nav.ctaLogin.label}
            </Link>
            <Link
              href={nav.ctaSignup.href}
              className="px-4 py-[7px] rounded-[4px] bg-[var(--landing-accent)] text-white text-[14px] font-medium hover:bg-[var(--landing-accent-hover)] transition-colors duration-200 shadow-[0_1px_3px_rgba(83,58,253,0.25)]"
            >
              {nav.ctaSignup.label}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden relative z-50 p-2 -mr-2"
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
      </div>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-16 z-40 bg-[rgba(255,255,255,0.97)] backdrop-blur-[12px]"
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="px-6 pt-6 pb-8 flex flex-col gap-1"
            >
              {nav.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={closeMobile}
                  className="text-[16px] font-normal text-[var(--landing-heading)] py-3 border-b border-[var(--landing-border)] transition-colors duration-200 hover:text-[var(--landing-accent)]"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href={nav.ctaLogin.href}
                onClick={closeMobile}
                className="text-[16px] font-normal text-[var(--landing-body)] py-3 border-b border-[var(--landing-border)]"
              >
                {nav.ctaLogin.label}
              </Link>
              <Link
                href={nav.ctaSignup.href}
                onClick={closeMobile}
                className="mt-4 py-3 rounded-[4px] bg-[var(--landing-accent)] text-white text-[15px] font-medium text-center hover:bg-[var(--landing-accent-hover)] transition-colors duration-200"
              >
                {nav.ctaSignup.label}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
