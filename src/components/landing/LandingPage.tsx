import LandingNav from "./LandingNav";
import LandingTracker from "./LandingTracker";
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
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function LandingPage() {
  const t = await getTranslations("landing");
  return (
    <div className="landing-premium min-h-screen">
      <LandingTracker />
      <ExpiringBlock until="2026-08-01T00:00:00+09:00">
        <div className="bg-[var(--green)] text-black text-center text-sm py-2 px-4 font-medium">
          {t("freePeriodBanner")}
          <Link href="/auth/signup" className="underline ml-1 font-semibold">{t("freePeriodCta")}</Link>
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
