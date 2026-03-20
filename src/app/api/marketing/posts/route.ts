import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingPosts } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");

    const conditions = [];
    if (channel) {
      conditions.push(eq(marketingPosts.channel, channel));
    }
    if (status) {
      conditions.push(eq(marketingPosts.status, status));
    }

    let rows;
    if (conditions.length > 0) {
      rows = await db
        .select()
        .from(marketingPosts)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(marketingPosts.createdAt));
    } else {
      rows = await db
        .select()
        .from(marketingPosts)
        .orderBy(desc(marketingPosts.createdAt));
    }

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "포스트 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contentId,
      channel,
      title,
      body: postBody,
      mediaUrls,
      hashtags,
      scheduledAt,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    const [row] = await db
      .insert(marketingPosts)
      .values({
        userId: "system",
        contentId: contentId || null,
        channel,
        title: title || null,
        body: postBody || null,
        mediaUrls: mediaUrls || null,
        hashtags: hashtags || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "scheduled" : "draft",
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "포스트 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
