import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const token = await getValidToken(auth.userId, "threads");
  if (!token) {
    return NextResponse.json(
      { error: "Threads 계정이 연결되지 않았습니다." },
      { status: 401 }
    );
  }

  try {
    // Fetch user profile
    const profileResp = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${token}`
    );
    if (!profileResp.ok) throw new Error("프로필 조회 실패");
    const profile = await profileResp.json();

    // Fetch recent threads (posts)
    const threadsResp = await fetch(
      `https://graph.threads.net/v1.0/me/threads?fields=id,text,timestamp,media_type,permalink,is_quote_post&limit=25&access_token=${token}`
    );
    const threadsData = threadsResp.ok ? await threadsResp.json() : { data: [] };

    // Fetch individual post insights for recent posts
    const postInsights = [];
    for (const thread of (threadsData.data || []).slice(0, 10)) {
      try {
        const piResp = await fetch(
          `https://graph.threads.net/v1.0/${thread.id}/insights?metric=views,likes,replies,reposts,quotes&access_token=${token}`
        );
        if (piResp.ok) {
          const piData = await piResp.json();
          const metrics: Record<string, number> = {};
          for (const m of piData.data || []) {
            metrics[m.name] = m.total_value?.value ?? m.values?.[0]?.value ?? 0;
          }
          postInsights.push({
            id: thread.id,
            text: thread.text?.slice(0, 100),
            timestamp: thread.timestamp,
            permalink: thread.permalink,
            mediaType: thread.media_type,
            views: metrics.views || 0,
            likes: metrics.likes || 0,
            replies: metrics.replies || 0,
            reposts: metrics.reposts || 0,
            quotes: metrics.quotes || 0,
          });
        }
      } catch {
        // skip individual post errors
      }
    }

    // Calculate totals from post insights
    const totalViews = postInsights.reduce((s, p) => s + p.views, 0);
    const totalLikes = postInsights.reduce((s, p) => s + p.likes, 0);
    const totalReplies = postInsights.reduce((s, p) => s + p.replies, 0);
    const totalReposts = postInsights.reduce((s, p) => s + p.reposts, 0);

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        profilePicture: profile.threads_profile_picture_url,
        biography: profile.threads_biography,
      },
      insights: {
        totalViews,
        totalLikes,
        totalReplies,
        totalReposts,
        totalQuotes: postInsights.reduce((s, p) => s + p.quotes, 0),
      },
      recentPosts: postInsights,
      totalPosts: threadsData.data?.length || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Threads 데이터 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
