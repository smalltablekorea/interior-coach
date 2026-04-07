import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

interface LogActivityParams {
  siteId?: string;
  userId?: string;
  workspaceId?: string;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/** 활동 이력 기록 (fire-and-forget, 에러 시 로그만) */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityLog).values({
      siteId: params.siteId || null,
      userId: params.userId || null,
      workspaceId: params.workspaceId || null,
      actorName: params.actorName || null,
      action: params.action,
      targetType: params.targetType || null,
      targetId: params.targetId || null,
      metadata: params.metadata || null,
    });
  } catch (error) {
    console.error("[ActivityLog] Failed to log activity:", error);
  }
}
