"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

const { faq } = landingCopy;

function FAQItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--landing-border)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[var(--landing-accent)]"
        aria-expanded={isOpen}
      >
        <span
          className="text-base"
          style={{
            fontWeight: 400,
            color: isOpen ? "var(--landing-accent)" : "var(--landing-heading)",
          }}
        >
          {q}
        </span>
        <ChevronDown
          size={20}
          className={cn(
            "shrink-0 text-[var(--landing-body)] transition-transform duration-300",
            isOpen && "rotate-180 text-[var(--landing-accent)]"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-[var(--landing-body)]">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6">
        {/* header */}
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide uppercase text-[var(--landing-accent)]">
              {faq.eyebrow}
            </p>
            <h2
              className="mt-3 text-3xl sm:text-4xl leading-tight"
              style={{
                fontWeight: 300,
                color: "var(--landing-heading)",
              }}
            >
              {faq.title}
            </h2>
          </div>
        </FadeIn>

        {/* items */}
        <FadeIn delay={0.15}>
          <div className="mt-12">
            {faq.items.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                isOpen={openIndex === i}
                onToggle={() =>
                  setOpenIndex(openIndex === i ? null : i)
                }
              />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
