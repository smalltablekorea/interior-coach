import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingPosts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError, notFound } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;
  try {
    const { id } = await params;

    const [row] = await db
      .select()
      .from(marketingPosts)
      .where(and(eq(marketingPosts.id, id), workspaceFilter(marketingPosts.workspaceId, marketingPosts.userId, wid, uid)))
      .limit(1);

    if (!row) {
      return notFound("포스트를 찾을 수 없습니다.");
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
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;
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
      .where(and(eq(marketingPosts.id, id), workspaceFilter(marketingPosts.workspaceId, marketingPosts.userId, wid, uid)))
      .returning();

    if (!row) {
      return notFound("포스트를 찾을 수 없습니다.");
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
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;
  try {
    const { id } = await params;

    await db.delete(marketingPosts).where(and(eq(marketingPosts.id, id), workspaceFilter(marketingPosts.workspaceId, marketingPosts.userId, wid, uid)));

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
