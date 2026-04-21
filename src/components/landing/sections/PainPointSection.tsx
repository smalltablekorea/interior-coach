"use client";

import { MessageSquare, FileSpreadsheet, Phone, Wallet } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  MessageSquare,
  FileSpreadsheet,
  Phone,
  Wallet,
};

export default function PainPointSection() {
  const p = landingCopy.painPoints;
  return (
    <section
      className="py-20 md:py-32 bg-[var(--landing-card-alt)]"
      aria-labelledby="pain-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {p.eyebrow}
          </p>
          <h2
            id="pain-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-tight text-[var(--landing-heading)] whitespace-pre-line"
          >
            {p.title}
          </h2>
        </FadeIn>

        <div className="mt-14 md:mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {p.cards.map((c, i) => {
            const Icon = ICONS[c.icon] || MessageSquare;
            return (
              <FadeIn
                key={c.title}
                delay={i * 0.08}
                className="group p-7 rounded-xl border border-[var(--landing-border)] bg-white hover:shadow-[var(--landing-shadow-blue)_0px_30px_45px_-30px,var(--landing-shadow-black)_0px_18px_36px_-18px] transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[var(--landing-accent-light)] flex items-center justify-center mb-6">
                  <Icon
                    size={22}
                    className="text-[var(--landing-accent)]"
                  />
                </div>
                <h3 className="text-base font-semibold text-[var(--landing-heading)] mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-[var(--landing-body)] leading-relaxed whitespace-pre-line">
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
