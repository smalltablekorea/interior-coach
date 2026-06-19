import { NextRequest } from "next/server";
import { sql, desc, eq, gte, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { cronExecutionLogs } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";

/**
 * GET /api/admin/crons
 *
 * cron_execution_logs 기반:
 * - cron별 7일 통계 (success/fail count, last run, last error, p50 duration)
 * - 최근 실행 50건 타임라인
 */
export async function GET(_req: NextRequest) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    // cron별 통계
    const stats = await db
      .select({
        cronName: cronExecutionLogs.cronName,
        ok: sql<number>`sum(case when ${cronExecutionLogs.success} then 1 else 0 end)::int`,
        fail: sql<number>`sum(case when not ${cronExecutionLogs.success} then 1 else 0 end)::int`,
        lastRun: sql<Date>`max(${cronExecutionLogs.completedAt})`,
        avgDurationMs: sql<number>`coalesce(round(avg(${cronExecutionLogs.durationMs})), 0)::int`,
        lastError: sql<string | null>`max(case when not ${cronExecutionLogs.success} then ${cronExecutionLogs.errorMessage} end)`,
      })
      .from(cronExecutionLogs)
      .where(gte(cronExecutionLogs.completedAt, sevenDaysAgo))
      .groupBy(cronExecutionLogs.cronName)
      .orderBy(cronExecutionLogs.cronName);

    // 최근 실행 50건
    const recent = await db
      .select({
        id: cronExecutionLogs.id,
        cronName: cronExecutionLogs.cronName,
        success: cronExecutionLogs.success,
        processed: cronExecutionLogs.processed,
        durationMs: cronExecutionLogs.durationMs,
        metadata: cronExecutionLogs.metadata,
        errorMessage: cronExecutionLogs.errorMessage,
        completedAt: cronExecutionLogs.completedAt,
      })
      .from(cronExecutionLogs)
      .orderBy(desc(cronExecutionLogs.completedAt))
      .limit(50);

    // 연속 실패 카운트 — 가장 최근 실행이 실패면 그 연속 실패 수
    const consecutiveFails: Record<string, number> = {};
    for (const s of stats) {
      const lastN = await db
        .select({ success: cronExecutionLogs.success })
        .from(cronExecutionLogs)
        .where(eq(cronExecutionLogs.cronName, s.cronName))
        .orderBy(desc(cronExecutionLogs.completedAt))
        .limit(10);
      let streak = 0;
      for (const r of lastN) {
        if (r.success) break;
        streak++;
      }
      consecutiveFails[s.cronName] = streak;
    }

    return ok({
      stats: stats.map((s) => ({
        cronName: s.cronName,
        ok: s.ok,
        fail: s.fail,
        successRate: s.ok + s.fail > 0 ? Math.round((s.ok / (s.ok + s.fail)) * 100) : null,
        lastRun: s.lastRun ? new Date(s.lastRun).toISOString() : null,
        avgDurationMs: s.avgDurationMs,
        lastError: s.lastError,
        consecutiveFails: consecutiveFails[s.cronName] ?? 0,
      })),
      recent: recent.map((r) => ({
        id: r.id,
        cronName: r.cronName,
        success: r.success,
        processed: r.processed,
        durationMs: r.durationMs,
        metadata: r.metadata,
        errorMessage: r.errorMessage,
        completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
