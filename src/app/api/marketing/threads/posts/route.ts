import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { db } from "@/lib/db";
import { threadsPosts, sites } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";


export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;

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

  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { siteId, title, content, hashtags, status, scheduledAt, templateId } = body;

  if (!content) {
    return NextResponse.json({ error: "content 필수" }, { status: 400 });
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

  return NextResponse.json(created);
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
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

  return NextResponse.json(updated || null);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  await db
    .delete(threadsPosts)
    .where(and(eq(threadsPosts.id, id), workspaceFilter(threadsPosts.workspaceId, threadsPosts.userId, auth.workspaceId, auth.userId)));

  return NextResponse.json({ success: true });
}
