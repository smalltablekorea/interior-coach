import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [row] = await db
      .select()
      .from(marketingPosts)
      .where(eq(marketingPosts.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "포스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "포스트 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      contentId,
      channel,
      title,
      body: postBody,
      mediaUrls,
      hashtags,
      scheduledAt,
      status,
      channelPostId,
      channelPostUrl,
      publishedAt,
      errorMessage,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      engagement,
    } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (contentId !== undefined) updateData.contentId = contentId || null;
    if (channel !== undefined) updateData.channel = channel;
    if (title !== undefined) updateData.title = title;
    if (postBody !== undefined) updateData.body = postBody;
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (scheduledAt !== undefined)
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) updateData.status = status;
    if (channelPostId !== undefined) updateData.channelPostId = channelPostId;
    if (channelPostUrl !== undefined) updateData.channelPostUrl = channelPostUrl;
    if (publishedAt !== undefined)
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (utmSource !== undefined) updateData.utmSource = utmSource;
    if (utmMedium !== undefined) updateData.utmMedium = utmMedium;
    if (utmCampaign !== undefined) updateData.utmCampaign = utmCampaign;
    if (utmContent !== undefined) updateData.utmContent = utmContent;
    if (engagement !== undefined) updateData.engagement = engagement;

    const [row] = await db
      .update(marketingPosts)
      .set(updateData)
      .where(eq(marketingPosts.id, id))
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "포스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "포스트 수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(marketingPosts).where(eq(marketingPosts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "포스트 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
