import type { Metadata } from "next";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import LandingPage from "@/components/landing/LandingPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.meta");
  const tCommon = await getTranslations("common");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tCommon("appName"),
      description: t("twitterDescription"),
    },
    alternates: { canonical: "/" },
  };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.interiorcoach.co.kr";

export default async function Page() {
  const t = await getTranslations("landing.meta");
  const tCommon = await getTranslations("common");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tCommon("appName"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: t("jsonLdDescription"),
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
      url: SITE_URL,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
  };

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
