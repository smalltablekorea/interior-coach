import type { Metadata } from "next";
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
};

export default function Page() {
  return <LandingPage />;
}
