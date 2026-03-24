import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 랜딩 페이지는 공개
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Better Auth session cookie 확인 (HTTPS에서는 __Secure- 접두사가 붙음)
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  if (!sessionCookie?.value) {
    // API 요청은 401 반환
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 },
      );
    }

    // 페이지 요청은 로그인으로 리다이렉트
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 제외: auth 라우트, 정적 파일, 포탈 (공개), favicon, 랜딩/가격 페이지
    "/((?!_next/static|_next/image|favicon.ico|auth|portal|pricing|api/auth|api/portal|api/v1|api/debug).*)",
  ],
};
