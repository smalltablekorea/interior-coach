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
    <section id="faq" className="py-16 md:py-30" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn className="text-center">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            {f.eyebrow}
          </p>
          <h2
            id="faq-heading"
            className="text-3xl md:text-5xl font-black leading-tight"
          >
            {f.title}
          </h2>
        </FadeIn>

        <div className="mt-10 md:mt-14 space-y-3">
          {f.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <FadeIn
                key={item.q}
                delay={i * 0.04}
                className="rounded-2xl border border-[var(--border)] bg-[var(--sidebar)] overflow-hidden"
              >
                <button
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 md:px-6 md:py-5 text-left"
                >
                  <span className="text-sm md:text-base font-semibold">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "shrink-0 text-[var(--muted)] transition-transform",
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
                    <p className="px-5 pb-5 md:px-6 md:pb-6 text-sm text-[var(--muted)] leading-relaxed">
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
