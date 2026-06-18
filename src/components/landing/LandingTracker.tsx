"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/landing-tracker";

/**
 * 랜딩페이지 마운트 시 page_view 1회 전송.
 * server component인 LandingPage 안에 client boundary로 mount.
 * 마케팅 깔때기/유입 출처 측정용.
 */
export default function LandingTracker(): null {
  useEffect(() => {
    trackPageView();
  }, []);
  return null;
}
