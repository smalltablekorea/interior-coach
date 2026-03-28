import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  marketingContent,
  marketingPosts,
  marketingInquiries,
  marketingChannels,
} from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

const CHANNEL_MAP: Record<string, { slug: string; name: string; icon: string }> = {
  threads: { slug: "threads", name: "스레드", icon: "🧵" },
  instagram: { slug: "instagram", name: "인스타그램", icon: "📸" },
  naver_blog: { slug: "naver-blog", name: "네이버 블로그", icon: "📝" },
  youtube: { slug: "youtube", name: "유튜브", icon: "🎬" },
  meta_ads: { slug: "meta-ads", name: "메타 광고", icon: "📢" },
  sms: { slug: "sms", name: "SMS 자동화", icon: "💬" },
  adlog: { slug: "adlog", name: "애드로그", icon: "📊" },
};

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    // Total content count
    const [contentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketingContent);

    // Total posts count
    const [postsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketingPosts);

    // Total inquiries count
    const [inquiriesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketingInquiries);

    // Recent 10 inquiries
    const recentInquiries = await db
      .select()
      .from(marketingInquiries)
      .orderBy(desc(marketingInquiries.createdAt))
      .limit(10);

    // Channel stats: count posts per channel
    const postStats = await db
      .select({
        channel: marketingPosts.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingPosts)
      .groupBy(marketingPosts.channel);

    // Channel connections: actual connection status
    const connections = await db
      .select({
        channel: marketingChannels.channel,
        isActive: marketingChannels.isActive,
        accountName: marketingChannels.accountName,
        accessToken: marketingChannels.accessToken,
      })
      .from(marketingChannels)
      .where(eq(marketingChannels.userId, auth.userId));

    const connMap = new Map(connections.map((c) => [c.channel, c]));
    const postMap = new Map(postStats.map((p) => [p.channel, p.count]));

    // Build channel stats with real connection status
    const channelStats = Object.entries(CHANNEL_MAP).map(([key, meta]) => {
      const conn = connMap.get(key);
      const connected = !!(conn?.isActive && (conn.accessToken || conn.accountName));
      return {
        slug: meta.slug,
        name: meta.name,
        icon: meta.icon,
        connected,
        postCount: postMap.get(key) ?? 0,
      };
    });

    // Inquiry stats: count per status
    const inquiryStats = await db
      .select({
        status: marketingInquiries.status,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingInquiries)
      .groupBy(marketingInquiries.status);

    const contractCount = inquiryStats.find((s) => s.status === "계약완료")?.count ?? 0;

    return NextResponse.json({
      totalContent: contentCount.count,
      totalPosts: postsCount.count,
      totalInquiries: inquiriesCount.count,
      recentInquiries,
      channelStats,
      inquiryStats: { contractCount },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "마케팅 데이터 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
