import { NextRequest } from "next/server";
import { sql, gte, eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable, session as sessionTable } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";

/**
 * GET /api/admin/activity
 *
 * 1) 최근 7일 일자별 로그인 통계 (KST 기준)
 *    - 각 일자: 신규 세션을 만든 unique user 수 + 사용자 상세 리스트
 * 2) 이번달 사용 시간 TOP 사용자
 *    - 각 사용자의 누적 사용 시간 = SUM(session.updated_at - session.created_at)
 *    - 활동 일수 = DISTINCT DATE(session.created_at)
 *    - 세션 수 = COUNT(session.id)
 */
export async function GET(_request: NextRequest) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  try {
    // ─── KST 기반 날짜 계산 ───
    const kstOffsetMs = 9 * 60 * 60 * 1000;
    const kstNowMs = Date.now() + kstOffsetMs;
    const kstStartOfTodayMs = Math.floor(kstNowMs / 86400000) * 86400000;
    const kstStartOf7DaysAgoMs = kstStartOfTodayMs - 6 * 86400000; // 오늘 포함 7일
    const sevenDaysAgoStart = new Date(kstStartOf7DaysAgoMs - kstOffsetMs);

    // KST 이번달 1일 00:00
    const kstNow = new Date(kstNowMs);
    const kstYear = kstNow.getUTCFullYear();
    const kstMonth = kstNow.getUTCMonth();
    const monthStartKstMs = Date.UTC(kstYear, kstMonth, 1);
    const monthStart = new Date(monthStartKstMs - kstOffsetMs);

    // ─── 1) 최근 7일 로그인 ───
    // 일자별 unique user 수 + 사용자 상세
    type DayRow = {
      kstDate: string;
      userId: string;
      email: string;
      name: string;
      firstLoginUtc: Date;
      lastLoginUtc: Date;
      sessionCount: number;
    };

    const weekRows = await db
      .select({
        kstDate: sql<string>`to_char((${sessionTable.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`,
        userId: sessionTable.userId,
        email: userTable.email,
        name: userTable.name,
        firstLoginUtc: sql<Date>`min(${sessionTable.createdAt})`,
        lastLoginUtc: sql<Date>`max(${sessionTable.createdAt})`,
        sessionCount: sql<number>`count(*)::int`,
      })
      .from(sessionTable)
      .innerJoin(userTable, eq(userTable.id, sessionTable.userId))
      .where(gte(sessionTable.createdAt, sevenDaysAgoStart))
      .groupBy(
        sql`to_char((${sessionTable.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`,
        sessionTable.userId,
        userTable.email,
        userTable.name,
      );

    // 일자별로 묶기
    const weekMap = new Map<string, DayRow[]>();
    for (const r of weekRows as DayRow[]) {
      if (!weekMap.has(r.kstDate)) weekMap.set(r.kstDate, []);
      weekMap.get(r.kstDate)!.push(r);
    }

    // 7일 전부 (데이터 없는 날도 0으로) 생성
    const weekLogins = [];
    for (let i = 6; i >= 0; i--) {
      const targetMs = kstStartOfTodayMs - i * 86400000;
      const d = new Date(targetMs);
      const dateStr =
        `${d.getUTCFullYear()}-` +
        `${String(d.getUTCMonth() + 1).padStart(2, "0")}-` +
        `${String(d.getUTCDate()).padStart(2, "0")}`;
      const dayUsers = weekMap.get(dateStr) ?? [];
      // 최근 로그인 순으로 정렬
      dayUsers.sort(
        (a, b) =>
          new Date(b.lastLoginUtc).getTime() - new Date(a.lastLoginUtc).getTime(),
      );
      weekLogins.push({
        date: dateStr,
        uniqueUsers: dayUsers.length,
        totalSessions: dayUsers.reduce((s, u) => s + u.sessionCount, 0),
        users: dayUsers.map((u) => ({
          userId: u.userId,
          email: u.email,
          name: u.name,
          firstLogin: new Date(u.firstLoginUtc).toISOString(),
          lastLogin: new Date(u.lastLoginUtc).toISOString(),
          sessionCount: u.sessionCount,
        })),
      });
    }

    // ─── 2) 이번달 사용 시간 TOP ───
    // 세션 사용 시간 = updated_at - created_at (better-auth는 활성 시 updated_at 갱신).
    // 한 세션이 너무 길면(예: 30일 이상) 캡 처리해 이상치 방지.
    const SESSION_DURATION_CAP_HOURS = 24; // 한 세션당 최대 24시간으로 캡
    const monthTopUsers = await db
      .select({
        userId: sessionTable.userId,
        email: userTable.email,
        name: userTable.name,
        totalDurationSeconds: sql<number>`coalesce(sum(
          least(
            extract(epoch from (${sessionTable.updatedAt} - ${sessionTable.createdAt})),
            ${SESSION_DURATION_CAP_HOURS * 3600}
          )
        ), 0)::int`,
        activeDays: sql<number>`count(distinct (${sessionTable.createdAt} + interval '9 hour')::date)::int`,
        sessionCount: sql<number>`count(*)::int`,
        firstSessionUtc: sql<Date>`min(${sessionTable.createdAt})`,
        lastSessionUtc: sql<Date>`max(${sessionTable.createdAt})`,
      })
      .from(sessionTable)
      .innerJoin(userTable, eq(userTable.id, sessionTable.userId))
      .where(
        and(
          gte(sessionTable.createdAt, monthStart),
          sql`${sessionTable.updatedAt} > ${sessionTable.createdAt}`,
        ),
      )
      .groupBy(sessionTable.userId, userTable.email, userTable.name)
      .orderBy(
        desc(
          sql`coalesce(sum(
            least(
              extract(epoch from (${sessionTable.updatedAt} - ${sessionTable.createdAt})),
              ${SESSION_DURATION_CAP_HOURS * 3600}
            )
          ), 0)`,
        ),
      )
      .limit(30);

    return ok({
      weekLogins,
      monthTopUsers: monthTopUsers.map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        totalDurationSeconds: u.totalDurationSeconds,
        totalDurationMinutes: Math.round(u.totalDurationSeconds / 60),
        activeDays: u.activeDays,
        sessionCount: u.sessionCount,
        firstSession: new Date(u.firstSessionUtc).toISOString(),
        lastSession: new Date(u.lastSessionUtc).toISOString(),
      })),
      meta: {
        weekStartKst: new Date(kstStartOf7DaysAgoMs - kstOffsetMs).toISOString(),
        monthStartKst: monthStart.toISOString(),
        sessionDurationCapHours: SESSION_DURATION_CAP_HOURS,
        note: "이용 시간은 세션의 (updated_at - created_at) 합산 (24h/세션 캡). 토큰 갱신 시점 의존이라 실제 활성 시간과는 차이 있을 수 있음.",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
