import { NextRequest, NextResponse } from "next/server";
import { processFailedPaymentRetries } from "@/lib/billing-retry";

/**
 * POST /api/billing/cron/retry
 * 결제 실패 재시도 CRON (Vercel Cron 또는 외부 CRON에서 호출)
 * 헤더에 CRON_SECRET을 포함해야 합니다
 *
 * 6시간마다 실행되어 재시도 대상 결제를 찾아 처리합니다.
 * 재시도 스케줄: 1차 6시간, 2차 24시간, 3차 72시간
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    console.log("[Billing Retry CRON] Starting failed payment retry process");

    const results = await processFailedPaymentRetries();
    const duration = Date.now() - startTime;

    console.log(
      `[Billing Retry CRON] Completed in ${duration}ms - Processed: ${results.totalProcessed}, Success: ${results.successful}, Failed: ${results.failed}`
    );

    return NextResponse.json({
      success: true,
      duration,
      stats: {
        totalProcessed: results.totalProcessed,
        successful: results.successful,
        failed: results.failed,
      },
      results: results.results,
    });
  } catch (error) {
    console.error("[Billing Retry CRON] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}