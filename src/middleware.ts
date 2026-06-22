import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing, SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/routing";

// ─────────────────────────────────────────────────────────────────────────────
// next-intl 미들웨어 — 한국어는 prefix 없이 (as-needed).
// 우리 자체 인증 미들웨어는 "정규 경로(locale prefix 제거)" 기준으로 판단한다.
// ─────────────────────────────────────────────────────────────────────────────
const intlMiddleware = createIntlMiddleware(routing);

/**
 * 경로에서 선두 locale prefix 를 분리해 "정규 경로" + 감지된 locale 을 반환.
 *   /en/sites/abc        → { canonical: "/sites/abc", locale: "en" }
 *   /sites/abc           → { canonical: "/sites/abc", locale: "ko" (default) }
 *   /en                  → { canonical: "/",         locale: "en" }
 *
 * 인증·공개경로 비교는 canonical 로, 리다이렉트 URL 생성은 locale 로 수행해
 * /en/sites 에서 막힌 사용자가 /en/auth/login 으로 가도록 한다.
 */
function resolvePath(pathname: string): { canonical: string; locale: Locale } {
  for (const loc of SUPPORTED_LOCALES) {
    if (pathname === `/${loc}`) return { canonical: "/", locale: loc };
    if (pathname.startsWith(`/${loc}/`)) {
      return { canonical: pathname.slice(loc.length + 1), locale: loc };
    }
  }
  return { canonical: pathname, locale: DEFAULT_LOCALE };
}

/**
 * 정규 경로에 locale prefix 를 다시 입혀 리다이렉트 대상 URL 을 만든다.
 *   as-needed 정책: 기본 locale("ko") 은 prefix 없이 그대로,
 *   그 외 locale 은 /{locale}{canonical} 형태.
 */
function withLocale(canonical: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return canonical;
  return canonical === "/" ? `/${locale}` : `/${locale}${canonical}`;
}

// 공개 페이지 — 로그인 없이 접근 가능. 정규 경로 기준.
// startsWith / 정확 매칭을 명시적으로 구분.
const PUBLIC_PAGES: { prefix?: string; exact?: string }[] = [
  { exact: "/" },
  { prefix: "/auth" },
  { prefix: "/portal" },        // 고객 포탈 (공개 토큰)
  { prefix: "/d/" },            // 공유 토큰 (/d/{token})
  { prefix: "/daily-logs/" },   // /daily-logs/{token} 같은 공개 토큰 페이지
  { prefix: "/pricing" },
  { prefix: "/qna" },
  { prefix: "/terms" },
  { prefix: "/refund-policy" },
  { prefix: "/demo-request" },
  { prefix: "/specbook" },
  { prefix: "/payment/fail" },
  { prefix: "/landing-preview" },
];

// 공개 API — 인증 우회. cron / 공개 토큰 / 외부 트래킹 / OAuth 콜백 등.
const PUBLIC_APIS: { prefix?: string; exact?: string }[] = [
  { prefix: "/api/auth/" },                       // BetterAuth + Kakao OAuth 콜백
  { prefix: "/api/portal/" },
  { prefix: "/api/qna/" },
  { prefix: "/api/v1/" },
  { prefix: "/api/cron/" },                       // Vercel Cron — Bearer CRON_SECRET 검증 별도
  { prefix: "/api/track-event/" },
  { exact: "/api/track-event" },
  { prefix: "/api/demo-request/" },
  { exact: "/api/demo-request" },
  { prefix: "/api/public/" },
  { prefix: "/api/notifications/process" },
  { prefix: "/api/notifications/check-payments" },
  { prefix: "/api/notifications/schedule-reminder" },
  { prefix: "/api/billing/cron" },
  { prefix: "/api/trial/nudge" },
];

function matchesAny(path: string, rules: { prefix?: string; exact?: string }[]): boolean {
  for (const r of rules) {
    if (r.exact && path === r.exact) return true;
    if (r.prefix) {
      const p = r.prefix;
      if (p.endsWith("/")) {
        // 명시적으로 슬래시로 끝나는 규칙(예: "/d/", "/daily-logs/") — 기존 동작 그대로.
        if (path.startsWith(p)) return true;
      } else {
        // 슬래시 경계 매칭 — "/auth" 가 "/authadmin" 같은 경로에 잘못 걸리지 않게.
        if (path === p) return true;
        if (path.startsWith(p + "/")) return true;
      }
    }
  }
  return false;
}

// 정적 에셋·내부 next 경로는 모든 처리 skip.
function isInternalAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  return /\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$/i.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) 정적 에셋: 통과
  if (isInternalAsset(pathname)) return NextResponse.next();

  // 2) 정규 경로 + 감지된 locale 분리 (리다이렉트 시 locale 보존을 위해 둘 다 보관)
  const { canonical, locale } = resolvePath(pathname);

  // 3) 공개 API 는 인증 게이트·next-intl 둘 다 우회. (cron / OAuth 콜백 / 공개 토큰)
  //    API 는 URL 기반 locale 라우팅이 필요 없음.
  if (canonical.startsWith("/api/")) {
    if (matchesAny(canonical, PUBLIC_APIS)) {
      return NextResponse.next();
    }
    // 보호 API — BetterAuth 세션 쿠키만 체크하고 통과 (i18n 처리 안 함).
    const sessionCookie =
      request.cookies.get("__Secure-better-auth.session_token") ||
      request.cookies.get("better-auth.session_token");
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // 4) 페이지 요청 — next-intl 이 먼저 locale 결정/리다이렉트 처리.
  //    공개 페이지든 보호 페이지든 next-intl 의 응답을 받아서 그 위에 인증 게이트 적용.
  const intlResponse = intlMiddleware(request);

  // 4-a) 공개 페이지: next-intl 응답을 그대로 반환
  if (matchesAny(canonical, PUBLIC_PAGES)) {
    return intlResponse;
  }

  // 4-b) 보호 페이지: BetterAuth 세션 쿠키 확인
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  if (!sessionCookie?.value) {
    // 로그인으로 리다이렉트 — locale 유지(/en → /en/auth/login, /ko/default → /auth/login).
    // callbackUrl 은 원본 pathname 그대로 두어 로그인 후 정확한 자리로 복귀.
    const loginUrl = new URL(withLocale("/auth/login", locale), request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5) 워크스페이스 설정 페이지는 항상 접근 허용
  if (canonical.startsWith("/workspace/")) {
    return intlResponse;
  }

  // 6) has_workspace 쿠키 게이트 (페이지 요청만). 셋업 페이지도 locale 유지.
  const hasWorkspace = request.cookies.get("has_workspace")?.value === "1";
  if (!hasWorkspace) {
    const setupUrl = new URL(withLocale("/workspace/setup", locale), request.url);
    return NextResponse.redirect(setupUrl);
  }

  return intlResponse;
}

export const config = {
  // 모든 경로를 받되 — 진짜 제외는 함수 내부 isInternalAsset/PUBLIC_* 화이트리스트로 한다.
  // 정규식 matcher 로 prefix 경로(/en/...)를 거르는 방식은 깨진다.
  // 단, _next 내부 라우트와 정적 파일은 미들웨어 호출 자체를 막아 비용 절감.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)).*)"],
};
