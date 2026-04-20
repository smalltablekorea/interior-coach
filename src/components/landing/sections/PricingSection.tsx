"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingCopy } from "@/content/landing";
import FadeIn from "../FadeIn";

type Cycle = "monthly" | "yearly";

function formatPrice(n: number | null, cycle: Cycle): string {
  if (n === null) return "맞춤 견적";
  if (n === 0) return "무료";
  const base = cycle === "monthly" ? n : Math.round(n / 12);
  return `₩${base.toLocaleString("ko-KR")}`;
}

export default function PricingSection() {
  const p = landingCopy.pricing;
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <section id="pricing" className="py-16 md:py-30 bg-white/[0.015]" aria-labelledby="pricing-heading">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            {p.eyebrow}
          </p>
          <h2
            id="pricing-heading"
            className="text-3xl md:text-5xl font-black leading-tight"
          >
            {p.title}
          </h2>
          <p className="mt-3 text-[var(--muted)]">{p.subtitle}</p>

          {/* 월/연 토글 */}
          <div
            role="tablist"
            aria-label="결제 주기 선택"
            className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border border-[var(--border)] bg-[var(--sidebar)]"
          >
            <button
              role="tab"
              aria-selected={cycle === "monthly"}
              onClick={() => setCycle("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-colors",
                cycle === "monthly"
                  ? "bg-[var(--green)] text-black"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              월 결제
            </button>
            <button
              role="tab"
              aria-selected={cycle === "yearly"}
              onClick={() => setCycle("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-colors",
                cycle === "yearly"
                  ? "bg-[var(--green)] text-black"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              연 결제 <span className="ml-1 text-[10px] opacity-70">−17%</span>
            </button>
          </div>
        </FadeIn>

        <div className="mt-12 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {p.plans.map((plan, i) => (
            <FadeIn
              key={plan.name}
              delay={i * 0.06}
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

              <p className="text-sm font-semibold text-[var(--muted)]">
                {plan.name}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{plan.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-black">
                  {formatPrice(plan.monthly, cycle)}
                </span>
                {plan.monthly !== null && plan.monthly > 0 && (
                  <span className="text-xs text-[var(--muted)]">/월</span>
                )}
              </div>
              {plan.yearly !== null &&
                plan.yearly > 0 &&
                cycle === "yearly" && (
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    연 ₩{plan.yearly.toLocaleString("ko-KR")} 일시 결제
                  </p>
                )}

              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-[var(--foreground)]"
                  >
                    <Check
                      size={16}
                      className="text-[var(--green)] mt-0.5 shrink-0"
                    />
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
          ))}
        </div>
      </div>
    </section>
  );
}
