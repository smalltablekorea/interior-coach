/**
 * 클라이언트 포털 URL 빌더.
 *
 * env 의존성 없이 요청 헤더에서 base URL 추출 — dev/prod 모두 동작.
 */

export function getBaseUrl(headers: Headers): string {
  const host = headers.get("host") || "localhost:3000";
  const proto =
    headers.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export function buildPortalUploadUrl(headers: Headers, token: string): string {
  return `${getBaseUrl(headers)}/portal/agency/${token}/upload`;
}
