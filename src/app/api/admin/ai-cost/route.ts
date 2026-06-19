import { db } from "@/lib/db";
import { aiUsage, user as userTable } from "@/lib/db/schema";
import { sql, gte, eq, desc } from "drizzle-orm";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";

// Anthropic Claude 가격 ($ per 1M tokens)
// 모델명으로 추정 (정확치 않을 수 있음, 운영 시 갱신)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
  "claude-haiku-4-5": { input: 0.8, output: 4.0 },
};

function priceFor(model: string): { input: number; output: number } {
  if (PRICING[model]) return PRICING[model];
  if (model.includes("haiku")) return { input: 0.8, output: 4.0 };
  if (model.includes("opus")) return { input: 15.0, output: 75.0 };
  return { input: 3.0, output: 15.0 }; // default sonnet
}

function estimateUsd(model: string, inTokens: number, outTokens: number): number {
  const p = priceFor(model);
  return (inTokens * p.input + outTokens * p.output) / 1_000_000;
}

/**
 * GET /api/admin/ai-cost
 *   - 최근 30일 일별 토큰·USD
 *   - 엔드포인트별 토큰·USD
 *   - 사용자별 TOP 20 (이번달 기준)
 *   - 모델별 점유율
 */
export async function GET() {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  try {
    const kstOffsetMs = 9 * 60 * 60 * 1000;
    const kstNowMs = Date.now() + kstOffsetMs;
    const kstStartOfTodayMs = Math.floor(kstNowMs / 86400000) * 86400000;
    const start30DaysAgo = new Date(kstStartOfTodayMs - 29 * 86400000 - kstOffsetMs);

    const kstNow = new Date(kstNowMs);
    const monthStartUtc = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), 1) - kstOffsetMs,
    );

    // 1) 일별 30일
    const dailyRows = await db
      .select({
        day: sql<string>`to_char((${aiUsage.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`,
        model: aiUsage.model,
        inputTokens: sql<number>`sum(${aiUsage.inputTokens})::int`,
        outputTokens: sql<number>`sum(${aiUsage.outputTokens})::int`,
        cacheCreate: sql<number>`sum(${aiUsage.cacheCreationTokens})::int`,
        cacheRead: sql<number>`sum(${aiUsage.cacheReadTokens})::int`,
        calls: sql<number>`count(*)::int`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, start30DaysAgo))
      .groupBy(
        sql`to_char((${aiUsage.createdAt} + interval '9 hour')::date, 'YYYY-MM-DD')`,
        aiUsage.model,
      );

    // 일별로 묶고 USD 계산
    const dailyMap = new Map<
      string,
      { inputTokens: number; outputTokens: number; calls: number; usd: number }
    >();
    for (const r of dailyRows) {
      const prev = dailyMap.get(r.day) ?? {
        inputTokens: 0,
        outputTokens: 0,
        calls: 0,
        usd: 0,
      };
      prev.inputTokens += r.inputTokens;
      prev.outputTokens += r.outputTokens;
      prev.calls += r.calls;
      prev.usd += estimateUsd(r.model, r.inputTokens, r.outputTokens);
      dailyMap.set(r.day, prev);
    }

    // 30일 모두 생성 (없는 날 0)
    const dailySeries = [];
    for (let i = 29; i >= 0; i--) {
      const ms = kstStartOfTodayMs - i * 86400000;
      const d = new Date(ms);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      const v = dailyMap.get(key) ?? {
        inputTokens: 0,
        outputTokens: 0,
        calls: 0,
        usd: 0,
      };
      dailySeries.push({ date: key, ...v });
    }

    // 2) 엔드포인트별 (이번달)
    const byEndpoint = await db
      .select({
        endpoint: aiUsage.endpoint,
        model: aiUsage.model,
        inputTokens: sql<number>`sum(${aiUsage.inputTokens})::int`,
        outputTokens: sql<number>`sum(${aiUsage.outputTokens})::int`,
        calls: sql<number>`count(*)::int`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, monthStartUtc))
      .groupBy(aiUsage.endpoint, aiUsage.model);

    const endpointMap = new Map<
      string,
      { inputTokens: number; outputTokens: number; calls: number; usd: number; models: Set<string> }
    >();
    for (const r of byEndpoint) {
      const prev = endpointMap.get(r.endpoint) ?? {
        inputTokens: 0,
        outputTokens: 0,
        calls: 0,
        usd: 0,
        models: new Set<string>(),
      };
      prev.inputTokens += r.inputTokens;
      prev.outputTokens += r.outputTokens;
      prev.calls += r.calls;
      prev.usd += estimateUsd(r.model, r.inputTokens, r.outputTokens);
      prev.models.add(r.model.replace(/^claude-/, ""));
      endpointMap.set(r.endpoint, prev);
    }
    const endpointStats = Array.from(endpointMap.entries())
      .map(([endpoint, v]) => ({
        endpoint,
        models: Array.from(v.models),
        calls: v.calls,
        inputTokens: v.inputTokens,
        outputTokens: v.outputTokens,
        totalTokens: v.inputTokens + v.outputTokens,
        usd: v.usd,
      }))
      .sort((a, b) => b.usd - a.usd);

    // 3) 사용자 TOP 20 (이번달)
    const byUser = await db
      .select({
        userId: aiUsage.userId,
        email: userTable.email,
        name: userTable.name,
        model: aiUsage.model,
        inputTokens: sql<number>`sum(${aiUsage.inputTokens})::int`,
        outputTokens: sql<number>`sum(${aiUsage.outputTokens})::int`,
        calls: sql<number>`count(*)::int`,
      })
      .from(aiUsage)
      .innerJoin(userTable, eq(userTable.id, aiUsage.userId))
      .where(gte(aiUsage.createdAt, monthStartUtc))
      .groupBy(aiUsage.userId, userTable.email, userTable.name, aiUsage.model);

    const userMap = new Map<
      string,
      {
        userId: string;
        email: string;
        name: string;
        inputTokens: number;
        outputTokens: number;
        calls: number;
        usd: number;
      }
    >();
    for (const r of byUser) {
      const prev = userMap.get(r.userId) ?? {
        userId: r.userId,
        email: r.email,
        name: r.name,
        inputTokens: 0,
        outputTokens: 0,
        calls: 0,
        usd: 0,
      };
      prev.inputTokens += r.inputTokens;
      prev.outputTokens += r.outputTokens;
      prev.calls += r.calls;
      prev.usd += estimateUsd(r.model, r.inputTokens, r.outputTokens);
      userMap.set(r.userId, prev);
    }
    const topUsers = Array.from(userMap.values())
      .sort((a, b) => b.usd - a.usd)
      .slice(0, 20);

    // 4) 모델별 (전체)
    const modelTotalsRows = await db
      .select({
        model: aiUsage.model,
        inputTokens: sql<number>`sum(${aiUsage.inputTokens})::int`,
        outputTokens: sql<number>`sum(${aiUsage.outputTokens})::int`,
        calls: sql<number>`count(*)::int`,
      })
      .from(aiUsage)
      .groupBy(aiUsage.model);
    const modelTotals = modelTotalsRows
      .map((r) => ({
        model: r.model,
        calls: r.calls,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        usd: estimateUsd(r.model, r.inputTokens, r.outputTokens),
      }))
      .sort((a, b) => b.usd - a.usd);

    // 요약
    const monthSummary = {
      calls: dailySeries.reduce((s, d) => {
        // 30일 안에 이번달만 합산
        const dateMs = new Date(d.date).getTime();
        return dateMs >= monthStartUtc.getTime() ? s + d.calls : s;
      }, 0),
      usd: dailySeries.reduce((s, d) => {
        const dateMs = new Date(d.date).getTime();
        return dateMs >= monthStartUtc.getTime() ? s + d.usd : s;
      }, 0),
    };
    const todayUsd = dailySeries[dailySeries.length - 1]?.usd ?? 0;
    const todayCalls = dailySeries[dailySeries.length - 1]?.calls ?? 0;

    return ok({
      generatedAt: new Date().toISOString(),
      summary: {
        todayCalls,
        todayUsd,
        monthCalls: monthSummary.calls,
        monthUsd: monthSummary.usd,
      },
      dailySeries,
      endpointStats,
      topUsers,
      modelTotals,
      pricingNote:
        "USD 추정값은 Sonnet 4 = $3/$15, Haiku 4.5 = $0.80/$4 per 1M tokens 기준. 실제 Anthropic 청구액과 차이 있을 수 있음.",
    });
  } catch (error) {
    return serverError(error);
  }
}

// desc 미사용 import suppress
void desc;
