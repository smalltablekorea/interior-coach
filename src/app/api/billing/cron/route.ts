import { processRenewals, processRetries, processTrialExpirations } from "@/lib/billing";
import { createCronRoute } from "@/lib/cron/monitor";

/**
 * Vercel Cron: 구독 자동 갱신 + 결제 재시도 + 트라이얼 만료 (매일 02:00)
 * createCronRoute가 CRON_SECRET 검증 + cron_execution_logs 적재 + 실패 알림 모두 처리.
 */
export const POST = createCronRoute({
  name: "billing/cron",
  handler: async () => {
    const [renewals, retries, trials] = await Promise.all([
      processRenewals(),
      processRetries(),
      processTrialExpirations(),
    ]);
    return {
      processed: renewals.length + retries.length + trials.length,
      metadata: {
        renewals: renewals.length,
        retries: retries.length,
        trials: trials.length,
      },
    };
  },
});

// Vercel Cron 호환: 기본 GET 호출도 동일 핸들러로 처리.
export const GET = POST;
