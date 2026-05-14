import { NextResponse } from "next/server";

/**
 * 활성화된 소셜 provider 목록.
 * Vercel env(GOOGLE_CLIENT_ID/SECRET, KAKAO_CLIENT_ID/SECRET)가 설정된 provider만 true.
 * 로그인/회원가입 페이지가 이 결과로 버튼 노출 여부를 결정한다.
 */
export async function GET() {
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const kakao = Boolean(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);
  return NextResponse.json({ google, kakao });
}
