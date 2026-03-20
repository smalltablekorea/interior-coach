import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [row] = await db
      .select()
      .from(marketingContent)
      .where(eq(marketingContent.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "콘텐츠를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "콘텐츠 조회에 실패했습니다.";
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
      title,
      body: contentBody,
      contentType,
      siteId,
      mediaUrls,
      tags,
      category,
      targetChannels,
      status,
      aiGenerated,
      aiPrompt,
    } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (contentBody !== undefined) updateData.body = contentBody;
    if (contentType !== undefined) updateData.contentType = contentType;
    if (siteId !== undefined) updateData.siteId = siteId || null;
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (targetChannels !== undefined) updateData.targetChannels = targetChannels;
    if (status !== undefined) updateData.status = status;
    if (aiGenerated !== undefined) updateData.aiGenerated = aiGenerated;
    if (aiPrompt !== undefined) updateData.aiPrompt = aiPrompt;

    const [row] = await db
      .update(marketingContent)
      .set(updateData)
      .where(eq(marketingContent.id, id))
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "콘텐츠를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "콘텐츠 수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(marketingContent).where(eq(marketingContent.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "콘텐츠 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
