import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "요금제",
  description:
    "인테리어코치 요금제 비교. 무료 플랜부터 프리미엄까지 — 14일 무료 체험, 카드 등록 불필요. 인테리어 업체 맞춤 가격.",
  openGraph: {
    title: "인테리어코치 요금제",
    description:
      "무료 플랜부터 프리미엄까지 — 인테리어 업체 규모에 맞는 합리적 요금제. 14일 무료 체험.",
    images: ["/landing/og-hero.png"],
  },
  alternates: {
    canonical: "/pricing",
  },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "인테리어코치",
  description:
    "인테리어 업체를 위한 현장 운영 올인원 SaaS. 공정·견적·계약·정산 통합 관리.",
  brand: {
    "@type": "Organization",
    name: "스몰테이블디자인그룹",
  },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "KRW",
      description: "현장 3개, 고객 20명, 기본 공정 관리",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "149000",
      priceCurrency: "KRW",
      priceValidUntil: "2027-12-31",
      description: "현장 15개, 공종별 정산, 견적서 템플릿",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "299000",
      priceCurrency: "KRW",
      priceValidUntil: "2027-12-31",
      description:
        "현장/고객 무제한, 마케팅 자동화, AI 세무, 전자계약",
      availability: "https://schema.org/InStock",
    },
  ],
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="json-ld-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
