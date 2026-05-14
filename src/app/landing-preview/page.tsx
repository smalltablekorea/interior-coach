import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "랜딩 미리보기 | 인테리어코치",
  description: "랜딩페이지 미리보기 전용 라우트.",
  robots: { index: false, follow: false },
};

export default function LandingPreview() {
  return (
    <>
      <div className="sticky top-16 z-40 bg-amber-500/90 text-black text-center text-xs font-semibold py-1.5 backdrop-blur">
        🔍 랜딩 미리보기 — /landing-preview (검색엔진 노출 없음)
      </div>
      <LandingPage />
    </>
  );
}
