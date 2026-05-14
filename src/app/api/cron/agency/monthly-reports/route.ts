import { ok, err, serverError } from "@/lib/api/response";
import {
  listActiveClientsForOperator,
  generateAndStoreReport,
  previousYearMonth,
} from "@/lib/agency/reports";
import { db } from "@/lib/db";
import { agencyClients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Vercel Cron: 매월 1일 새벽 — 모든 active 클라이언트의 직전 달 리포트 자동 생성.
 *
 * 운영자 workspace를 알 수 없으므로 모든 active 클라이언트를 순회.
 * 이미 해당 yearMonth 리포트 있으면 update (idempotent).
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return err("Unauthorized", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    // 수동 호출 시 yearMonth override 지원, 기본은 직전 달
    const yearMonth = searchParams.get("yearMonth") || previousYearMonth();

    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return err("yearMonth는 YYYY-MM 형식이어야 합니다");
    }

    // 모든 운영자 workspace에 걸쳐 active 클라이언트 전체
    const clients = await db
      .select()
      .from(agencyClients)
      .where(eq(agencyClients.status, "active"));

    const results: Array<{
      clientId: string;
      businessName: string;
      reportId?: string;
      totalPublished?: number;
      error?: string;
    }> = [];

    for (const client of clients) {
      try {
        const { report, stats } = await generateAndStoreReport(client, yearMonth);
        results.push({
          clientId: client.id,
          businessName: client.businessName,
          reportId: report.id,
          totalPublished: stats.totalPublished,
        });
      } catch (e) {
        results.push({
          clientId: client.id,
          businessName: client.businessName,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[agency:cron:reports] yearMonth=${yearMonth} processed=${clients.length}`);

    return ok({
      yearMonth,
      processed: clients.length,
      results,
    });
  } catch (error) {
    return serverError(error);
  }
}

// dev 편의: GET도 동일 동작
export const GET = POST;

// 보조: listActiveClientsForOperator 미사용 경고 회피 (다른 곳에서도 활용 가능)
void listActiveClientsForOperator;
