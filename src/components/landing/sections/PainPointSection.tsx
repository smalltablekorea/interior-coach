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
      className="relative py-24 md:py-36 overflow-hidden"
      style={{ background: "#1c1e54" }}
      aria-labelledby="pain-heading"
    >
      {/* Subtle radial gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(83,58,253,0.15), transparent)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p
            className="text-[12px] font-medium tracking-[0.15em] uppercase mb-5"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {p.eyebrow}
          </p>
          <h2
            id="pain-heading"
            className="text-[32px] md:text-[44px] font-light leading-[1.15] tracking-[-0.02em] text-white whitespace-pre-line"
            style={{ fontFamily: "var(--font-source-sans), sans-serif" }}
          >
            {p.title}
          </h2>
        </FadeIn>

        {/* Cards grid: 2×2 on desktop, single column on mobile */}
        <div className="mt-14 md:mt-20 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {p.cards.map((c, i) => {
            const Icon = ICONS[c.icon] || MessageSquare;
            return (
              <FadeIn key={c.title} delay={i * 0.08}>
                <div
                  className="group p-7 rounded-[8px] transition-colors duration-300 cursor-default"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                >
                  {/* Icon circle */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <Icon
                      size={22}
                      className="text-[var(--landing-accent)]"
                      strokeWidth={1.75}
                    />
                  </div>

                  {/* Card title */}
                  <h3 className="text-[16px] font-medium text-white mb-2">
                    {c.title}
                  </h3>

                  {/* Card body */}
                  <p
                    className="text-[14px] leading-relaxed whitespace-pre-line font-light"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {c.body}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
