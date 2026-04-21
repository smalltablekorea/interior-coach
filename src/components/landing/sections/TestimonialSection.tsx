"use client";

import { Star } from "lucide-react";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function TestimonialSection() {
  const t = landingCopy.testimonials;
  return (
    <section
      className="py-20 md:py-32 bg-[var(--landing-card-alt)]"
      aria-labelledby="testimonial-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {t.eyebrow}
          </p>
          <h2
            id="testimonial-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-tight text-[var(--landing-heading)] whitespace-pre-line"
          >
            {t.title}
          </h2>
        </FadeIn>

        <div className="mt-14 md:mt-20 grid md:grid-cols-3 gap-6">
          {t.reviews.map((review, i) => (
            <FadeIn
              key={review.name}
              delay={i * 0.1}
              className="flex flex-col p-8 rounded-xl border border-[var(--landing-border)] bg-white"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    size={16}
                    className="fill-[var(--landing-accent)] text-[var(--landing-accent)]"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm text-[var(--landing-heading)] leading-relaxed flex-1">
                &ldquo;{review.quote}&rdquo;
              </blockquote>

              {/* Metric badge */}
              <div className="mt-5 inline-flex self-start px-3 py-1 rounded-md bg-[var(--landing-accent-light)] text-xs font-semibold text-[var(--landing-accent)]">
                {review.metric}
              </div>

              {/* Author */}
              <div className="mt-6 pt-5 border-t border-[var(--landing-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--landing-accent-light)] flex items-center justify-center text-sm font-bold text-[var(--landing-accent)]">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--landing-heading)]">
                      {review.name}
                    </p>
                    <p className="text-xs text-[var(--landing-body)]">
                      {review.company} · {review.role}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
