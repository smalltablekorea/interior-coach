import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingContent } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const category = searchParams.get("category");

    const conditions = [];
    if (channel) {
      // targetChannels is a jsonb array, use @> contains operator
      conditions.push(
        sql`${marketingContent.targetChannels} @> ${JSON.stringify([channel])}::jsonb`
      );
    }
    if (category) {
      conditions.push(eq(marketingContent.category, category));
    }

    let rows;
    if (conditions.length > 0) {
      rows = await db
        .select()
        .from(marketingContent)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(marketingContent.createdAt));
    } else {
      rows = await db
        .select()
        .from(marketingContent)
        .orderBy(desc(marketingContent.createdAt));
    }

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "콘텐츠 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      body: contentBody,
      contentType,
      siteId,
      mediaUrls,
      tags,
      category,
      targetChannels,
      aiGenerated,
      aiPrompt,
    } = body;

    const [row] = await db
      .insert(marketingContent)
      .values({
        userId: "system",
        title,
        body: contentBody,
        contentType: contentType || "text",
        siteId: siteId || null,
        mediaUrls: mediaUrls || null,
        tags: tags || null,
        category: category || null,
        targetChannels: targetChannels || null,
        aiGenerated: aiGenerated || false,
        aiPrompt: aiPrompt || null,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "콘텐츠 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
