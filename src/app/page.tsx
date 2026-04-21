import type { Metadata } from "next";
import Script from "next/script";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "인테리어코치 | 인테리어 업체 현장 운영 올인원 SaaS",
  description:
    "현장 5개, 카톡방 50개, 엑셀 100장 — 이제 한 곳에서. 공정 매니저·현장 톡방·견적·계약·정산을 통합 관리하는 인테리어 업체 전용 SaaS.",
  openGraph: {
    title: "인테리어코치 | 인테리어 업체 현장 운영 올인원 SaaS",
    description:
      "공정 매니저·현장 톡방·견적·계약·정산을 한 화면에서 관리하세요. 14일 무료, 카드 등록 불필요.",
    images: ["/landing/og-hero.png"],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "인테리어코치",
    description: "현장 운영 올인원 SaaS",
    images: ["/landing/og-hero.png"],
  },
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "인테리어코치",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "인테리어 업체를 위한 현장 운영 올인원 SaaS. 공정·견적·계약·정산 통합 관리.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "KRW",
    lowPrice: "0",
    highPrice: "990000",
    offerCount: "3",
  },
  creator: {
    "@type": "Organization",
    name: "스몰테이블디자인그룹",
    url: "https://interiorcoach.kr",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function Page() {
  return (
    <>
      <Script
        id="json-ld-landing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
