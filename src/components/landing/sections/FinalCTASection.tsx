"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function FinalCTASection() {
  const c = landingCopy.finalCta;
  return (
    <section className="py-16 md:py-30">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <div
            className="relative overflow-hidden rounded-[32px] border border-[var(--green)]/30 p-10 md:p-16 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(45,60,100,0.35) 0%, rgba(211,167,119,0.15) 100%)",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(500px 300px at 50% 0%, rgba(16,185,129,0.18), transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                {c.title}
              </h2>
              <p className="mt-5 text-base md:text-lg text-[var(--muted)] whitespace-pre-line leading-relaxed">
                {c.subtitle}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={c.primary.href}
                  aria-label={`${c.primary.label} — 회원가입 이동`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--green)] text-black font-bold hover:opacity-90 transition-opacity"
                >
                  {c.primary.label} <ArrowRight size={18} />
                </Link>
                <Link
                  href={c.secondary.href}
                  aria-label={`${c.secondary.label} — 데모 신청 이동`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-[var(--border)] font-semibold hover:bg-white/[0.04] transition-colors"
                >
                  {c.secondary.label}
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
