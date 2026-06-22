/**
 * locale-aware 포매터 헬퍼.
 *
 * 사용:
 *   - 클라이언트 컴포넌트: useFormatter() / useLocale() 가 우선. 이 모듈은
 *     useFormatter 가 안 닿는 plain 함수 (예: 인쇄용 HTML 생성, 이메일 본문) 용 fallback.
 *   - 서버 컴포넌트: getFormatter() 가 우선. 이 모듈은 동일 fallback 역할.
 *
 * 기존 src/lib/utils.ts 의 fmt / fmtDate / fmtKrw 는 한국 고정. 점진적으로 이 모듈로
 * 교체. (한 화면씩 마이그레이션할 때 import 만 갈아끼우면 됨.)
 */

/** 통화 — locale 기본:
 *   - ko → KRW(₩), 소수점 없음
 *   - en → USD($) — 환율 미적용. 단순 표시 변환 X.
 *     ★ 실제 결제·청구 금액은 절대 변환하면 안 됨. 표시용으로만 사용.
 */
export function formatCurrency(
  amount: number,
  locale: string = "ko",
  currency?: string,
): string {
  const cur = currency || (locale.startsWith("ko") ? "KRW" : "USD");
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: cur === "KRW" ? 0 : 2,
    }).format(amount);
  } catch {
    // 잘못된 locale 폴백
    return new Intl.NumberFormat("ko", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

/** 숫자 — 천 단위 구분자 */
export function formatNumber(value: number, locale: string = "ko"): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("ko").format(value);
  }
}

/** 날짜 — short(YYYY.MM.DD or M/D/YYYY) / long(2026년 6월 23일 or June 23, 2026) */
export function formatDate(
  date: string | Date | null | undefined,
  locale: string = "ko",
  style: "short" | "long" = "short",
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === "string" ? date : "";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: style === "long" ? "long" : "2-digit",
      day: style === "long" ? "numeric" : "2-digit",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("ko", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }
}

/** 날짜 + 시간 (분 단위) */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale: string = "ko",
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === "string" ? date : "";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("ko", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
}
