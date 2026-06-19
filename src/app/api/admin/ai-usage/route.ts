import { NextRequest } from "next/server";
import { sql, desc, gte, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiUsage, user as userTable } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";

// 입력/출력 토큰 단가 (USD per million) — 모니터링 비용 추정용.
// 정확성보다 트렌드 파악 목적. 모델 추가될 때 케이스 늘리면 됨.
const PRICING_PER_M: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5, cacheRead: 0.1 },
  "claude-opus-4-7": { input: 15, output: 75, cacheRead: 1.5 },
  "claude-opus-4-8": { input: 15, output: 75, cacheRead: 1.5 },
};

function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
): number {
  const p = PRICING_PER_M[model];
  if (!p) return 0;
  const inputRegular = Math.max(0, inputTokens - cacheReadTokens);
  return (
    (inputRegular * p.input + outputTokens * p.output + cacheReadTokens * p.cacheRead) / 1_000_000
  );
}

/**
 * GET /api/admin/ai-usage
 *   ?days=7 (기본 7일, 최대 30)
 *
 * - 일자별 토큰/비용 추이 (KST)
 * - endpoint별 호출 수/토큰 합계
 * - 모델별 합계
 * - 사용자 TOP 20 (호출 수 기준)
 */
export async function GET(req: NextRequest) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  try {
    const sp = req.nextUrl.searchParams;
    const days = Math.min(30, Math.max(1, Number(sp.get("days") || "7")));
    const since = new Date(Date.now() - days * 86400000);

    // 1) 일자별 (KST)
    type DayRow = {
      date: string;
      calls: number;
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheCreationTokens: number;
    };
    const daily = (await db
      .select({
        date: sql<string>`to_char((${aiUsage.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`,
        calls: sql<number>`count(*)::int`,
        inputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::int`,
        outputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::int`,
        cacheReadTokens: sql<number>`coalesce(sum(${aiUsage.cacheReadTokens}), 0)::int`,
        cacheCreationTokens: sql<number>`coalesce(sum(${aiUsage.cacheCreationTokens}), 0)::int`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since))
      .groupBy(sql`to_char((${aiUsage.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char((${aiUsage.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`)) as DayRow[];

    // 2) endpoint별
    const byEndpoint = await db
      .select({
        endpoint: aiUsage.endpoint,
        calls: sql<number>`count(*)::int`,
        inputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::int`,
        outputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::int`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since))
      .groupBy(aiUsage.endpoint)
      .orderBy(desc(sql`count(*)`));

    // 3) 모델별
    const byModel = await db
      .select({
        model: aiUsage.model,
        calls: sql<number>`count(*)::int`,
        inputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::int`,
        outputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::int`,
        cacheReadTokens: sql<number>`coalesce(sum(${aiUsage.cacheReadTokens}), 0)::int`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since))
      .groupBy(aiUsage.model)
      .orderBy(desc(sql`count(*)`));

    // 4) 사용자 TOP 20 (호출 수 기준)
    const topUsers = await db
      .select({
        userId: aiUsage.userId,
        email: userTable.email,
        name: userTable.name,
        calls: sql<number>`count(*)::int`,
        inputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::int`,
        outputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::int`,
        lastCall: sql<Date>`max(${aiUsage.createdAt})`,
      })
      .from(aiUsage)
      .innerJoin(userTable, eq(userTable.id, aiUsage.userId))
      .where(gte(aiUsage.createdAt, since))
      .groupBy(aiUsage.userId, userTable.email, userTable.name)
      .orderBy(desc(sql`count(*)`))
      .limit(20);

    // 총합
    const totals = daily.reduce(
      (acc, d) => ({
        calls: acc.calls + d.calls,
        inputTokens: acc.inputTokens + d.inputTokens,
        outputTokens: acc.outputTokens + d.outputTokens,
        cacheReadTokens: acc.cacheReadTokens + d.cacheReadTokens,
      }),
      { calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 },
    );

    return ok({
      windowDays: days,
      since: since.toISOString(),
      totals: {
        ...totals,
        // 모델별 비용 합 (정확치는 byModel 분리. 대략 합산)
        estimatedCostUsd:
          byModel.reduce(
            (s, m) =>
              s +
              estimateCostUsd(m.model, m.inputTokens, m.outputTokens, m.cacheReadTokens ?? 0),
            0,
          ),
      },
      daily: daily.map((d) => ({
        date: d.date,
        calls: d.calls,
        inputTokens: d.inputTokens,
        outputTokens: d.outputTokens,
        cacheReadTokens: d.cacheReadTokens,
      })),
      byEndpoint: byEndpoint.map((e) => ({
        endpoint: e.endpoint,
        calls: e.calls,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
      })),
      byModel: byModel.map((m) => ({
        model: m.model,
        calls: m.calls,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        cacheReadTokens: m.cacheReadTokens,
        estimatedCostUsd: estimateCostUsd(
          m.model,
          m.inputTokens,
          m.outputTokens,
          m.cacheReadTokens ?? 0,
        ),
      })),
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        calls: u.calls,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        lastCall: u.lastCall ? new Date(u.lastCall).toISOString() : null,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
