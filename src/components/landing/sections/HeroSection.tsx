"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { landingCopy } from "@/content/landing";
import FeatureMockup from "../FeatureMockup";

export default function HeroSection() {
  const h = landingCopy.hero;
  return (
    <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-40">
      {/* Stripe-style gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(800px 500px at 20% -10%, rgba(0,168,94,0.06), transparent 60%), radial-gradient(600px 500px at 80% 20%, rgba(50,50,93,0.04), transparent 50%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-[1.2fr_1fr] gap-12 md:gap-20 items-center">
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
            className="mt-6 text-[clamp(36px,5.5vw,56px)] font-light leading-[1.08] tracking-tight text-[var(--landing-heading)]"
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
            className="mt-7 text-lg text-[var(--landing-body)] leading-relaxed whitespace-pre-line max-w-lg"
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
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-[var(--landing-accent)] text-white font-semibold hover:bg-[var(--landing-accent-hover)] transition-colors shadow-[0_4px_14px_rgba(0,168,94,0.3)]"
            >
              {h.primaryCta.label} <ArrowRight size={18} />
            </Link>
            <Link
              href={h.secondaryCta.href}
              aria-label={`${h.secondaryCta.label} — 데모 신청 이동`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-[var(--landing-border)] text-[var(--landing-heading)] font-semibold hover:bg-[var(--landing-card-alt)] transition-colors"
            >
              {h.secondaryCta.label}
            </Link>
          </motion.div>

          <p className="mt-4 text-xs text-[var(--landing-body)]">
            {h.meta}
          </p>
        </div>

        {/* Right mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative grid gap-5"
        >
          <div
            className="hidden md:block absolute -top-12 -right-8 w-40 h-40 rounded-full blur-[60px]"
            style={{ background: "rgba(0,168,94,0.12)" }}
          />
          <div className="shadow-[var(--landing-shadow-blue)_0px_30px_45px_-30px,var(--landing-shadow-black)_0px_18px_36px_-18px] rounded-2xl">
            <FeatureMockup kind="schedule" />
          </div>
          <div className="-mt-3 md:-mt-6 md:ml-10 shadow-[var(--landing-shadow-ambient)_0px_15px_35px_0px] rounded-2xl">
            <FeatureMockup kind="chat" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
