import {
  listActiveClientsForOperator,
  generateAndStoreReport,
  previousYearMonth,
} from "@/lib/agency/reports";
import { db } from "@/lib/db";
import { agencyClients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCronRoute } from "@/lib/cron/monitor";

/**
 * Vercel Cron: 매월 1일 새벽 — 모든 active 클라이언트의 직전 달 리포트 자동 생성.
 *
 * 운영자 workspace를 알 수 없으므로 모든 active 클라이언트를 순회.
 * 이미 해당 yearMonth 리포트 있으면 update (idempotent).
 * createCronRoute가 CRON_SECRET 검증 + cron_execution_logs 적재 + 실패 알림 처리.
 */
export const POST = createCronRoute({
  name: "agency/monthly-reports",
  handler: async (request) => {
    const { searchParams } = new URL(request.url);
    // 수동 호출 시 yearMonth override 지원, 기본은 직전 달
    const yearMonth = searchParams.get("yearMonth") || previousYearMonth();

    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new Error("yearMonth는 YYYY-MM 형식이어야 합니다");
    }

    // 모든 운영자 workspace에 걸쳐 active 클라이언트 전체
    const clients = await db
      .select()
      .from(agencyClients)
      .where(eq(agencyClients.status, "active"));

    let successCount = 0;
    let errorCount = 0;

    for (const client of clients) {
      try {
        await generateAndStoreReport(client, yearMonth);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    return {
      processed: clients.length,
      metadata: {
        yearMonth,
        clientCount: clients.length,
        successCount,
        errorCount,
      },
    };
  },
});

// dev 편의 + Vercel Cron 호환: GET도 동일 동작
export const GET = POST;

// 보조: listActiveClientsForOperator 미사용 경고 회피 (다른 곳에서도 활용 가능)
void listActiveClientsForOperator;
