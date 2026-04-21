"use client";

import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function CaseStudySection() {
  const c = landingCopy.caseStudy;
  return (
    <section
      id="case"
      className="py-20 md:py-32 bg-[var(--landing-dark-section)] text-white"
      aria-labelledby="case-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {c.eyebrow}
          </p>
          <h2
            id="case-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-[-0.02em]"
          >
            {c.title}
          </h2>
          <p className="mt-3 text-white/60">{c.subtitle}</p>
        </FadeIn>

        <div className="mt-14 md:mt-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start">
          {/* Before/After image placeholder */}
          <FadeIn>
            <div
              className="aspect-[4/3] rounded-lg overflow-hidden relative"
              style={{
                background:
                  "linear-gradient(135deg, #d3a777 0%, #9b7a5a 40%, #2d3c64 100%)",
              }}
              role="img"
              aria-label="잠실르엘 32평 리모델링 완공 사진"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-7 md:p-8">
                <p className="text-xs uppercase tracking-widest text-white/50">
                  Before → After
                </p>
                <p className="mt-2 text-lg font-light">
                  잠실르엘 32평 · 6주 완공
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="space-y-8">
            <p className="text-white/70 whitespace-pre-line leading-relaxed text-base font-light">
              {c.summary}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {c.stats.map((s) => (
                <div
                  key={s.label}
                  className="p-4 md:p-5 rounded-lg border border-white/10 bg-white/[0.04]"
                >
                  <p className="text-[11px] text-white/40 uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="mt-2 text-lg md:text-xl font-light text-[var(--landing-accent)]">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <ol className="space-y-3">
              {c.timeline.map((t, i) => (
                <li key={t.week} className="flex items-start gap-4">
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--landing-accent)]" />
                    {i < c.timeline.length - 1 && (
                      <div className="w-px h-8 bg-white/10 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p className="text-xs font-mono text-white/40">
                      {t.week}
                    </p>
                    <p className="text-sm text-white/80 font-light">{t.label}</p>
                  </div>
                </li>
              ))}
            </ol>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
