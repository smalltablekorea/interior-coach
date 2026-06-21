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

    // PRE-CHECK: UNIQUE(site_id, user_id, log_date) 위반 사전 차단.
    // drizzle/neon-http가 PG 에러 메시지에 'duplicate key'·'23505'를 그대로 노출하지만
    // wrapping이 끼면서 'unique' 키워드가 빠질 수 있음 → 사용자에게 raw SQL이 보이던
    // 버그를 막기 위해 INSERT 전에 명시적으로 확인.
    const [duplicate] = await db
      .select({ id: dailyLogs.id })
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.siteId, body.siteId),
          eq(dailyLogs.userId, auth.userId),
          eq(dailyLogs.logDate, body.logDate),
        ),
      )
      .limit(1);
    if (duplicate) {
      return err(
        `해당 날짜에 이미 작성한 업무일지가 있습니다. 기존 일지를 수정해주세요. (existingId=${duplicate.id})`,
        409,
      );
    }

    // jsonb 컬럼은 반드시 배열 또는 null만 — 빈 문자열·객체가 들어가면 PG 'invalid input syntax for type json'
    const safeArr = (v: unknown): unknown[] | null =>
      Array.isArray(v) && v.length > 0 ? v : null;

    const [row] = await db
      .insert(dailyLogs)
      .values({
        siteId: body.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        authorName: auth.session.user.name,
        logDate: body.logDate,
        tradesWorked: safeArr(body.tradesWorked),
        tradesWorkedNames: safeArr(body.tradesWorkedNames),
        summary: body.summary.trim(),
        detail: body.detail?.trim() || null,
        photoUrls: safeArr(body.photoUrls),
        issues: body.issues?.trim() || null,
        nextDayPlan: body.nextDayPlan?.trim() || null,
        weather: body.weather || null,
        workerCount: typeof body.workerCount === "number" ? body.workerCount : 1,
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
    // UNIQUE 제약 위반(같은 날 같은 현장 본인 작성) — race condition 등 PRE-CHECK 우회 케이스 대비.
    // drizzle/neon-http는 raw query를 message 로 throw하기 때문에 'unique' 단어가 없을 수 있어
    // PG 에러 코드(23505)·'duplicate key' 키워드까지 같이 검사.
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes("unique") ||
      msg.includes("23505") ||
      msg.includes("duplicate key")
    ) {
      return err("해당 날짜에 이미 작성한 업무일지가 있습니다. 기존 일지를 수정해주세요.", 409);
    }
    return serverError(error);
  }
}
