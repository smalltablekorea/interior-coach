import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { constructionPhases, sites } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    const wsFilter = workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, auth.workspaceId, auth.userId);
    const where = siteId
      ? and(eq(constructionPhases.siteId, siteId), wsFilter)
      : wsFilter;

    const [items, [{ count: total }]] = await Promise.all([
      db
        .select({
          id: constructionPhases.id,
          category: constructionPhases.category,
          plannedStart: constructionPhases.plannedStart,
          plannedEnd: constructionPhases.plannedEnd,
          actualStart: constructionPhases.actualStart,
          actualEnd: constructionPhases.actualEnd,
          progress: constructionPhases.progress,
          status: constructionPhases.status,
          sortOrder: constructionPhases.sortOrder,
          memo: constructionPhases.memo,
          siteId: constructionPhases.siteId,
          siteName: sites.name,
        })
        .from(constructionPhases)
        .leftJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(where)
        .orderBy(constructionPhases.sortOrder)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(constructionPhases).where(where),
    ]);

    return ok({ items, meta: buildPaginationMeta(total, pagination) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { siteId, category, plannedStart, plannedEnd, status, memo } = body;

    if (!siteId || !category) {
      return err("현장과 공종명은 필수입니다");
    }

    // Get the next sort order for this site
    const [maxOrder] = await db
      .select({ max: sql<number>`coalesce(max(${constructionPhases.sortOrder}), 0)` })
      .from(constructionPhases)
      .where(eq(constructionPhases.siteId, siteId));

    const [row] = await db
      .insert(constructionPhases)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        siteId,
        category,
        plannedStart: plannedStart || null,
        plannedEnd: plannedEnd || null,
        status: status || "대기",
        memo: memo || null,
        sortOrder: (maxOrder?.max ?? 0) + 1,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
