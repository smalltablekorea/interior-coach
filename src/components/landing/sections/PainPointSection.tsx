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
    <section className="py-16 md:py-30 bg-white/[0.015]" aria-labelledby="pain-heading">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            {p.eyebrow}
          </p>
          <h2
            id="pain-heading"
            className="text-3xl md:text-5xl font-black leading-tight whitespace-pre-line"
          >
            {p.title}
          </h2>
        </FadeIn>

        <div className="mt-12 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {p.cards.map((c, i) => {
            const Icon = ICONS[c.icon] || MessageSquare;
            return (
              <FadeIn
                key={c.title}
                delay={i * 0.08}
                className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--sidebar)] hover:border-[var(--green)]/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--green)]/10 flex items-center justify-center mb-5">
                  <Icon size={20} className="text-[var(--green)]" />
                </div>
                <h3 className="text-base font-bold mb-2">{c.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
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
