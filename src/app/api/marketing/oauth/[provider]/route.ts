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

  try {
    const authUrl = buildAuthorizationUrl(channel, redirectUri, auth.userId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth initiation failed";
    // Redirect back with error instead of JSON (user-facing route)
    return NextResponse.redirect(
      new URL(
        `/marketing?oauth_error=${encodeURIComponent(message)}`,
        request.nextUrl.origin
      )
    );
  }
}
