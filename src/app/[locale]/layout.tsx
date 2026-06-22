// next-intl 의 정공법 — 모든 페이지가 이 [locale] 세그먼트 아래에 들어가고,
// 이 레이아웃이 setRequestLocale 로 RSC 트리에 locale 을 못박는다.
// 동적 렌더링은 root layout 의 dynamic="force-dynamic" 으로 통일.
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES, type Locale, isSupportedLocale } from "@/i18n/routing";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale as Locale);
  return children;
}
