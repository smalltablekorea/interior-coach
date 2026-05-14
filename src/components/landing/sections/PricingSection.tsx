"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

const { pricing } = landingCopy;

function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-24 sm:py-32"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(83,58,253,0.04) 0%, transparent 70%)",
      }}
    >
      {/* header */}
      <div className="mx-auto max-w-3xl text-center px-6">
        <FadeIn>
          <p className="text-sm font-semibold tracking-wide uppercase text-[var(--landing-accent)]">
            {pricing.eyebrow}
          </p>
          <h2
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl leading-tight"
            style={{
              fontWeight: 300,
              color: "var(--landing-heading)",
            }}
          >
            {pricing.title}
          </h2>
          <p className="mt-4 text-base text-[var(--landing-body)]">
            {pricing.subtitle}
          </p>
        </FadeIn>

        {/* toggle */}
        <FadeIn delay={0.1}>
          <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-[var(--landing-border)] bg-[rgba(255,255,255,0.04)] backdrop-blur-[12px] px-1.5 py-1.5">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                "rounded-full px-5 py-2 text-sm transition-all",
                !yearly
                  ? "bg-[var(--landing-accent)] text-white shadow-sm"
                  : "text-[var(--landing-body)] hover:text-[var(--landing-heading)]"
              )}
              style={{ fontWeight: 400 }}
            >
              월간
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                "rounded-full px-5 py-2 text-sm transition-all",
                yearly
                  ? "bg-[var(--landing-accent)] text-white shadow-sm"
                  : "text-[var(--landing-body)] hover:text-[var(--landing-heading)]"
              )}
              style={{ fontWeight: 400 }}
            >
              연간&nbsp;
              <span className="text-xs opacity-80">2개월 무료</span>
            </button>
          </div>
        </FadeIn>
      </div>

      {/* cards */}
      <div className="mx-auto mt-14 grid max-w-4xl gap-8 px-6 sm:grid-cols-2">
        {pricing.plans.map((plan, i) => {
          const price = yearly ? plan.yearly : plan.monthly;
          const isHighlight = plan.highlight;

          return (
            <FadeIn key={plan.name} delay={0.1 + i * 0.1}>
              <div
                className={cn(
                  "relative flex flex-col rounded-xl",
                  isHighlight ? "shadow-xl" : "shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "relative flex flex-1 flex-col rounded-xl px-7 py-8 bg-[rgba(255,255,255,0.04)] backdrop-blur-[12px] border",
                    isHighlight
                      ? "border-[var(--landing-accent)] emerald-glow"
                      : "border-[var(--landing-border)]",
                  )}
                >
                  {/* Recommended / badge */}
                  {isHighlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className="inline-flex items-center rounded-full bg-[var(--landing-accent)] px-4 py-1 text-xs font-bold text-black"
                        style={{
                          boxShadow: "0 4px 14px rgba(0,196,113,0.35)",
                        }}
                      >
                        {plan.badge ?? "Recommended"}
                      </span>
                    </div>
                  )}

                  {/* plan name */}
                  <h3
                    className="text-lg"
                    style={{
                      fontWeight: 300,
                      color: "var(--landing-heading)",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--landing-body)]">
                    {plan.tagline}
                  </p>

                  {/* price */}
                  <div className="mt-6 flex items-baseline gap-1">
                    {price !== null ? (
                      <>
                        <span
                          className="text-4xl tracking-tight"
                          style={{
                            fontWeight: 300,
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--landing-heading)",
                          }}
                        >
                          ₩{formatPrice(price)}
                        </span>
                        <span className="text-sm text-[var(--landing-body)]">
                          /{yearly ? "년" : "월"}
                        </span>
                      </>
                    ) : (
                      <span
                        className="text-4xl tracking-tight"
                        style={{
                          fontWeight: 300,
                          color: "var(--landing-heading)",
                        }}
                      >
                        맞춤 견적
                      </span>
                    )}
                  </div>
                  {yearly && plan.monthly !== null && plan.yearly !== null && plan.yearly > 0 && (
                    <p className="mt-2 text-xs text-[var(--landing-body)]">
                      월 환산 ₩{formatPrice(Math.round(plan.yearly / 12))}
                      {" · "}
                      <span className="text-[var(--landing-accent)] font-medium">
                        연 ₩{formatPrice(plan.monthly * 12 - plan.yearly)} 절약
                      </span>
                    </p>
                  )}

                  {/* feature list */}
                  <ul className="mt-8 flex-1 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check
                          className={cn(
                            "mt-0.5 shrink-0",
                            isHighlight
                              ? "text-[var(--landing-accent)]"
                              : "text-[var(--landing-green)]"
                          )}
                          size={20}
                          strokeWidth={2.5}
                        />
                        <span className="text-sm text-[var(--landing-body)]">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={cn(
                      "mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors",
                      isHighlight
                        ? "bg-[var(--landing-accent)] text-black hover:bg-[var(--landing-accent-hover)]"
                        : "border border-[var(--landing-accent)] text-[var(--landing-accent)] hover:bg-[var(--landing-accent)] hover:text-black",
                    )}
                    style={{ borderRadius: 8 }}
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
