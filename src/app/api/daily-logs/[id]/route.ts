import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dailyLogs, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { logActivity } from "@/lib/activity-log";
import type { UpdateDailyLogRequest, Weather } from "@/types/daily-log";

const VALID_WEATHER: Weather[] = ["sunny", "cloudy", "rainy", "snowy", "hot", "cold"];

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/daily-logs/[id] — 업무일지 상세 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [row] = await db
      .select({
        id: dailyLogs.id,
        siteId: dailyLogs.siteId,
        siteName: sites.name,
        authorName: dailyLogs.authorName,
        logDate: dailyLogs.logDate,
        tradesWorked: dailyLogs.tradesWorked,
        tradesWorkedNames: dailyLogs.tradesWorkedNames,
        summary: dailyLogs.summary,
        detail: dailyLogs.detail,
        photoUrls: dailyLogs.photoUrls,
        issues: dailyLogs.issues,
        nextDayPlan: dailyLogs.nextDayPlan,
        weather: dailyLogs.weather,
        workerCount: dailyLogs.workerCount,
        sharedToCustomer: dailyLogs.sharedToCustomer,
        createdAt: dailyLogs.createdAt,
        updatedAt: dailyLogs.updatedAt,
      })
      .from(dailyLogs)
      .leftJoin(sites, eq(dailyLogs.siteId, sites.id))
      .where(
        and(
          eq(dailyLogs.id, id),
          workspaceFilter(dailyLogs.workspaceId, dailyLogs.userId, auth.workspaceId, auth.userId),
        ),
      )
      .limit(1);

    if (!row) return notFound("업무일지를 찾을 수 없습니다.");
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

/** PATCH /api/daily-logs/[id] — 업무일지 수정 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body: UpdateDailyLogRequest = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.tradesWorked !== undefined) updates.tradesWorked = body.tradesWorked;
    if (body.tradesWorkedNames !== undefined) updates.tradesWorkedNames = body.tradesWorkedNames;
    if (body.summary !== undefined) {
      if (!body.summary.trim()) return err("작업 요약은 필수입니다.");
      updates.summary = body.summary.trim();
    }
    if (body.detail !== undefined) updates.detail = body.detail?.trim() || null;
    if (body.photoUrls !== undefined) updates.photoUrls = body.photoUrls;
    if (body.issues !== undefined) updates.issues = body.issues?.trim() || null;
    if (body.nextDayPlan !== undefined) updates.nextDayPlan = body.nextDayPlan?.trim() || null;
    if (body.weather !== undefined) {
      if (body.weather && !VALID_WEATHER.includes(body.weather)) return err("유효하지 않은 날씨입니다.");
      updates.weather = body.weather;
    }
    if (body.workerCount !== undefined) updates.workerCount = body.workerCount;
    if (body.sharedToCustomer !== undefined) updates.sharedToCustomer = body.sharedToCustomer;

    const [updated] = await db
      .update(dailyLogs)
      .set(updates)
      .where(
        and(
          eq(dailyLogs.id, id),
          workspaceFilter(dailyLogs.workspaceId, dailyLogs.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning();

    if (!updated) return notFound("업무일지를 찾을 수 없습니다.");

    if (body.sharedToCustomer === true) {
      logActivity({
        siteId: updated.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        action: "log_shared_to_customer",
        targetType: "daily_log",
        targetId: updated.id,
        metadata: { logDate: updated.logDate },
      });
    }

    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE /api/daily-logs/[id] — 업무일지 삭제 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "delete");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [deleted] = await db
      .delete(dailyLogs)
      .where(
        and(
          eq(dailyLogs.id, id),
          workspaceFilter(dailyLogs.workspaceId, dailyLogs.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning({ id: dailyLogs.id, siteId: dailyLogs.siteId, logDate: dailyLogs.logDate });

    if (!deleted) return notFound("업무일지를 찾을 수 없습니다.");

    logActivity({
      siteId: deleted.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "log_deleted",
      targetType: "daily_log",
      targetId: deleted.id,
      metadata: { logDate: deleted.logDate },
    });

    return ok({ message: "삭제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}
