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
      className="py-20 md:py-32"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {f.eyebrow}
          </p>
          <h2
            id="features-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-tight text-[var(--landing-heading)] whitespace-pre-line"
          >
            {f.title}
          </h2>
        </FadeIn>

        <div className="mt-16 md:mt-28 space-y-24 md:space-y-36">
          {f.blocks.map((b, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={b.name}
                className={cn(
                  "grid md:grid-cols-2 gap-12 md:gap-20 items-center",
                  reverse && "md:[&>*:first-child]:col-start-2",
                )}
              >
                <FadeIn className="space-y-5">
                  <span className="inline-block text-xs font-mono text-[var(--landing-accent)] tracking-widest uppercase">
                    Feature 0{i + 1}
                  </span>
                  <h3 className="text-2xl md:text-[32px] font-light leading-tight tracking-tight text-[var(--landing-heading)]">
                    {b.name}
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--landing-body)] leading-relaxed">
                      <span className="font-semibold text-[var(--landing-heading)]">
                        문제 ·{" "}
                      </span>
                      {b.problem}
                    </p>
                    <p className="text-sm text-[var(--landing-heading)] leading-relaxed whitespace-pre-line">
                      <span className="font-semibold text-[var(--landing-accent)]">
                        해결 ·{" "}
                      </span>
                      {b.solution}
                    </p>
                  </div>
                </FadeIn>

                <FadeIn
                  delay={0.1}
                  className="shadow-[var(--landing-shadow-blue)_0px_30px_45px_-30px,var(--landing-shadow-black)_0px_18px_36px_-18px] rounded-2xl"
                >
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
