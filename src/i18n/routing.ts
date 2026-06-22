import { defineRouting } from "next-intl/routing";

/**
 * i18n routing 정의 — next-intl 의 단일 출처.
 *
 * 핵심 결정:
 *   - localePrefix: "as-needed"
 *       한국어(default)는 prefix 없이 기존 URL 유지(/sites, /daily-logs, …).
 *       영어만 /en/sites 같은 prefix 가 붙는다.
 *       운영 중 공유 링크(/d/{token}, /portal/...)와 외부 링크 호환을 보존하기 위함.
 *   - locales: ["ko", "en"]
 *   - defaultLocale: "ko" — 미지원·미감지 시 폴백.
 *
 * 이 파일이 단일 출처:
 *   - middleware (createMiddleware)
 *   - request.ts (locale 결정)
 *   - 네비게이션 헬퍼(향후 src/i18n/navigation.ts 가 필요해질 때)
 */
export const routing = defineRouting({
  locales: ["ko", "en"] as const,
  defaultLocale: "ko",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export const SUPPORTED_LOCALES = routing.locales;
export const DEFAULT_LOCALE = routing.defaultLocale;

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === "string" && (routing.locales as readonly string[]).includes(value);
}
