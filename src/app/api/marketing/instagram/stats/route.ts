import { NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";

export async function GET() {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;

  const token = await getValidToken(auth.userId, "instagram");
  if (!token) {
    return NextResponse.json(
      { error: "Instagram 계정이 연결되지 않았습니다." },
      { status: 401 }
    );
  }

  try {
    // Get Instagram Business Account via Facebook Pages
    const pagesResp = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`
    );
    if (!pagesResp.ok) throw new Error("Facebook 페이지 조회 실패");
    const pagesData = await pagesResp.json();
    const page = pagesData.data?.[0];
    if (!page) throw new Error("연결된 Facebook 페이지가 없습니다");

    const igResp = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${token}`
    );
    if (!igResp.ok) throw new Error("Instagram 비즈니스 계정 조회 실패");
    const igData = await igResp.json();
    const igId = igData.instagram_business_account?.id;
    if (!igId) throw new Error("Instagram 비즈니스 계정이 연결되지 않았습니다");

    // Fetch account info
    const accountResp = await fetch(
      `https://graph.facebook.com/v19.0/${igId}?fields=username,name,profile_picture_url,followers_count,follows_count,media_count,biography&access_token=${token}`
    );
    if (!accountResp.ok) throw new Error("Instagram 계정 정보 조회 실패");
    const account = await accountResp.json();

    // Fetch account insights (last 30 days)
    const since = Math.floor(Date.now() / 1000) - 30 * 86400;
    const until = Math.floor(Date.now() / 1000);
    const insightsResp = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/insights?metric=reach,impressions,profile_views&period=day&since=${since}&until=${until}&access_token=${token}`
    );
    let insightsSummary = { reach: 0, impressions: 0, profileViews: 0 };
    if (insightsResp.ok) {
      const insightsData = await insightsResp.json();
      for (const metric of insightsData.data || []) {
        const total = (metric.values || []).reduce(
          (sum: number, v: { value: number }) => sum + (v.value || 0),
          0
        );
        if (metric.name === "reach") insightsSummary.reach = total;
        if (metric.name === "impressions") insightsSummary.impressions = total;
        if (metric.name === "profile_views") insightsSummary.profileViews = total;
      }
    }

    // Fetch recent media
    const mediaResp = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${token}`
    );
    const mediaData = mediaResp.ok ? await mediaResp.json() : { data: [] };

    const recentPosts = (mediaData.data || []).map(
      (m: Record<string, unknown>) => ({
        id: m.id,
        caption: ((m.caption as string) || "").slice(0, 100),
        mediaType: m.media_type,
        mediaUrl: m.media_url || m.thumbnail_url,
        permalink: m.permalink,
        timestamp: m.timestamp,
        likes: (m.like_count as number) || 0,
        comments: (m.comments_count as number) || 0,
      })
    );

    return NextResponse.json({
      profile: {
        id: igId,
        username: account.username,
        name: account.name,
        profilePicture: account.profile_picture_url,
        biography: account.biography,
        followersCount: account.followers_count || 0,
        followsCount: account.follows_count || 0,
        mediaCount: account.media_count || 0,
      },
      insights: insightsSummary,
      recentPosts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Instagram 데이터 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
