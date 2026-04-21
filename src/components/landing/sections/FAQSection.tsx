"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function FAQSection() {
  const f = landingCopy.faq;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-20 md:py-32 bg-[var(--landing-card-alt)]"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn className="text-center">
          <p className="text-sm font-medium text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {f.eyebrow}
          </p>
          <h2
            id="faq-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-[-0.02em] text-[var(--landing-heading)]"
          >
            {f.title}
          </h2>
        </FadeIn>

        <div className="mt-12 md:mt-16 space-y-3">
          {f.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <FadeIn
                key={item.q}
                delay={i * 0.04}
                className="rounded-lg border border-[var(--landing-border)] bg-white overflow-hidden"
              >
                <button
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 md:px-7 md:py-6 text-left"
                >
                  <span className="text-sm md:text-base font-medium text-[var(--landing-heading)]">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "shrink-0 text-[var(--landing-body)] transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 md:px-7 md:pb-7 text-sm text-[var(--landing-body)] leading-relaxed font-light">
                      {item.a}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
