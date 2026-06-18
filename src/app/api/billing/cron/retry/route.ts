import { processFailedPaymentRetries } from "@/lib/billing-retry";
import { createCronRoute } from "@/lib/cron/monitor";

/**
 * Vercel Cron: 결제 실패 재시도 (6시간마다)
 * 재시도 스케줄: 1차 6시간, 2차 24시간, 3차 72시간
 */
export const POST = createCronRoute({
  name: "billing/cron/retry",
  handler: async () => {
    const results = await processFailedPaymentRetries();
    return {
      processed: results.totalProcessed,
      metadata: {
        successful: results.successful,
        failed: results.failed,
        totalProcessed: results.totalProcessed,
      },
    };
  },
});

// Vercel Cron 호환: 기본 GET 호출도 동일 핸들러로 처리.
export const GET = POST;
