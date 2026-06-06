import { processQueue } from "@/lib/notifications/queue";
import { createCronRoute } from "@/lib/cron/monitor";

/** Vercel Cron: 알림 큐 처리 (매일 09:00) */
export const POST = createCronRoute({
  name: "notifications/process",
  handler: async () => {
    const result = await processQueue();
    return {
      processed: result.processed,
      metadata: {
        processed: result.processed,
        failed: result.failed,
        skipped: result.skipped,
      },
    };
  },
});

// Vercel Cron 호환: 기본 GET 호출도 동일 핸들러로 처리.
export const GET = POST;
