import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dailyLogs, sites } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";
import { logActivity } from "@/lib/activity-log";
import type { CreateDailyLogRequest, Weather } from "@/types/daily-log";

const VALID_WEATHER: Weather[] = ["sunny", "cloudy", "rainy", "snowy", "hot", "cold"];

/** GET /api/daily-logs — 업무일지 목록 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD

    const conditions = [
      workspaceFilter(dailyLogs.workspaceId, dailyLogs.userId, auth.workspaceId, auth.userId),
    ];
    if (siteId) conditions.push(eq(dailyLogs.siteId, siteId));
    if (from) conditions.push(gte(dailyLogs.logDate, from));
    if (to) conditions.push(lte(dailyLogs.logDate, to));

    const where = and(...conditions);

    const [items, [countResult]] = await Promise.all([
      db
        .select({
          id: dailyLogs.id,
          siteId: dailyLogs.siteId,
          siteName: sites.name,
          authorName: dailyLogs.authorName,
          logDate: dailyLogs.logDate,
          tradesWorkedNames: dailyLogs.tradesWorkedNames,
          summary: dailyLogs.summary,
          photoUrls: dailyLogs.photoUrls,
          weather: dailyLogs.weather,
          workerCount: dailyLogs.workerCount,
          sharedToCustomer: dailyLogs.sharedToCustomer,
          createdAt: dailyLogs.createdAt,
        })
        .from(dailyLogs)
        .leftJoin(sites, eq(dailyLogs.siteId, sites.id))
        .where(where)
        .orderBy(desc(dailyLogs.logDate))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(dailyLogs).where(where),
    ]);

    return ok({ items, meta: buildPaginationMeta(countResult?.count || 0, pagination) });
  } catch (error) {
    return serverError(error);
  }
}

/** POST /api/daily-logs — 업무일지 작성 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  try {
    const body: CreateDailyLogRequest = await request.json();

    if (!body.siteId) return err("현장을 선택해주세요.");
    if (!body.logDate) return err("날짜를 입력해주세요.");
    if (!body.summary?.trim()) return err("작업 요약을 입력해주세요.");
    if (body.weather && !VALID_WEATHER.includes(body.weather)) {
      return err("유효하지 않은 날씨입니다.");
    }

    const [row] = await db
      .insert(dailyLogs)
      .values({
        siteId: body.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        authorName: auth.session.user.name,
        logDate: body.logDate,
        tradesWorked: body.tradesWorked || null,
        tradesWorkedNames: body.tradesWorkedNames || null,
        summary: body.summary.trim(),
        detail: body.detail?.trim() || null,
        photoUrls: body.photoUrls || null,
        issues: body.issues?.trim() || null,
        nextDayPlan: body.nextDayPlan?.trim() || null,
        weather: body.weather || null,
        workerCount: body.workerCount ?? 1,
      })
      .returning();

    logActivity({
      siteId: body.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      actorName: auth.session.user.name,
      action: "log_submitted",
      targetType: "daily_log",
      targetId: row.id,
      metadata: { logDate: body.logDate, summary: body.summary },
    });

    return ok(row);
  } catch (error) {
    // UNIQUE 제약 위반 (같은 날 같은 현장에 이미 작성)
    if (error instanceof Error && error.message.includes("unique")) {
      return err("해당 날짜에 이미 업무일지가 작성되어 있습니다.", 409);
    }
    return serverError(error);
  }
}
