"use client";

import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function CaseStudySection() {
  const c = landingCopy.caseStudy;
  return (
    <section
      id="case"
      className="py-24 md:py-40 bg-[var(--landing-dark-section)] text-white overflow-hidden"
      aria-labelledby="case-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-normal text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {c.eyebrow}
          </p>
          <h2
            id="case-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-[-0.02em]"
          >
            {c.title}
          </h2>
          <p className="mt-3 text-lg font-light text-white/50">
            {c.subtitle}
          </p>
        </FadeIn>

        {/* Summary */}
        <FadeIn className="mt-12 md:mt-16 max-w-2xl mx-auto text-center">
          <p className="text-base md:text-lg text-white/65 whitespace-pre-line leading-relaxed font-light">
            {c.summary}
          </p>
        </FadeIn>

        {/* Stats row – big numbers */}
        <FadeIn className="mt-14 md:mt-20">
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            {c.stats.map((s) => (
              <div
                key={s.label}
                className="text-center p-6 md:p-8 rounded-lg border border-white/[0.08] bg-white/[0.03]"
              >
                <p className="text-2xl md:text-4xl font-light tracking-tight text-white">
                  {s.value}
                </p>
                <p className="mt-2 text-[11px] md:text-xs uppercase tracking-widest text-white/40 font-normal">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Horizontal timeline track */}
        <FadeIn className="mt-16 md:mt-24">
          <div className="relative max-w-4xl mx-auto">
            {/* Track line */}
            <div className="absolute top-3 left-0 right-0 h-px bg-white/[0.12]" />

            <ol className="grid grid-cols-3 md:grid-cols-6 gap-y-10 relative">
              {c.timeline.map((t, i) => {
                const isLast = i === c.timeline.length - 1;
                return (
                  <li key={t.week} className="flex flex-col items-center text-center relative">
                    {/* Dot */}
                    <div
                      className={
                        "relative z-10 w-[7px] h-[7px] rounded-full " +
                        (isLast
                          ? "bg-[var(--landing-green)] shadow-[0_0_8px_var(--landing-green)]"
                          : "bg-[var(--landing-accent)]")
                      }
                    />
                    {/* Labels */}
                    <p className="mt-4 text-[11px] font-mono text-white/35 tracking-wide">
                      {t.week}
                    </p>
                    <p className="mt-1 text-xs md:text-[13px] font-light text-white/75 leading-snug px-1">
                      {t.label}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
