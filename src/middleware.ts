import { NextResponse } from "next/server";

// TODO: DB 연결 후 인증 미들웨어 다시 활성화
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth).*)",
  ],
};
