"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

export default function TestimonialSection() {
  const t = landingCopy.testimonials;
  const reviews = t.reviews;
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (idx: number, dir: number) => {
      setDirection(dir);
      setCurrent(((idx % reviews.length) + reviews.length) % reviews.length);
    },
    [reviews.length],
  );

  // Auto-advance every 5s
  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1, 1), 5000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const review = reviews[current];

  return (
    <section
      className="py-20 md:py-32 bg-[var(--landing-card-alt)]"
      aria-labelledby="testimonial-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {t.eyebrow}
          </p>
          <h2
            id="testimonial-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-[-0.02em] text-[var(--landing-heading)] whitespace-pre-line"
          >
            {t.title}
          </h2>
        </FadeIn>

        {/* Carousel */}
        <div className="mt-14 md:mt-20 max-w-3xl mx-auto relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-10 md:p-12 rounded-xl border border-[var(--landing-border)] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    size={16}
                    className="fill-[var(--landing-accent)] text-[var(--landing-accent)]"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-lg md:text-xl font-light text-[var(--landing-heading)] leading-relaxed">
                &ldquo;{review.quote}&rdquo;
              </blockquote>

              {/* Metric badge */}
              <div className="mt-6 inline-flex px-3 py-1 rounded-md bg-[var(--landing-accent-light)] text-xs font-medium text-[var(--landing-accent)]">
                {review.metric}
              </div>

              {/* Author */}
              <div className="mt-8 pt-6 border-t border-[var(--landing-border)] flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[var(--landing-accent-light)] flex items-center justify-center text-sm font-semibold text-[var(--landing-accent)]">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--landing-heading)]">
                    {review.name}
                  </p>
                  <p className="text-xs text-[var(--landing-body)]">
                    {review.company} · {review.role}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => goTo(current - 1, -1)}
              aria-label="이전 후기"
              className="w-10 h-10 rounded-full border border-[var(--landing-border)] flex items-center justify-center text-[var(--landing-body)] hover:text-[var(--landing-heading)] hover:border-[var(--landing-heading)] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > current ? 1 : -1)}
                  aria-label={`후기 ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "bg-[var(--landing-accent)] w-6"
                      : "bg-[var(--landing-border)] hover:bg-[var(--landing-body)]"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo(current + 1, 1)}
              aria-label="다음 후기"
              className="w-10 h-10 rounded-full border border-[var(--landing-border)] flex items-center justify-center text-[var(--landing-body)] hover:text-[var(--landing-heading)] hover:border-[var(--landing-heading)] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
