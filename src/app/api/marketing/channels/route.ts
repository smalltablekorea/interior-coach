import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { disconnectChannel, getChannelConnection } from "@/lib/marketing-oauth/token-manager";

export async function GET(request: NextRequest) {
  try {
    // Single channel query: GET /api/marketing/channels?channel=threads
    const channelFilter = request.nextUrl.searchParams.get("channel");
    if (channelFilter) {
      const conn = await getChannelConnection(channelFilter);
      return NextResponse.json(conn);
    }

    const rows = await db
      .select()
      .from(marketingChannels)
      .orderBy(desc(marketingChannels.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "채널 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, accountName, accountId, accessToken, isActive } = body;

    // Check if a channel connection already exists for this channel
    const [existing] = await db
      .select()
      .from(marketingChannels)
      .where(eq(marketingChannels.channel, channel))
      .limit(1);

    if (existing) {
      // Update existing channel connection
      const [row] = await db
        .update(marketingChannels)
        .set({
          accountName: accountName || existing.accountName,
          accountId: accountId || existing.accountId,
          accessToken: accessToken !== undefined ? accessToken : existing.accessToken,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(marketingChannels.id, existing.id))
        .returning();

      return NextResponse.json(row);
    }

    // Create new channel connection
    const [row] = await db
      .insert(marketingChannels)
      .values({
        userId: "system",
        channel,
        accountName: accountName || null,
        accountId: accountId || null,
        accessToken: accessToken || null,
        isActive: isActive !== undefined ? isActive : false,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "채널 연결에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { channel } = await request.json();
    if (!channel) {
      return NextResponse.json({ error: "channel required" }, { status: 400 });
    }

    await disconnectChannel(channel);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "채널 연결 해제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
