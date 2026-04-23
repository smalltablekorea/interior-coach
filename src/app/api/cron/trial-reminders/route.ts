import { createCronRoute } from "@/lib/cron/monitor";
import { runTrialSweep } from "@/lib/subscription/trial";

/** Vercel Cron: 체험 리마인드 + 만료 처리 (매일 10:00 KST 권장) */
export const POST = createCronRoute({
  name: "subscription/trial-sweep",
  handler: async () => {
    const r = await runTrialSweep();
    return {
      processed: r.remindersSent + r.expiredDowngraded,
      metadata: {
        remindersSent: r.remindersSent,
        expiredDowngraded: r.expiredDowngraded,
        smsFailures: r.smsFailures,
      },
    };
  },
});
