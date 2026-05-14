import { NextRequest, NextResponse } from "next/server";
import { processRenewals, processRetries, processTrialExpirations } from "@/lib/billing";

/**
 * POST /api/billing/cron
 * 구독 자동 갱신 + 결제 재시도 + 트라이얼 만료 CRON
 * Vercel Cron 또는 외부 CRON에서 매일 1회 호출
 * 헤더에 CRON_SECRET을 포함해야 합니다
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [renewals, retries, trials] = await Promise.all([
      processRenewals(),
      processRetries(),
      processTrialExpirations(),
    ]);

    return NextResponse.json({
      success: true,
      renewals: { processed: renewals.length, results: renewals },
      retries: { processed: retries.length, results: retries },
      trials: { processed: trials.length, results: trials },
    });
  } catch (error) {
    console.error("[Billing CRON] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
