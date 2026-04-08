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

  // 워크스페이스 설정 페이지와 API는 항상 접근 허용
  if (
    pathname.startsWith("/workspace/") ||
    pathname.startsWith("/api/workspace")
  ) {
    return NextResponse.next();
  }

  // 워크스페이스 미설정 사용자 체크 (쿠키 기반)
  // 클라이언트에서 설정하는 쿠키로 확인 (서버 DB 조회 없이)
  const hasWorkspace = request.cookies.get("has_workspace")?.value === "1";
  if (!hasWorkspace && !pathname.startsWith("/api/")) {
    // API가 아닌 페이지 요청인 경우에만 리다이렉트
    // 처음 로그인 후에는 클라이언트에서 워크스페이스 체크를 수행
    // has_workspace 쿠키가 없으면 workspace setup으로 리다이렉트
    const setupUrl = new URL("/workspace/setup", request.url);
    return NextResponse.redirect(setupUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 제외: auth 라우트, 정적 파일, 포탈 (공개), favicon, 랜딩/가격 페이지
    "/((?!_next/static|_next/image|favicon.ico|auth|portal|pricing|qna|terms|refund-policy|api/auth|api/portal|api/qna|api/v1).*)",
  ],
};
