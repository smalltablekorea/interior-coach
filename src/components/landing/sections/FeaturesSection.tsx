"use client";

import { cn } from "@/lib/utils";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";
import FeatureMockup from "../FeatureMockup";

export default function FeaturesSection() {
  const f = landingCopy.features;
  return (
    <section
      id="features"
      className="py-24 md:py-40"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-normal text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {f.eyebrow}
          </p>
          <h2
            id="features-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-[-0.02em] text-[var(--landing-heading)] whitespace-pre-line"
          >
            {f.title}
          </h2>
        </FadeIn>

        {/* Alternating feature rows */}
        <div className="mt-20 md:mt-32 space-y-28 md:space-y-40">
          {f.blocks.map((b, i) => {
            const isEven = i % 2 === 1;
            const stepNum = String(i + 1).padStart(2, "0");

            return (
              <div
                key={b.name}
                className={cn(
                  "grid md:grid-cols-2 gap-12 md:gap-20 items-center",
                  isEven && "md:direction-rtl",
                )}
              >
                {/* Text column */}
                <FadeIn
                  className={cn(
                    "space-y-6 md:direction-ltr",
                    isEven && "md:order-2",
                  )}
                >
                  {/* Step number */}
                  <span className="inline-block font-mono text-xs tracking-[0.2em] uppercase text-[var(--landing-accent)] border border-[var(--landing-accent-border)] rounded px-3 py-1">
                    {stepNum}
                  </span>

                  {/* Feature name */}
                  <h3 className="text-2xl md:text-[32px] font-light leading-tight tracking-[-0.02em] text-[var(--landing-heading)]">
                    {b.name}
                  </h3>

                  {/* Problem / Solution */}
                  <div className="space-y-4">
                    <p className="text-[15px] leading-relaxed text-[var(--landing-body)] italic font-light">
                      {b.problem}
                    </p>
                    <div className="w-8 h-px bg-[var(--landing-accent)] opacity-40" />
                    <p className="text-[15px] leading-relaxed text-[var(--landing-heading)] whitespace-pre-line font-normal">
                      {b.solution}
                    </p>
                  </div>
                </FadeIn>

                {/* Mockup column */}
                <FadeIn
                  delay={0.15}
                  className={cn(
                    "md:direction-ltr",
                    isEven && "md:order-1",
                  )}
                >
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      boxShadow:
                        "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
                    }}
                  >
                    <FeatureMockup kind={b.mockup as never} />
                  </div>
                </FadeIn>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
