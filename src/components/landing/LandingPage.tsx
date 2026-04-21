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

export default function LandingPage() {
  return (
    <div className="landing-premium min-h-screen">
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
