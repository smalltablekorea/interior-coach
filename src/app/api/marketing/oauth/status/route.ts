import { NextResponse } from "next/server";

/**
 * 마케팅 채널별 OAuth 키 설정 여부 진단.
 * 채널 페이지에서 '연결' 버튼 활성/비활성 결정에 사용.
 *
 * 응답:
 *   {
 *     meta: false,      // META_APP_ID + META_APP_SECRET
 *     google: true,     // GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (재사용)
 *     naverBlog: true,  // OAuth 불요 — URL 입력만
 *     adlog: true,      // OAuth 불요 — 계정 로그인
 *     sms: hasSolapi,   // SOLAPI_API_KEY 존재
 *   }
 */
export async function GET() {
  const meta = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const solapi = Boolean(process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET);

  return NextResponse.json({
    meta,
    google,
    threads: meta,
    instagram: meta,
    metaAds: meta,
    youtube: google,
    naverBlog: true, // 자체 URL 입력 (OAuth 불요)
    adlog: true, // 계정 로그인 (OAuth 불요)
    sms: solapi,
    missing: [
      ...(!meta ? ["META_APP_ID, META_APP_SECRET"] : []),
      ...(!google ? ["GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"] : []),
      ...(!solapi ? ["SOLAPI_API_KEY, SOLAPI_API_SECRET"] : []),
    ],
  });
}
