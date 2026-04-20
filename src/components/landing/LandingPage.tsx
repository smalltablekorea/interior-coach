import LandingNav from "./LandingNav";
import HeroSection from "./sections/HeroSection";
import PainPointSection from "./sections/PainPointSection";
import FeaturesSection from "./sections/FeaturesSection";
import CaseStudySection from "./sections/CaseStudySection";
import WhyUsSection from "./sections/WhyUsSection";
import PricingSection from "./sections/PricingSection";
import FAQSection from "./sections/FAQSection";
import FinalCTASection from "./sections/FinalCTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <LandingNav />
      <main>
        <HeroSection />
        <PainPointSection />
        <FeaturesSection />
        <CaseStudySection />
        <WhyUsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <footer className="py-10 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} 인테리어코치 · 스몰테이블디자인그룹
      </footer>
    </div>
  );
}
