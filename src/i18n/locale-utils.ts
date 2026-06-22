import { DEFAULT_LOCALE, type Locale } from "./routing";

/**
 * 다국어 마스터 데이터에서 locale 에 맞는 값을 고른다.
 *   - 영어 컬럼이 null/빈 문자열이면 한국어(기본) 값으로 폴백
 *   - 기본 컬럼(ko)도 비어 있으면 마지막 폴백 인자(있다면) → 빈 문자열
 *
 * 사용 예:
 *   pickLocale(locale, { ko: row.name, en: row.nameEn })
 *   pickLocale(locale, { ko: row.itemName, en: row.itemNameEn }, "(미지정)")
 */
export function pickLocale(
  locale: Locale,
  values: { ko: string | null | undefined; en: string | null | undefined },
  fallback = "",
): string {
  const en = (values.en ?? "").trim();
  const ko = (values.ko ?? "").trim();
  if (locale === "en" && en) return en;
  if (ko) return ko;
  if (en) return en;
  return fallback;
}

/**
 * 한 객체에서 영어 필드 여러 개를 한꺼번에 골라 평탄화.
 *   pickLocaleFields("en", row, [
 *     ["name", "nameEn"],
 *     ["category", "categoryEn"],
 *   ])
 *   → { name: <en or ko>, category: <en or ko> }
 *
 * 마스터 데이터 API 응답을 한 줄로 i18n 처리할 때 사용.
 */
export function pickLocaleFields<T extends Record<string, unknown>>(
  locale: Locale,
  row: T,
  pairs: Array<[keyof T & string, keyof T & string]>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [koKey, enKey] of pairs) {
    out[koKey] = pickLocale(locale, {
      ko: row[koKey] as string | null | undefined,
      en: row[enKey] as string | null | undefined,
    });
  }
  return out;
}

/**
 * 정적 코드 매핑 — DB 컬럼이 아닌 코드값(예: 공종/상태/등급/단위/지역)을
 * locale 에 맞는 표시 라벨로 변환.
 *
 * 매핑이 없는 키는 원본 그대로 반환(번역 누락이 빈 문자열로 사라지지 않게).
 */
export function translateCode(
  locale: Locale,
  map: Readonly<Record<string, { ko: string; en: string }>>,
  code: string | null | undefined,
): string {
  if (!code) return "";
  const entry = map[code];
  if (!entry) return code;
  return locale === "en" ? entry.en : entry.ko;
}

export { DEFAULT_LOCALE };
