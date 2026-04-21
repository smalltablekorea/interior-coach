"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function FinalCTASection() {
  const c = landingCopy.finalCta;
  return (
    <section
      className="relative overflow-hidden py-28 md:py-40"
      style={{ backgroundColor: "var(--landing-dark-section)" }}
    >
      {/* Ruby → Magenta gradient decorative blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "min(900px, 90vw)",
          height: "420px",
          background:
            "radial-gradient(ellipse at 40% 50%, var(--landing-ruby) 0%, var(--landing-magenta) 55%, transparent 80%)",
          opacity: 0.18,
          filter: "blur(80px)",
        }}
      />

      {/* Subtle top-left accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(83,58,253,0.2) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl leading-tight tracking-[-0.02em] text-white md:text-[46px] md:leading-[1.15]" style={{ fontWeight: 300 }}>
            {c.title}
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-white/55 md:text-lg" style={{ fontWeight: 300 }}>
            {c.subtitle}
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Primary — inverted: white bg, accent text */}
            <Link
              href={c.primary.href}
              aria-label={`${c.primary.label} — 회원가입 이동`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-[15px] text-[var(--landing-accent)] shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px] transition-all hover:bg-white/90 hover:shadow-[rgba(50,50,93,0.3)_0px_8px_16px_-4px,rgba(0,0,0,0.3)_0px_4px_8px_-4px]"
              style={{ fontWeight: 400 }}
            >
              {c.primary.label}
              <ArrowRight size={18} strokeWidth={2} />
            </Link>

            {/* Secondary — ghost with white border */}
            <Link
              href={c.secondary.href}
              aria-label={`${c.secondary.label} — 데모 신청 이동`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-8 py-4 text-[15px] text-white transition-colors hover:border-white/40 hover:bg-white/[0.06]"
              style={{ fontWeight: 400 }}
            >
              {c.secondary.label}
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-8 text-sm text-white/35" style={{ fontWeight: 300 }}>
            ✓ 14일 무료 체험 &nbsp;·&nbsp; ✓ 카드 등록 불필요 &nbsp;·&nbsp; ✓
            언제든 해지 가능
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
