import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingContent } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const category = searchParams.get("category");

    const conditions: ReturnType<typeof eq>[] = [workspaceFilter(marketingContent.workspaceId, marketingContent.userId, wid, uid) as any];
    if (channel) {
      // targetChannels is a jsonb array, use @> contains operator
      conditions.push(
        sql`${marketingContent.targetChannels} @> ${JSON.stringify([channel])}::jsonb` as any
      );
    }
    if (category) {
      conditions.push(eq(marketingContent.category, category));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [items, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(marketingContent)
        .where(where)
        .orderBy(desc(marketingContent.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(marketingContent).where(where),
    ]);

    return ok({ items, meta: buildPaginationMeta(total, pagination) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

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
        userId: uid,
        workspaceId: wid,
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

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
