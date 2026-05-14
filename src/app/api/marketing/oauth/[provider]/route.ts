import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/marketing-oauth/oauth-utils";
import { requireWorkspaceAuth } from "@/lib/api-auth";

const VALID_COMBINATIONS: Record<string, string[]> = {
  meta: ["threads", "instagram", "meta_ads"],
  google: ["youtube"],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) {
    return NextResponse.redirect(
      new URL("/login", request.nextUrl.origin)
    );
  }

  const { provider } = await params;
  const channel = request.nextUrl.searchParams.get("channel");

  if (!channel) {
    return NextResponse.json(
      { error: "channel parameter required" },
      { status: 400 }
    );
  }

  if (!VALID_COMBINATIONS[provider]?.includes(channel)) {
    return NextResponse.json(
      { error: "Invalid provider/channel combination" },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/marketing/oauth/${provider}/callback`;

  // 채널 → 사용자 출발 페이지 매핑 (에러 시 해당 페이지로 돌려보냄)
  const channelPathMap: Record<string, string> = {
    threads: "/marketing/threads",
    instagram: "/marketing/instagram",
    meta_ads: "/marketing/meta-ads",
    youtube: "/marketing/youtube",
  };
  const returnPath = channelPathMap[channel] || "/marketing";

  try {
    const authUrl = buildAuthorizationUrl(channel, redirectUri, auth.userId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    let message =
      error instanceof Error ? error.message : "OAuth initiation failed";
    // env 미설정 케이스를 사용자 친화 메시지로 변환
    if (message.includes("META_APP_ID") || message.includes("META_APP_SECRET")) {
      message =
        "Meta OAuth 키가 등록되어 있지 않습니다. 관리자에게 META_APP_ID, META_APP_SECRET 등록을 요청하세요.";
    } else if (
      message.includes("GOOGLE_CLIENT_ID") ||
      message.includes("GOOGLE_CLIENT_SECRET")
    ) {
      message =
        "Google OAuth 키가 등록되어 있지 않습니다. 관리자에게 문의하세요.";
    }
    return NextResponse.redirect(
      new URL(
        `${returnPath}?oauth_error=${encodeURIComponent(message)}`,
        request.nextUrl.origin,
      ),
    );
  }
}
