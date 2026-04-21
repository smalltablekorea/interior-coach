"use client";

import { Database, HardHat, Layers } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

const ICONS = [Database, HardHat, Layers];

export default function WhyUsSection() {
  const w = landingCopy.whyUs;
  return (
    <section className="py-20 md:py-32" aria-labelledby="why-heading">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {w.eyebrow}
          </p>
          <h2
            id="why-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-[-0.02em] text-[var(--landing-heading)] whitespace-pre-line"
          >
            {w.title}
          </h2>
        </FadeIn>

        <div className="mt-14 md:mt-20 grid md:grid-cols-3 gap-6">
          {w.cards.map((c, i) => {
            const Icon = ICONS[i] || Database;
            return (
              <FadeIn
                key={c.headline}
                delay={i * 0.1}
                className="group p-8 rounded-lg border border-[var(--landing-border)] bg-white hover:shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-md bg-[var(--landing-accent-light)] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Icon size={22} className="text-[var(--landing-accent)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--landing-heading)] mb-3 leading-snug">
                  {c.headline}
                </h3>
                <p className="text-sm text-[var(--landing-body)] leading-relaxed font-light">
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
