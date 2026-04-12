/**
 * 견적 변경 이력 기록 유틸
 */
import { db } from "@/lib/db";
import { estimateHistory } from "@/lib/db/schema";

interface AuditLogParams {
  estimateId: string;
  userId: string;
  action: "created" | "updated" | "status_changed" | "items_updated" | "shared" | "duplicated";
  changes?: Record<string, { old: unknown; new: unknown }>;
  snapshot?: Record<string, unknown>;
}

export async function logEstimateChange(params: AuditLogParams) {
  try {
    await db.insert(estimateHistory).values({
      estimateId: params.estimateId,
      userId: params.userId,
      action: params.action,
      changes: params.changes ?? null,
      snapshot: params.snapshot ?? null,
    });
  } catch (error) {
    // audit log 실패가 메인 동작을 막으면 안 됨
    console.error("[estimate-audit] Failed to log:", error);
  }
}
