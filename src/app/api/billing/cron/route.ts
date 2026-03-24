import { NextRequest, NextResponse } from "next/server";
import { processRenewals } from "@/lib/billing";

/**
 * POST /api/billing/cron
 * 구독 자동 갱신 CRON (Vercel Cron 또는 외부 CRON에서 호출)
 * 헤더에 CRON_SECRET을 포함해야 합니다
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processRenewals();
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("[Billing CRON] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
