"use client";

import { Database, HardHat, Layers } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

const ICONS = [Database, HardHat, Layers];

export default function WhyUsSection() {
  const w = landingCopy.whyUs;
  return (
    <section className="py-16 md:py-30" aria-labelledby="why-heading">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            {w.eyebrow}
          </p>
          <h2
            id="why-heading"
            className="text-3xl md:text-5xl font-black leading-tight whitespace-pre-line"
          >
            {w.title}
          </h2>
        </FadeIn>

        <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-5">
          {w.cards.map((c, i) => {
            const Icon = ICONS[i] || Database;
            return (
              <FadeIn
                key={c.headline}
                delay={i * 0.1}
                className="group p-7 rounded-3xl border border-[var(--border)] bg-[var(--sidebar)] hover:border-[var(--green)]/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--green)]/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Icon size={22} className="text-[var(--green)]" />
                </div>
                <h3 className="text-lg font-bold mb-3 leading-snug">
                  {c.headline}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
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
