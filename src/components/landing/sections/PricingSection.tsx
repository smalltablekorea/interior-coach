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
    <section
      id="pricing"
      className="py-20 md:py-32"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[var(--landing-accent)] tracking-wide uppercase mb-4">
            {p.eyebrow}
          </p>
          <h2
            id="pricing-heading"
            className="text-3xl md:text-[44px] font-light leading-tight tracking-tight text-[var(--landing-heading)]"
          >
            {p.title}
          </h2>
          <p className="mt-3 text-[var(--landing-body)]">{p.subtitle}</p>

          {/* Cycle toggle */}
          <div
            role="tablist"
            aria-label="결제 주기 선택"
            className="mt-8 inline-flex items-center gap-1 p-1 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card-alt)]"
          >
            <button
              role="tab"
              aria-selected={cycle === "monthly"}
              onClick={() => setCycle("monthly")}
              className={cn(
                "px-5 py-2.5 rounded-md text-sm font-medium transition-all",
                cycle === "monthly"
                  ? "bg-[var(--landing-accent)] text-white shadow-sm"
                  : "text-[var(--landing-body)] hover:text-[var(--landing-heading)]",
              )}
            >
              월 결제
            </button>
            <button
              role="tab"
              aria-selected={cycle === "yearly"}
              onClick={() => setCycle("yearly")}
              className={cn(
                "px-5 py-2.5 rounded-md text-sm font-medium transition-all",
                cycle === "yearly"
                  ? "bg-[var(--landing-accent)] text-white shadow-sm"
                  : "text-[var(--landing-body)] hover:text-[var(--landing-heading)]",
              )}
            >
              연 결제{" "}
              <span className="ml-1 text-[10px] opacity-70">−17%</span>
            </button>
          </div>
        </FadeIn>

        <div className="mt-14 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {p.plans.map((plan, i) => (
            <FadeIn
              key={plan.name}
              delay={i * 0.06}
              className={cn(
                "relative p-7 rounded-xl border flex flex-col transition-shadow duration-300",
                plan.highlight
                  ? "border-[var(--landing-accent)] bg-white shadow-[var(--landing-shadow-blue)_0px_30px_45px_-30px,var(--landing-shadow-black)_0px_18px_36px_-18px]"
                  : "border-[var(--landing-border)] bg-white hover:shadow-[var(--landing-shadow-ambient)_0px_15px_35px_0px]",
              )}
            >
              {plan.highlight && "badge" in plan && plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--landing-accent)] text-white text-[11px] font-bold shadow-sm">
                  {plan.badge}
                </span>
              )}

              <p className="text-sm font-semibold text-[var(--landing-heading)]">
                {plan.name}
              </p>
              <p className="mt-1 text-xs text-[var(--landing-body)]">
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-light tracking-tight text-[var(--landing-heading)]">
                  {formatPrice(plan.monthly, cycle)}
                </span>
                {plan.monthly !== null && plan.monthly > 0 && (
                  <span className="text-xs text-[var(--landing-body)]">
                    /월
                  </span>
                )}
              </div>
              {plan.yearly !== null &&
                plan.yearly > 0 &&
                cycle === "yearly" && (
                  <p className="mt-1 text-[11px] text-[var(--landing-body)]">
                    연 ₩{plan.yearly.toLocaleString("ko-KR")} 일시 결제
                  </p>
                )}

              <ul className="mt-7 space-y-3 flex-1">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-3 text-sm text-[var(--landing-heading)]"
                  >
                    <Check
                      size={16}
                      className="text-[var(--landing-accent)] mt-0.5 shrink-0"
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                aria-label={`${plan.name} 플랜 선택`}
                className={cn(
                  "mt-8 py-3 rounded-lg text-sm font-semibold text-center transition-colors",
                  plan.highlight
                    ? "bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-hover)] shadow-[0_2px_8px_rgba(0,168,94,0.25)]"
                    : "border border-[var(--landing-border)] text-[var(--landing-heading)] hover:bg-[var(--landing-card-alt)]",
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
