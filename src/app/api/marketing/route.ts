import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  marketingContent,
  marketingPosts,
  marketingInquiries,
} from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
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
    const channelStats = await db
      .select({
        channel: marketingPosts.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingPosts)
      .groupBy(marketingPosts.channel);

    // Inquiry stats: count per status
    const inquiryStats = await db
      .select({
        status: marketingInquiries.status,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingInquiries)
      .groupBy(marketingInquiries.status);

    return NextResponse.json({
      totalContent: contentCount.count,
      totalPosts: postsCount.count,
      totalInquiries: inquiriesCount.count,
      recentInquiries,
      channelStats,
      inquiryStats,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "마케팅 데이터 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
