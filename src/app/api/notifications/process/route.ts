import { processQueue } from "@/lib/notifications/queue";
import { ok, err, serverError } from "@/lib/api/response";

/** Vercel Cron: 큐 처리 (5분 간격) */
export async function POST(request: Request) {
  // Cron 인증
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return err("Unauthorized", 401);
  }

  try {
    const result = await processQueue();

    return ok({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[NotificationProcess] Fatal error:", error);
    return serverError(error);
  }
}
