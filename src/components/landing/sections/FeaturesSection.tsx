"use client";

import { cn } from "@/lib/utils";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";
import FeatureMockup from "../FeatureMockup";

export default function FeaturesSection() {
  const f = landingCopy.features;
  return (
    <section id="features" className="py-16 md:py-30" aria-labelledby="features-heading">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            {f.eyebrow}
          </p>
          <h2
            id="features-heading"
            className="text-3xl md:text-5xl font-black leading-tight whitespace-pre-line"
          >
            {f.title}
          </h2>
        </FadeIn>

        <div className="mt-14 md:mt-24 space-y-20 md:space-y-32">
          {f.blocks.map((b, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={b.name}
                className={cn(
                  "grid md:grid-cols-2 gap-10 md:gap-16 items-center",
                  reverse && "md:[&>*:first-child]:col-start-2",
                )}
              >
                <FadeIn className="space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block text-xs font-mono text-[var(--green)] tracking-wider">
                      FEATURE {String(i + 1).padStart(2, "0")}
                    </span>
                    {"isNew" in b && b.isNew && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--orange)]/15 text-[var(--orange)]">
                        NEW
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold leading-tight">
                    {b.name}
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                      <span className="font-semibold text-[var(--foreground)]">
                        문제 ·{" "}
                      </span>
                      {b.problem}
                    </p>
                    <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                      <span className="font-semibold text-[var(--green)]">
                        해결 ·{" "}
                      </span>
                      {b.solution}
                    </p>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                  <FeatureMockup kind={b.mockup as never} />
                </FadeIn>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
