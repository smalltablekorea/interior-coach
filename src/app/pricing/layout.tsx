import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제",
  description:
    "인테리어코치 요금제 비교. 무료 플랜부터 프리미엄까지 — 14일 무료 체험, 카드 등록 불필요. 인테리어 업체 맞춤 가격.",
  openGraph: {
    title: "인테리어코치 요금제",
    description:
      "무료 플랜부터 프리미엄까지 — 인테리어 업체 규모에 맞는 합리적 요금제.",
    images: ["/landing/og-hero.png"],
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
