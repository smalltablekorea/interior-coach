import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isSupportedLocale } from "./routing";

/**
 * next-intl 의 서버측 i18n 설정.
 *   1) URL prefix 가 있으면 그 locale 사용 (/en/sites → "en")
 *   2) 없으면 NEXT_LOCALE 쿠키 확인 (LanguageToggle 이 굽는 값)
 *   3) 둘 다 없으면 defaultLocale("ko")
 *
 * 폴더 [locale]/ 마이그레이션 전이라 한국어 URL 은 prefix 없이 들어옴.
 * 영어로 전환하면 URL 은 그대로 두고 쿠키만 바꿔, 다음 SSR 부터 영어 messages.
 *
 * messages 파일 누락 시 default 로 폴백 — 빌드 죽지 않게.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const fromUrl = await requestLocale;
  let locale: string;
  if (isSupportedLocale(fromUrl)) {
    locale = fromUrl;
  } else {
    const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
    locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  }

  let messages: Record<string, unknown>;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default;
  }

  return { locale, messages };
});
