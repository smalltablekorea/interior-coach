import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingKeywords } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    let rows;
    if (channel) {
      rows = await db
        .select()
        .from(marketingKeywords)
        .where(eq(marketingKeywords.channel, channel))
        .orderBy(desc(marketingKeywords.createdAt));
    } else {
      rows = await db
        .select()
        .from(marketingKeywords)
        .orderBy(desc(marketingKeywords.createdAt));
    }

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "키워드 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, channel, currentRank, searchVolume, targetUrl } = body;

    const [row] = await db
      .insert(marketingKeywords)
      .values({
        userId: "system",
        keyword,
        channel,
        currentRank: currentRank || null,
        searchVolume: searchVolume || null,
        targetUrl: targetUrl || null,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "키워드 등록에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
