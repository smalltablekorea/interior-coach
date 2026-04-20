"use client";

import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function CaseStudySection() {
  const c = landingCopy.caseStudy;
  return (
    <section id="case" className="py-16 md:py-30 bg-white/[0.015]" aria-labelledby="case-heading">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            {c.eyebrow}
          </p>
          <h2
            id="case-heading"
            className="text-3xl md:text-5xl font-black leading-tight"
          >
            {c.title}
          </h2>
          <p className="mt-3 text-[var(--muted)]">{c.subtitle}</p>
        </FadeIn>

        <div className="mt-12 md:mt-16 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
          {/* 이미지 영역 — 실제 사진 자산 교체 지점 */}
          <FadeIn>
            <div
              className="aspect-[4/3] rounded-3xl overflow-hidden border border-[var(--border)] relative"
              style={{
                background:
                  "linear-gradient(135deg, #d3a777 0%, #9b7a5a 40%, #2d3c64 100%)",
              }}
              role="img"
              aria-label="잠실르엘 32평 리모델링 완공 사진 (이미지 자산 교체 예정)"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
                <p className="text-xs uppercase tracking-wider opacity-70">
                  Before → After
                </p>
                <p className="mt-1 text-lg font-bold">
                  잠실르엘 32평 · 6주 완공
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="space-y-8">
            <p className="text-[var(--muted)] whitespace-pre-line leading-relaxed">
              {c.summary}
            </p>

            {/* 수치 하이라이트 */}
            <div className="grid grid-cols-3 gap-3">
              {c.stats.map((s) => (
                <div
                  key={s.label}
                  className="p-4 md:p-5 rounded-2xl border border-[var(--border)] bg-[var(--sidebar)]"
                >
                  <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                  <p className="mt-1 text-base md:text-xl font-bold text-[var(--green)]">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* 타임라인 */}
            <ol className="space-y-3">
              {c.timeline.map((t, i) => (
                <li key={t.week} className="flex items-start gap-4">
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--green)]" />
                    {i < c.timeline.length - 1 && (
                      <div className="w-px h-8 bg-[var(--border)] mt-1" />
                    )}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p className="text-xs font-mono text-[var(--muted)]">
                      {t.week}
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      {t.label}
                    </p>
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
