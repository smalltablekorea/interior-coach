"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

// Part B: 4티어 → 3티어로 개편. 플랜 자체가 주기를 의미(월간/연간 별도 플랜)이므로 기존 cycle 토글 제거.

type Plan = (typeof landingCopy.pricing.plans)[number];

function priceLabel(plan: Plan): { primary: string; suffix: string; sub?: string } {
  if (plan.monthly === 0 && plan.yearly === 0) {
    return { primary: "무료", suffix: "" };
  }
  if (plan.monthly !== null && plan.monthly > 0) {
    return {
      primary: `₩${plan.monthly.toLocaleString("ko-KR")}`,
      suffix: "/월",
      sub: "매월 결제 · 언제든 해지",
    };
  }
  if (plan.yearly !== null && plan.yearly > 0) {
    const monthlyEq = Math.round(plan.yearly / 12);
    return {
      primary: `₩${monthlyEq.toLocaleString("ko-KR")}`,
      suffix: "/월",
      sub: `연 ₩${plan.yearly.toLocaleString("ko-KR")} 일시 결제 · 2개월 무료`,
    };
  }
  return { primary: "맞춤 견적", suffix: "" };
}

export default function PricingSection() {
  const p = landingCopy.pricing;

  return (
    <section
      id="pricing"
      className="py-16 md:py-30 bg-white/[0.015]"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">{p.eyebrow}</p>
          <h2
            id="pricing-heading"
            className="text-3xl md:text-5xl font-black leading-tight"
          >
            {p.title}
          </h2>
          <p className="mt-3 text-[var(--muted)]">{p.subtitle}</p>
        </FadeIn>

        <div className="mt-12 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {p.plans.map((plan, i) => {
            const price = priceLabel(plan);
            return (
              <FadeIn
                key={plan.name}
                delay={i * 0.08}
                className={cn(
                  "relative p-6 rounded-3xl border flex flex-col",
                  plan.highlight
                    ? "border-[var(--green)]/60 bg-[var(--green)]/[0.06] shadow-lg shadow-[var(--green)]/10"
                    : "border-[var(--border)] bg-[var(--sidebar)]",
                )}
              >
                {plan.highlight && "badge" in plan && plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--green)] text-black text-[11px] font-bold">
                    {plan.badge}
                  </span>
                )}

                <p className="text-sm font-semibold text-[var(--muted)]">{plan.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{plan.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-black">{price.primary}</span>
                  {price.suffix && (
                    <span className="text-xs text-[var(--muted)]">{price.suffix}</span>
                  )}
                </div>
                {price.sub && (
                  <p className="mt-1 text-[11px] text-[var(--muted)]">{price.sub}</p>
                )}

                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-sm text-[var(--foreground)]"
                    >
                      <Check size={16} className="text-[var(--green)] mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  aria-label={`${plan.name} 플랜 선택`}
                  className={cn(
                    "mt-7 py-3 rounded-xl text-sm font-bold text-center transition-opacity",
                    plan.highlight
                      ? "bg-[var(--green)] text-black hover:opacity-90"
                      : "border border-[var(--border)] hover:bg-white/[0.04]",
                  )}
                >
                  {plan.ctaLabel}
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
