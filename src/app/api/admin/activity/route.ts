import { NextRequest } from "next/server";
import { sql, gte, eq } from "drizzle-orm";
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
    // 이전 방식(session.updated_at - created_at)은 better-auth가 토큰 만료 시점에만
    // updated_at을 갱신해 모든 사용자가 정확히 24h·48h 같은 정수배로만 잡혔음.
    //
    // 대안: 사용자의 모든 "활동 이벤트"(session 생성·ai_usage·activity_log)를 시간 순으로
    //       나열한 뒤 인접 이벤트 간격이 30분 이하면 같은 세션으로 묶음. 각 세션의 길이는
    //       (마지막 이벤트 - 첫 이벤트) + 5분 (마지막 활동 후 추정 활성 시간).
    //
    // 30분 갭 임계 = 일반적인 idle 기준. 5분 padding = 세션이 단일 이벤트일 때 0이 되지 않도록.
    const GAP_THRESHOLD_SECONDS = 1800; // 30분
    const TRAILING_PADDING_SECONDS = 300; // 5분

    const monthRows = (await db.execute(sql`
      WITH events AS (
        SELECT user_id, created_at FROM session WHERE created_at >= ${monthStart}
        UNION ALL
        SELECT user_id, created_at FROM ai_usage WHERE created_at >= ${monthStart}
        UNION ALL
        SELECT user_id, created_at FROM activity_log
          WHERE created_at >= ${monthStart} AND user_id IS NOT NULL
      ),
      sorted AS (
        SELECT user_id, created_at,
          LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_at
        FROM events
      ),
      session_marks AS (
        SELECT user_id, created_at,
          CASE WHEN prev_at IS NULL
            OR EXTRACT(EPOCH FROM (created_at - prev_at)) > ${GAP_THRESHOLD_SECONDS}
            THEN 1 ELSE 0 END AS new_session
        FROM sorted
      ),
      session_ids AS (
        SELECT user_id, created_at,
          SUM(new_session) OVER (PARTITION BY user_id ORDER BY created_at) AS session_no
        FROM session_marks
      ),
      session_durations AS (
        SELECT user_id, session_no,
          MIN(created_at) AS started_at,
          MAX(created_at) AS ended_at,
          EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))
            + ${TRAILING_PADDING_SECONDS} AS seconds
        FROM session_ids
        GROUP BY user_id, session_no
      ),
      per_user AS (
        SELECT
          sd.user_id,
          ROUND(SUM(sd.seconds))::int AS total_seconds,
          COUNT(*)::int AS session_count,
          COUNT(DISTINCT (sd.started_at + interval '9 hour')::date)::int AS active_days,
          MIN(sd.started_at) AS first_event,
          MAX(sd.ended_at) AS last_event
        FROM session_durations sd
        GROUP BY sd.user_id
      )
      SELECT
        pu.user_id AS "userId",
        u.email,
        u.name,
        pu.total_seconds AS "totalSeconds",
        pu.session_count AS "sessionCount",
        pu.active_days AS "activeDays",
        pu.first_event AS "firstEvent",
        pu.last_event AS "lastEvent"
      FROM per_user pu
      INNER JOIN "user" u ON u.id = pu.user_id
      ORDER BY pu.total_seconds DESC
      LIMIT 30
    `)) as unknown as
      | {
          rows: Array<{
            userId: string;
            email: string;
            name: string;
            totalSeconds: number;
            sessionCount: number;
            activeDays: number;
            firstEvent: Date;
            lastEvent: Date;
          }>;
        }
      | Array<{
          userId: string;
          email: string;
          name: string;
          totalSeconds: number;
          sessionCount: number;
          activeDays: number;
          firstEvent: Date;
          lastEvent: Date;
        }>;

    // drizzle pg driver는 { rows, rowCount } / neon-http는 raw array를 반환 — 양쪽 호환
    const rowsList = Array.isArray(monthRows)
      ? monthRows
      : (monthRows.rows ?? []);

    return ok({
      weekLogins,
      monthTopUsers: rowsList.map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        totalDurationSeconds: u.totalSeconds,
        totalDurationMinutes: Math.round(u.totalSeconds / 60),
        activeDays: u.activeDays,
        sessionCount: u.sessionCount,
        firstSession: new Date(u.firstEvent).toISOString(),
        lastSession: new Date(u.lastEvent).toISOString(),
      })),
      meta: {
        weekStartKst: new Date(kstStartOf7DaysAgoMs - kstOffsetMs).toISOString(),
        monthStartKst: monthStart.toISOString(),
        gapThresholdMinutes: GAP_THRESHOLD_SECONDS / 60,
        trailingPaddingMinutes: TRAILING_PADDING_SECONDS / 60,
        note: "활동 이벤트(session·ai_usage·activity_log)를 30분 갭으로 세션화한 추정값. 마지막 활동 후 5분 padding. 도메인 활동(현장 등록 등)이 적으면 실제 화면 활동 시간보다 짧게 잡힐 수 있음.",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
