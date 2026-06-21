import { NextRequest } from "next/server";
import { and, eq, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sites,
  dailyLogs,
  dailyLogShareTokens,
} from "@/lib/db/schema";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * GET /api/public/daily-logs/[token]
 *   고객 무인증으로 공유된 일지 목록 조회.
 *   - 토큰 검증
 *   - 그 현장의 shared_to_customer=true 인 일지만 일자 내림차순 반환
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return err("token 필수", 400);

  try {
    const [share] = await db
      .select({
        id: dailyLogShareTokens.id,
        siteId: dailyLogShareTokens.siteId,
        expiresAt: dailyLogShareTokens.expiresAt,
        revokedAt: dailyLogShareTokens.revokedAt,
      })
      .from(dailyLogShareTokens)
      .where(eq(dailyLogShareTokens.token, token));

    if (!share) return err("유효하지 않은 링크입니다", 404);
    if (share.revokedAt) return err("취소된 링크입니다", 410);
    if (share.expiresAt && share.expiresAt < new Date())
      return err("만료된 링크입니다", 410);

    const [site] = await db
      .select({
        id: sites.id,
        name: sites.name,
        address: sites.address,
        startDate: sites.startDate,
        endDate: sites.endDate,
        status: sites.status,
      })
      .from(sites)
      .where(and(eq(sites.id, share.siteId), isNull(sites.deletedAt)));

    if (!site) return err("현장 정보를 찾을 수 없습니다", 404);

    const logs = await db
      .select({
        id: dailyLogs.id,
        authorName: dailyLogs.authorName,
        logDate: dailyLogs.logDate,
        tradesWorkedNames: dailyLogs.tradesWorkedNames,
        summary: dailyLogs.summary,
        detail: dailyLogs.detail,
        photoUrls: dailyLogs.photoUrls,
        weather: dailyLogs.weather,
        workerCount: dailyLogs.workerCount,
        nextDayPlan: dailyLogs.nextDayPlan,
      })
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.siteId, share.siteId),
          eq(dailyLogs.sharedToCustomer, true),
        ),
      )
      .orderBy(desc(dailyLogs.logDate));

    return ok({
      site,
      logs,
      total: logs.length,
    });
  } catch (e) {
    return serverError(e);
  }
}
