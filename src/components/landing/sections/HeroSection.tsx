"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { landingCopy } from "@/content/landing";
import BeforeAfterSlider from "../BeforeAfterSlider";

/* ──────────────────────────────────────────────────────────
   Animated counter hook — counts up from 0 to target
   ────────────────────────────────────────────────────────── */
function useAnimatedCounter(
  target: number,
  duration: number = 2000,
  startWhenVisible: boolean = false,
  isVisible: boolean = true,
) {
  const [count, setCount] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isVisible || hasStarted.current) return;
    hasStarted.current = true;

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, isVisible]);

  return count;
}

/* ──────────────────────────────────────────────────────────
   Stats data
   ────────────────────────────────────────────────────────── */
const stats = [
  { value: 3000, suffix: "+", label: "현장" },
  { value: 12000, suffix: "+", label: "견적서" },
  { value: 1200, suffix: "억+", label: "누적 거래" },
];

/* ──────────────────────────────────────────────────────────
   Social proof logos (placeholder initials for demo)
   ────────────────────────────────────────────────────────── */
const socialProofLogos = [
  "태현인테리어",
  "모던하우스",
  "준혁건설",
  "하우스랩",
  "공간플러스",
];

/* ──────────────────────────────────────────────────────────
   Stagger container / child variants
   ────────────────────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const fadeUpSlow = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ──────────────────────────────────────────────────────────
   Stat Counter Card
   ────────────────────────────────────────────────────────── */
function StatCard({
  value,
  suffix,
  label,
  isVisible,
}: {
  value: number;
  suffix: string;
  label: string;
  isVisible: boolean;
}) {
  const count = useAnimatedCounter(value, 2200, true, isVisible);
  const formatted = count.toLocaleString("ko-KR");

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[clamp(24px,3vw,36px)] font-light tracking-[-0.03em] text-[var(--landing-heading)]"
        style={{ fontFamily: "var(--font-source-sans)" }}
      >
        {formatted}
        <span className="text-[var(--landing-accent)]">{suffix}</span>
      </span>
      <span className="text-sm text-[var(--landing-body)]">{label}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Hero Section
   ────────────────────────────────────────────────────────── */
export default function HeroSection() {
  const h = landingCopy.hero;
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-32"
    >
      {/* ── Multi-layer Stripe-style gradient orbs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Primary purple orb — top left */}
        <div
          className="absolute -top-[30%] -left-[10%] w-[900px] h-[700px] rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(circle, var(--landing-accent) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Magenta orb — top right */}
        <div
          className="absolute -top-[10%] right-[5%] w-[600px] h-[500px] rounded-full opacity-[0.05]"
          style={{
            background:
              "radial-gradient(circle, var(--landing-magenta) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
        {/* Ruby orb — bottom center */}
        <div
          className="absolute bottom-[-20%] left-[30%] w-[700px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, var(--landing-ruby) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        {/* Subtle mesh overlay for depth */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(at 20% 50%, rgba(83,58,253,0.03) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(249,107,238,0.02) 0%, transparent 50%), radial-gradient(at 60% 80%, rgba(234,34,97,0.02) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* ── Main Grid ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-[1.15fr_1fr] gap-14 md:gap-20 items-center"
      >
        {/* ── Left Column: Copy ── */}
        <div>
          {/* Eyebrow badge */}
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--landing-accent-light)] border border-[var(--landing-accent-border)] text-xs font-medium tracking-wide text-[var(--landing-accent)]"
            style={{ fontFamily: "var(--font-source-sans)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--landing-accent)]"
              style={{
                boxShadow: "0 0 6px rgba(83,58,253,0.4)",
              }}
            />
            {h.eyebrow}
          </motion.span>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="mt-7 text-[clamp(34px,5.2vw,56px)] leading-[1.06] tracking-[-0.03em] text-[var(--landing-heading)]"
            style={{
              fontFamily: "var(--font-source-sans)",
              fontWeight: 300,
            }}
          >
            {h.titleLines.map((line, i) => {
              const isLast = i === h.titleLines.length - 1;
              return (
                <span key={i} className="block">
                  {isLast ? (
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

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mt-7 text-lg leading-relaxed text-[var(--landing-body)] whitespace-pre-line max-w-lg"
            style={{
              fontFamily: "var(--font-source-sans)",
              fontWeight: 400,
            }}
          >
            {h.subtitle}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row gap-4 sm:items-center"
          >
            <Link
              href={h.primaryCta.href}
              aria-label={`${h.primaryCta.label} — 회원가입 이동`}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-md bg-[var(--landing-accent)] text-white transition-all duration-200 hover:bg-[var(--landing-accent-hover)] shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px] hover:shadow-[rgba(50,50,93,0.3)_0px_13px_27px_-5px,rgba(0,0,0,0.15)_0px_8px_16px_-8px]"
              style={{
                fontFamily: "var(--font-source-sans)",
                fontWeight: 400,
                borderRadius: "6px",
              }}
            >
              {h.primaryCta.label}
              <ArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href={h.secondaryCta.href}
              aria-label={`${h.secondaryCta.label} — 데모 신청 이동`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md border border-[var(--landing-border)] text-[var(--landing-heading)] transition-all duration-200 hover:bg-[var(--landing-card-alt)] hover:border-[var(--landing-accent-border)]"
              style={{
                fontFamily: "var(--font-source-sans)",
                fontWeight: 400,
                borderRadius: "6px",
              }}
            >
              {h.secondaryCta.label}
            </Link>
          </motion.div>

          {/* Meta text */}
          <motion.p
            variants={fadeUp}
            className="mt-4 text-xs text-[var(--landing-body)] tracking-wide"
            style={{ fontFamily: "var(--font-source-sans)" }}
          >
            {h.meta}
          </motion.p>

          {/* ── Social Proof Strip ── */}
          <motion.div
            variants={fadeUp}
            className="mt-10 pt-8 border-t border-[var(--landing-border)]"
          >
            <p
              className="text-sm text-[var(--landing-body)] mb-4"
              style={{ fontFamily: "var(--font-source-sans)" }}
            >
              <span className="font-medium text-[var(--landing-heading)]">
                1,200+
              </span>{" "}
              인테리어 업체가 선택했습니다
            </p>
            <div className="flex items-center gap-3">
              {/* Company avatar logos */}
              {socialProofLogos.map((name, i) => (
                <div
                  key={name}
                  className="flex items-center justify-center w-9 h-9 rounded-md text-[10px] font-medium text-[var(--landing-accent)] bg-[var(--landing-accent-light)] border border-[var(--landing-accent-border)]"
                  style={{
                    fontFamily: "var(--font-source-sans)",
                  }}
                >
                  {name.slice(0, 2)}
                </div>
              ))}
              <span className="text-xs text-[var(--landing-body)] ml-1">
                +1,195
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Right Column: Before/After Slider ── */}
        <motion.div variants={fadeUpSlow} className="relative">
          {/* Decorative glow behind slider */}
          <div
            aria-hidden
            className="hidden md:block absolute -top-12 -right-10 w-48 h-48 rounded-full"
            style={{
              background: "rgba(83,58,253,0.08)",
              filter: "blur(60px)",
            }}
          />
          <div
            aria-hidden
            className="hidden md:block absolute -bottom-8 -left-8 w-36 h-36 rounded-full"
            style={{
              background: "rgba(249,107,238,0.06)",
              filter: "blur(50px)",
            }}
          />

          {/* Slider with premium blue-tinted shadow */}
          <div
            className="relative rounded-lg overflow-hidden"
            style={{
              borderRadius: "8px",
              boxShadow:
                "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
            }}
          >
            <BeforeAfterSlider />
          </div>

          {/* Floating badge on slider */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute -bottom-4 -left-4 md:-left-6 px-4 py-2.5 rounded-md bg-white border border-[var(--landing-border)]"
            style={{
              borderRadius: "6px",
              boxShadow:
                "rgba(50,50,93,0.12) 0px 6px 12px -2px, rgba(0,0,0,0.08) 0px 3px 7px -3px",
              fontFamily: "var(--font-source-sans)",
            }}
          >
            <p className="text-[11px] text-[var(--landing-body)] leading-none mb-1">
              잠실르엘 32평
            </p>
            <p className="text-sm font-medium text-[var(--landing-heading)] leading-none flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, var(--landing-accent), var(--landing-magenta))",
                }}
              />
              공정 100% 완료
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Animated Stats Row ── */}
      <motion.div
        ref={statsRef}
        initial={{ opacity: 0, y: 30 }}
        animate={statsInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className="relative max-w-3xl mx-auto mt-20 md:mt-28 px-6"
      >
        <div
          className="flex items-center justify-around py-8 px-6 rounded-lg border border-[var(--landing-border)] bg-white/80 backdrop-blur-sm"
          style={{
            borderRadius: "8px",
            boxShadow:
              "rgba(50,50,93,0.08) 0px 13px 27px -5px, rgba(0,0,0,0.04) 0px 8px 16px -8px",
          }}
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-0">
              <StatCard
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                isVisible={statsInView}
              />
              {i < stats.length - 1 && (
                <div className="hidden sm:block w-px h-10 bg-[var(--landing-border)] mx-8 md:mx-12" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
