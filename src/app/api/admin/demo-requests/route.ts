import { NextRequest } from "next/server";
import { and, desc, eq, sql, lt, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoRequests } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, err } from "@/lib/api/response";

const VALID_STATUSES = ["new", "contacted", "scheduled", "done"] as const;
type DemoStatus = (typeof VALID_STATUSES)[number];

/**
 * GET /api/admin/demo-requests
 *   ?status=new|contacted|scheduled|done
 *   &cursor=<iso>  ISO createdAt 기반 페이지네이션 (그 이전 건)
 *   &limit=50      1~200
 */
export async function GET(request: NextRequest) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const statusParam = sp.get("status");
  const cursorParam = sp.get("cursor");
  const rawLimit = Number(sp.get("limit") || "50");
  const limit = Math.min(200, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 50));

  const conditions: SQL[] = [];
  if (statusParam && VALID_STATUSES.includes(statusParam as DemoStatus)) {
    conditions.push(eq(demoRequests.status, statusParam));
  }
  if (cursorParam) {
    const cursorDate = new Date(cursorParam);
    if (!isNaN(cursorDate.getTime())) {
      conditions.push(lt(demoRequests.createdAt, cursorDate));
    }
  }

  try {
    const rows = await db
      .select()
      .from(demoRequests)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(demoRequests.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(demoRequests)
      .where(
        statusParam && VALID_STATUSES.includes(statusParam as DemoStatus)
          ? eq(demoRequests.status, statusParam)
          : undefined,
      );

    const statusCounts = await db
      .select({
        status: demoRequests.status,
        count: sql<number>`count(*)::int`,
      })
      .from(demoRequests)
      .groupBy(demoRequests.status);

    return ok({
      items,
      total,
      nextCursor: hasMore
        ? items[items.length - 1].createdAt.toISOString()
        : null,
      statusCounts,
    });
  } catch (e) {
    console.error("[admin/demo-requests GET]", e);
    return err(e instanceof Error ? e.message : "조회 실패", 500);
  }
}

export const dynamic = "force-dynamic";
