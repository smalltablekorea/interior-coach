import LandingNav from "./LandingNav";
import HeroSection from "./sections/HeroSection";
import PainPointSection from "./sections/PainPointSection";
import FeaturesSection from "./sections/FeaturesSection";
import CaseStudySection from "./sections/CaseStudySection";
import WhyUsSection from "./sections/WhyUsSection";
import PricingSection from "./sections/PricingSection";
import TestimonialSection from "./sections/TestimonialSection";
import FAQSection from "./sections/FAQSection";
import FinalCTASection from "./sections/FinalCTASection";
import FooterSection from "./sections/FooterSection";
import { ExpiringBlock } from "@/components/util/ExpiringBlock";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing-premium min-h-screen">
      <ExpiringBlock until="2026-08-01T00:00:00+09:00">
        <div className="bg-[var(--green)] text-black text-center text-sm py-2 px-4 font-medium">
          🎉 7월 31일까지 전체 기능 무료 — 카드 등록 없이 가입만 하면 모든 Pro 기능 사용 가능 ·
          <Link href="/auth/signup" className="underline ml-1 font-semibold">지금 시작하기 →</Link>
        </div>
      </ExpiringBlock>
      <LandingNav />
      <main>
        <HeroSection />
        <PainPointSection />
        <FeaturesSection />
        <CaseStudySection />
        <WhyUsSection />
        <TestimonialSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <FooterSection />
    </div>
  );
}
