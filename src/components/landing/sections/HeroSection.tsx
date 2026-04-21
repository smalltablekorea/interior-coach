"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { landingCopy } from "@/content/landing";
import BeforeAfterSlider from "../BeforeAfterSlider";

export default function HeroSection() {
  const h = landingCopy.hero;
  return (
    <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-44">
      {/* Stripe-style gradient orbs — purple/magenta */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 600px at 15% -15%, rgba(83,58,253,0.07), transparent 60%), radial-gradient(700px 500px at 85% 30%, rgba(249,107,238,0.04), transparent 50%), radial-gradient(500px 400px at 50% 80%, rgba(234,34,97,0.03), transparent 60%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-[1.15fr_1fr] gap-14 md:gap-20 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--landing-accent-light)] border border-[var(--landing-accent-border)] text-xs font-medium text-[var(--landing-accent)]"
          >
            {h.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-7 text-[clamp(36px,5.5vw,56px)] font-light leading-[1.03] tracking-[-0.025em] text-[var(--landing-heading)]"
          >
            {h.titleLines.map((line, i) => {
              const last = i === h.titleLines.length - 1;
              return (
                <span key={i} className="block">
                  {last ? (
                    <>
                      {line.replace(/\.$/, "")}
                      <span className="text-[var(--landing-accent)]">.</span>
                    </>
                  ) : (
                    line
                  )}
                </span>
              );
            })}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mt-8 text-lg text-[var(--landing-body)] leading-relaxed whitespace-pre-line max-w-lg"
          >
            {h.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 sm:items-center"
          >
            <Link
              href={h.primaryCta.href}
              aria-label={`${h.primaryCta.label} — 회원가입 이동`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md bg-[var(--landing-accent)] text-white font-medium hover:bg-[var(--landing-accent-hover)] transition-colors shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]"
            >
              {h.primaryCta.label} <ArrowRight size={18} />
            </Link>
            <Link
              href={h.secondaryCta.href}
              aria-label={`${h.secondaryCta.label} — 데모 신청 이동`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md border border-[var(--landing-border)] text-[var(--landing-heading)] font-medium hover:bg-[var(--landing-card-alt)] transition-colors"
            >
              {h.secondaryCta.label}
            </Link>
          </motion.div>

          <p className="mt-4 text-xs text-[var(--landing-body)]">
            {h.meta}
          </p>
        </div>

        {/* Right — Before/After Slider */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative"
        >
          <div
            className="hidden md:block absolute -top-16 -right-12 w-52 h-52 rounded-full blur-[80px]"
            style={{ background: "rgba(83,58,253,0.1)" }}
          />
          <div className="shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] rounded-xl overflow-hidden">
            <BeforeAfterSlider />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
