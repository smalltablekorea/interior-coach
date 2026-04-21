"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function FinalCTASection() {
  const c = landingCopy.finalCta;
  return (
    <section className="py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <div
            className="relative overflow-hidden rounded-2xl p-12 md:p-20 text-center"
            style={{
              background:
                "linear-gradient(135deg, #061b31 0%, #0d3b2d 50%, #061b31 100%)",
            }}
          >
            {/* Ambient glow */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(600px 300px at 50% 0%, rgba(0,168,94,0.2), transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="text-3xl md:text-[44px] font-light leading-tight tracking-tight text-white">
                {c.title}
              </h2>
              <p className="mt-6 text-base md:text-lg text-white/60 whitespace-pre-line leading-relaxed max-w-xl mx-auto">
                {c.subtitle}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={c.primary.href}
                  aria-label={`${c.primary.label} — 회원가입 이동`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-[var(--landing-accent)] text-white font-semibold hover:bg-[var(--landing-accent-hover)] transition-colors shadow-[0_4px_14px_rgba(0,168,94,0.3)]"
                >
                  {c.primary.label} <ArrowRight size={18} />
                </Link>
                <Link
                  href={c.secondary.href}
                  aria-label={`${c.secondary.label} — 데모 신청 이동`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  {c.secondary.label}
                </Link>
              </div>
              {/* Trust signals */}
              <p className="mt-6 text-sm text-white/40">
                ✓ 14일 무료 체험 &nbsp;·&nbsp; ✓ 카드 등록 불필요 &nbsp;·&nbsp; ✓ 언제든 해지 가능
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
