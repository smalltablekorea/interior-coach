import { db } from "@/lib/db";
import {
  marketingContent,
  marketingPosts,
  marketingInquiries,
  marketingChannels,
} from "@/lib/db/schema";
import { desc, sql, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

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
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    // Total content count
    const [contentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketingContent)
      .where(workspaceFilter(marketingContent.workspaceId, marketingContent.userId, wid, uid));

    // Total posts count
    const [postsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketingPosts)
      .where(workspaceFilter(marketingPosts.workspaceId, marketingPosts.userId, wid, uid));

    // Total inquiries count
    const [inquiriesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketingInquiries)
      .where(workspaceFilter(marketingInquiries.workspaceId, marketingInquiries.userId, wid, uid));

    // Recent 10 inquiries
    const recentInquiries = await db
      .select()
      .from(marketingInquiries)
      .where(workspaceFilter(marketingInquiries.workspaceId, marketingInquiries.userId, wid, uid))
      .orderBy(desc(marketingInquiries.createdAt))
      .limit(10);

    // Channel stats: count posts per channel
    const postStats = await db
      .select({
        channel: marketingPosts.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingPosts)
      .where(workspaceFilter(marketingPosts.workspaceId, marketingPosts.userId, wid, uid))
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
      .where(workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, wid, uid));

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
      .where(workspaceFilter(marketingInquiries.workspaceId, marketingInquiries.userId, wid, uid))
      .groupBy(marketingInquiries.status);

    const contractCount = inquiryStats.find((s) => s.status === "계약완료")?.count ?? 0;

    return ok({
      totalContent: contentCount.count,
      totalPosts: postsCount.count,
      totalInquiries: inquiriesCount.count,
      recentInquiries,
      channelStats,
      inquiryStats: { contractCount },
    });
  } catch (error) {
    return serverError(error);
  }
}
