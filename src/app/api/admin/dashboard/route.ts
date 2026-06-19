import { db } from "@/lib/db";
import {
  user as userTable,
  session as sessionTable,
  workspaces,
  contracts,
  demoRequests,
  analysisResults,
  aiUsage,
} from "@/lib/db/schema";
import { sql, gte, eq, desc, isNull } from "drizzle-orm";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";

/**
 * GET /api/admin/dashboard
 *
 * 어드민 메인 대시보드 통합 KPI.
 * - 오늘/이번달/총 가입자
 * - 오늘/이번달/누적 로그인
 * - 워크스페이스·계약·분석권 사용·AI 호출 총량
 * - 데모 신청 대기 수
 * - 최근 가입자 5명
 * - 30일 가입 추세
 */
export async function GET() {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  try {
    // KST 기준 자정·이번달 시작
    const kstOffsetMs = 9 * 60 * 60 * 1000;
    const kstNowMs = Date.now() + kstOffsetMs;
    const kstStartOfTodayMs = Math.floor(kstNowMs / 86400000) * 86400000;
    const todayStartUtc = new Date(kstStartOfTodayMs - kstOffsetMs);
    const kstNow = new Date(kstNowMs);
    const monthStartUtc = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), 1) - kstOffsetMs,
    );
    const start30DaysAgo = new Date(kstStartOfTodayMs - 29 * 86400000 - kstOffsetMs);

    // 병렬 쿼리
    const [
      userStatsRow,
      sessionStatsRow,
      workspaceCount,
      contractStatsRow,
      analysisStatsRow,
      aiStatsRow,
      demoStatsRow,
      recentSignupsRows,
      signupSeriesRows,
    ] = await Promise.all([
      // 사용자: 오늘/이번달/총
      db
        .select({
          total: sql<number>`count(*)::int`,
          month: sql<number>`count(*) filter (where ${userTable.createdAt} >= ${monthStartUtc})::int`,
          today: sql<number>`count(*) filter (where ${userTable.createdAt} >= ${todayStartUtc})::int`,
        })
        .from(userTable)
        .then((r) => r[0]),

      // 로그인 (세션): 오늘/이번달
      db
        .select({
          today: sql<number>`count(distinct ${sessionTable.userId}) filter (where ${sessionTable.createdAt} >= ${todayStartUtc})::int`,
          month: sql<number>`count(distinct ${sessionTable.userId}) filter (where ${sessionTable.createdAt} >= ${monthStartUtc})::int`,
        })
        .from(sessionTable)
        .then((r) => r[0]),

      // 워크스페이스
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(workspaces)
        .then((r) => r[0].count),

      // 계약 금액 합계
      db
        .select({
          count: sql<number>`count(*)::int`,
          totalAmount: sql<number>`coalesce(sum(${contracts.contractAmount}), 0)::bigint`,
        })
        .from(contracts)
        .where(isNull(contracts.deletedAt))
        .then((r) => r[0]),

      // 분석권 사용 (이번달 / 총)
      db
        .select({
          total: sql<number>`count(*)::int`,
          month: sql<number>`count(*) filter (where ${analysisResults.createdAt} >= ${monthStartUtc})::int`,
        })
        .from(analysisResults)
        .then((r) => r[0]),

      // AI 호출 (이번달 / 총)
      db
        .select({
          total: sql<number>`count(*)::int`,
          month: sql<number>`count(*) filter (where ${aiUsage.createdAt} >= ${monthStartUtc})::int`,
          monthInputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}) filter (where ${aiUsage.createdAt} >= ${monthStartUtc}), 0)::int`,
          monthOutputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}) filter (where ${aiUsage.createdAt} >= ${monthStartUtc}), 0)::int`,
        })
        .from(aiUsage)
        .then((r) => r[0]),

      // 데모 신청 (대기 = new / 전체)
      db
        .select({
          total: sql<number>`count(*)::int`,
          pending: sql<number>`count(*) filter (where ${demoRequests.status} = 'new')::int`,
        })
        .from(demoRequests)
        .then((r) => r[0]),

      // 최근 가입자 5명
      db
        .select({
          id: userTable.id,
          email: userTable.email,
          name: userTable.name,
          createdAt: userTable.createdAt,
        })
        .from(userTable)
        .orderBy(desc(userTable.createdAt))
        .limit(5),

      // 30일 가입 추세 (KST 일자 기준)
      db
        .select({
          day: sql<string>`to_char((${userTable.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(userTable)
        .where(gte(userTable.createdAt, start30DaysAgo))
        .groupBy(
          sql`to_char((${userTable.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`,
        ),
    ]);

    // 30일 series 보완 (없는 날 0)
    const signupMap = new Map(signupSeriesRows.map((r) => [r.day, r.count]));
    const signupSeries: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const ms = kstStartOfTodayMs - i * 86400000;
      const d = new Date(ms);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      signupSeries.push({ date: key, count: signupMap.get(key) ?? 0 });
    }

    // 이번달 AI 추정 비용 (USD)
    const sonnetEstUsd =
      (aiStatsRow.monthInputTokens * 3 + aiStatsRow.monthOutputTokens * 15) /
      1_000_000;

    return ok({
      generatedAt: new Date().toISOString(),
      kpi: {
        users: {
          total: userStatsRow.total,
          month: userStatsRow.month,
          today: userStatsRow.today,
        },
        logins: {
          today: sessionStatsRow.today,
          month: sessionStatsRow.month,
        },
        workspaces: workspaceCount,
        contracts: {
          count: contractStatsRow.count,
          totalAmount: Number(contractStatsRow.totalAmount),
        },
        analyses: {
          total: analysisStatsRow.total,
          month: analysisStatsRow.month,
        },
        ai: {
          callsTotal: aiStatsRow.total,
          callsMonth: aiStatsRow.month,
          monthInputTokens: aiStatsRow.monthInputTokens,
          monthOutputTokens: aiStatsRow.monthOutputTokens,
          monthEstUsd: sonnetEstUsd,
        },
        demoRequests: {
          total: demoStatsRow.total,
          pending: demoStatsRow.pending,
        },
      },
      recentSignups: recentSignupsRows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        createdAt: r.createdAt,
      })),
      signupSeries,
    });
  } catch (error) {
    return serverError(error);
  }
}
