import { NextRequest, NextResponse } from "next/server";
import {
  parseOAuthState,
  exchangeCodeForTokens,
  exchangeForLongLivedToken,
} from "@/lib/marketing-oauth/oauth-utils";
import { storeTokens } from "@/lib/marketing-oauth/token-manager";

const CHANNEL_PATHS: Record<string, string> = {
  threads: "/marketing/threads",
  instagram: "/marketing/instagram",
  youtube: "/marketing/youtube",
  meta_ads: "/marketing/meta-ads",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const origin = request.nextUrl.origin;

  // Handle OAuth errors (user denied, etc.)
  if (error) {
    const desc =
      searchParams.get("error_description") || error;
    return NextResponse.redirect(
      new URL(
        `/marketing?oauth_error=${encodeURIComponent(desc)}`,
        origin
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/marketing?oauth_error=missing_params", origin)
    );
  }

  // Validate state (CSRF protection + channel recovery)
  const stateData = parseOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(
      new URL("/marketing?oauth_error=invalid_state", origin)
    );
  }

  const { channel, userId } = stateData;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const redirectUri = `${baseUrl}/api/marketing/oauth/${provider}/callback`;

  try {
    // Exchange code for tokens
    let tokenData = await exchangeCodeForTokens(
      provider,
      code,
      redirectUri
    );

    // Meta: exchange for long-lived token (60 days)
    if (provider === "meta") {
      const longLived = await exchangeForLongLivedToken(
        tokenData.accessToken
      );
      tokenData = {
        ...tokenData,
        accessToken: longLived.accessToken,
        expiresIn: longLived.expiresIn,
      };
    }

    // Fetch account profile info
    let accountName: string | undefined;
    let accountId: string | undefined;

    if (provider === "meta") {
      const profileResp = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.accessToken}`
      );
      if (profileResp.ok) {
        const profile = await profileResp.json();
        accountName = profile.name;
        accountId = profile.id;
      }
    } else if (provider === "google") {
      const profileResp = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
        }
      );
      if (profileResp.ok) {
        const data = await profileResp.json();
        const ch = data.items?.[0];
        accountName = ch?.snippet?.title;
        accountId = ch?.id;
      }
    }

    // Store tokens in DB (per-user)
    await storeTokens(userId, channel, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      accountName,
      accountId,
    });

    // Redirect to channel page with success
    const redirectPath = CHANNEL_PATHS[channel] || "/marketing";
    return NextResponse.redirect(
      new URL(`${redirectPath}?oauth_success=true`, origin)
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token exchange failed";
    console.error("OAuth callback error:", message);
    return NextResponse.redirect(
      new URL(
        `/marketing?oauth_error=${encodeURIComponent(message)}`,
        origin
      )
    );
  }
}
