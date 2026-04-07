import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";

/** GET /api/activity-log — 활동 이력 조회 (읽기 전용) */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const targetType = searchParams.get("targetType"); // defect, daily_log, billing

    const conditions = [
      workspaceFilter(activityLog.workspaceId, activityLog.userId, auth.workspaceId, auth.userId),
    ];
    if (siteId) conditions.push(eq(activityLog.siteId, siteId));
    if (targetType) conditions.push(eq(activityLog.targetType, targetType));

    const where = and(...conditions);

    const [items, [countResult]] = await Promise.all([
      db
        .select()
        .from(activityLog)
        .where(where)
        .orderBy(desc(activityLog.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(activityLog).where(where),
    ]);

    return ok({ items, meta: buildPaginationMeta(countResult?.count || 0, pagination) });
  } catch (error) {
    return serverError(error);
  }
}
