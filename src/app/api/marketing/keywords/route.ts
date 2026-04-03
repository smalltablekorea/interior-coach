import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingKeywords } from "@/lib/db/schema";
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

    const conditions = [workspaceFilter(marketingKeywords.workspaceId, marketingKeywords.userId, wid, uid)];
    if (channel) {
      conditions.push(eq(marketingKeywords.channel, channel));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [items, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(marketingKeywords)
        .where(where)
        .orderBy(desc(marketingKeywords.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(marketingKeywords).where(where),
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
    const { keyword, channel, currentRank, searchVolume, targetUrl } = body;

    const [row] = await db
      .insert(marketingKeywords)
      .values({
        userId: uid,
        workspaceId: wid,
        keyword,
        channel,
        currentRank: currentRank || null,
        searchVolume: searchVolume || null,
        targetUrl: targetUrl || null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
