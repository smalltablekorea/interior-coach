"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { landingCopy } from "@/content/landing";
import FeatureMockup from "../FeatureMockup";

export default function HeroSection() {
  const h = landingCopy.hero;
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* 배경 라디얼 톤 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px 500px at 20% 0%, rgba(211,167,119,0.12), transparent 70%), radial-gradient(700px 500px at 100% 20%, rgba(45,60,100,0.18), transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 md:gap-16 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[var(--border)] text-xs text-[var(--muted)]"
          >
            {h.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-5 text-[clamp(32px,6vw,60px)] font-black leading-[1.12] tracking-tight"
          >
            {h.titleLines.map((line, i) => {
              const last = i === h.titleLines.length - 1;
              return (
                <span key={i} className="block">
                  {last ? (
                    <>
                      {line.replace(/\.$/, "")}
                      <span className="text-[var(--green)]">.</span>
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
            className="mt-6 text-base md:text-lg text-[var(--muted)] leading-relaxed whitespace-pre-line max-w-xl"
          >
            {h.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="mt-9 flex flex-col sm:flex-row gap-3 sm:items-center"
          >
            <Link
              href={h.primaryCta.href}
              aria-label={`${h.primaryCta.label} — 회원가입 이동`}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--green)] text-black font-bold hover:opacity-90 transition-opacity"
            >
              {h.primaryCta.label} <ArrowRight size={18} />
            </Link>
            <Link
              href={h.secondaryCta.href}
              aria-label={`${h.secondaryCta.label} — 데모 신청 이동`}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-[var(--border)] font-semibold hover:bg-white/[0.04] transition-colors"
            >
              {h.secondaryCta.label}
            </Link>
          </motion.div>

          <p className="mt-4 text-xs text-[var(--muted)]">{h.meta}</p>
        </div>

        {/* 우측 목업 — 모바일에선 하단으로 내려감 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative grid gap-4"
        >
          <div className="hidden md:block absolute -top-8 -right-6 w-32 h-32 rounded-full bg-[var(--green)]/20 blur-3xl" />
          {/* Part A/C: 톡방 목업 제거, 대시보드/손익/업무일지 합성 */}
          <FeatureMockup kind="pnl" />
          <div className="-mt-2 md:-mt-4 md:ml-8">
            <FeatureMockup kind="dailyLog" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
