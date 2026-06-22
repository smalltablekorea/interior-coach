import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isSupportedLocale } from "./routing";

/**
 * next-intl 의 서버측 i18n 설정.
 *   - requestLocale: 미들웨어가 URL prefix 로부터 추론한 locale
 *   - 미지원 locale 은 defaultLocale("ko") 로 폴백
 *   - messages: messages/{locale}.json 동적 import
 *
 * messages 파일이 누락된 경우(예: 빌드 시 신규 locale 추가)에도
 * 빌드가 죽지 않도록 default locale 로 한 번 더 폴백한다.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;

  let messages: Record<string, unknown>;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default;
  }

  return { locale, messages };
});
