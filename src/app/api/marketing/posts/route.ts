import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingPosts } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
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
    const status = searchParams.get("status");

    const conditions = [workspaceFilter(marketingPosts.workspaceId, marketingPosts.userId, wid, uid)];
    if (channel) {
      conditions.push(eq(marketingPosts.channel, channel));
    }
    if (status) {
      conditions.push(eq(marketingPosts.status, status));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [items, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(marketingPosts)
        .where(where)
        .orderBy(desc(marketingPosts.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(marketingPosts).where(where),
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
      contentId,
      channel,
      title,
      body: postBody,
      mediaUrls,
      hashtags,
      scheduledAt,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    const [row] = await db
      .insert(marketingPosts)
      .values({
        userId: uid,
        workspaceId: wid,
        contentId: contentId || null,
        channel,
        title: title || null,
        body: postBody || null,
        mediaUrls: mediaUrls || null,
        hashtags: hashtags || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "scheduled" : "draft",
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
