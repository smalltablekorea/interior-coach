// Force dynamic rendering for all pages — this SaaS app uses auth/hooks on every page
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import InAppBrowserBanner from "@/components/InAppBrowserBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://interiorcoach.kr",
  ),
  title: {
    default: "인테리어코치 — 인테리어 업체 현장 운영 올인원 SaaS",
    template: "%s | 인테리어코치",
  },
  description:
    "현장 5개, 카톡방 50개, 엑셀 100장 — 이제 한 곳에서. 공정·견적·계약·정산을 통합 관리하는 인테리어 업체 전용 SaaS. 14일 무료 체험.",
  keywords: [
    "인테리어",
    "인테리어 업체",
    "현장 관리",
    "견적 관리",
    "인테리어 SaaS",
    "시공 관리",
    "인테리어코치",
    "공정 관리",
    "인테리어 프로그램",
    "인테리어 소프트웨어",
  ],
  authors: [{ name: "스몰테이블디자인그룹" }],
  creator: "스몰테이블디자인그룹",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "인테리어코치",
    title: "인테리어코치 — 인테리어 업체 현장 운영 올인원 SaaS",
    description:
      "공정 매니저·현장 톡방·견적·계약·정산을 한 화면에서 관리하세요. 14일 무료, 카드 등록 불필요.",
    images: ["/landing/og-hero.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "인테리어코치",
    description: "인테리어 업체 현장 운영 올인원 SaaS",
    images: ["/landing/og-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <InAppBrowserBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
