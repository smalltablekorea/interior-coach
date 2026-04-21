"use client";

import { Database, HardHat, Layers } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

const ICONS = [Database, HardHat, Layers] as const;
const ACCENT_NUMBERS = ["868", "10+", "5→1"] as const;

export default function WhyUsSection() {
  const w = landingCopy.whyUs;
  return (
    <section className="py-24 md:py-40" aria-labelledby="why-heading">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-normal text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {w.eyebrow}
          </p>
          <h2
            id="why-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-[-0.02em] text-[var(--landing-heading)] whitespace-pre-line"
          >
            {w.title}
          </h2>
        </FadeIn>

        {/* 3-column card grid */}
        <div className="mt-16 md:mt-24 grid md:grid-cols-3 gap-6">
          {w.cards.map((c, i) => {
            const Icon = ICONS[i] ?? Database;
            const accentNum = ACCENT_NUMBERS[i] ?? "";

            return (
              <FadeIn
                key={c.headline}
                delay={i * 0.1}
                className="group relative p-8 md:p-10 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] transition-shadow duration-300 hover:shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-md bg-[var(--landing-accent-light)] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className="text-[var(--landing-accent)]"
                  />
                </div>

                {/* Large accent number */}
                <p className="text-3xl md:text-4xl font-light tracking-tight text-[var(--landing-accent)] mb-3">
                  {accentNum}
                </p>

                {/* Headline */}
                <h3 className="text-lg font-normal text-[var(--landing-heading)] mb-3 leading-snug">
                  {c.headline}
                </h3>

                {/* Body */}
                <p className="text-sm text-[var(--landing-body)] leading-relaxed font-normal whitespace-pre-line">
                  {c.body}
                </p>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
