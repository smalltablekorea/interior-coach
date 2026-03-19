/** 금액 포맷: 1,234,567원 */
export function fmt(n: number | null | undefined): string {
  if (n == null) return "0원";
  return n.toLocaleString("ko-KR") + "원";
}

/** 금액 포맷 (만원 단위): 123만 */
export function fmtM(n: number | null | undefined): string {
  if (n == null) return "0만";
  return Math.round(n / 10000) + "만";
}

/** 금액 포맷 (축약): 1.2억 또는 1,200만 */
export function fmtShort(n: number | null | undefined): string {
  if (n == null) return "0";
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return Math.round(n / 10000).toLocaleString("ko-KR") + "만";
  return n.toLocaleString("ko-KR");
}

/** 날짜 포맷: 2026.03.17 */
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\. /g, ".").replace(/\.$/, "");
}

/** 클래스네임 병합 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
