import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { db } from "@/lib/db";
import { threadsPosts, sites } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { ok, err, notFound, serverError } from "@/lib/api/response";


export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const month = searchParams.get("month"); // YYYY-MM

    const posts = await db
      .select({
        id: threadsPosts.id,
        siteId: threadsPosts.siteId,
        siteName: sites.name,
        title: threadsPosts.title,
        content: threadsPosts.content,
        hashtags: threadsPosts.hashtags,
        imageUrls: threadsPosts.imageUrls,
        status: threadsPosts.status,
        scheduledAt: threadsPosts.scheduledAt,
        publishedAt: threadsPosts.publishedAt,
        likes: threadsPosts.likes,
        comments: threadsPosts.comments,
        views: threadsPosts.views,
        templateId: threadsPosts.templateId,
        autoRuleId: threadsPosts.autoRuleId,
        createdAt: threadsPosts.createdAt,
      })
      .from(threadsPosts)
      .leftJoin(sites, eq(threadsPosts.siteId, sites.id))
      .where(
        and(
          workspaceFilter(threadsPosts.workspaceId, threadsPosts.userId, auth.workspaceId, auth.userId),
          status ? eq(threadsPosts.status, status) : undefined,
          month
            ? sql`to_char(COALESCE(${threadsPosts.scheduledAt}, ${threadsPosts.createdAt}), 'YYYY-MM') = ${month}`
            : undefined
        )
      )
      .orderBy(desc(threadsPosts.createdAt));

    return ok(posts);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { siteId, title, content, hashtags, status, scheduledAt, templateId } = body;

    if (!content) {
      return err("content 필수");
    }

    const [created] = await db
      .insert(threadsPosts)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        siteId: siteId || null,
        title: title || null,
        content,
        hashtags: hashtags || null,
        status: status || "작성중",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        templateId: templateId || null,
      })
      .returning();

    return ok(created);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return err("id 필수");
    }

    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt);
    }
    if (updates.publishedAt) {
      updates.publishedAt = new Date(updates.publishedAt);
    }

    const [updated] = await db
      .update(threadsPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(threadsPosts.id, id), workspaceFilter(threadsPosts.workspaceId, threadsPosts.userId, auth.workspaceId, auth.userId)))
      .returning();

    if (!updated) return notFound("게시물을 찾을 수 없습니다.");
    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return err("id 필수");
    }

    await db
      .delete(threadsPosts)
      .where(and(eq(threadsPosts.id, id), workspaceFilter(threadsPosts.workspaceId, threadsPosts.userId, auth.workspaceId, auth.userId)));

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
