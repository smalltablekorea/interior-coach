import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingContent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, serverError, notFound } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    const [row] = await db
      .select()
      .from(marketingContent)
      .where(and(eq(marketingContent.id, id), eq(marketingContent.userId, auth.userId)))
      .limit(1);

    if (!row) {
      return notFound("콘텐츠를 찾을 수 없습니다.");
    }

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
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
      .where(and(eq(marketingContent.id, id), eq(marketingContent.userId, auth.userId)))
      .returning();

    if (!row) {
      return notFound("콘텐츠를 찾을 수 없습니다.");
    }

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    await db.delete(marketingContent).where(and(eq(marketingContent.id, id), eq(marketingContent.userId, auth.userId)));

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
