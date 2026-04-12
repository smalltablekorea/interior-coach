/**
 * 견적 상태 변경 시 알림 생성
 */
import { db } from "@/lib/db";
import { notifications, estimates, sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STATUS_LABELS: Record<string, string> = {
  "발송": "견적서가 발송되었습니다",
  "승인": "견적서가 승인되었습니다",
  "거절": "견적서가 거절되었습니다",
  "확정": "견적서가 확정되었습니다",
};

interface NotifyParams {
  estimateId: string;
  newStatus: string;
  userId: string;
  workspaceId: string | null;
}

export async function notifyEstimateStatusChange(params: NotifyParams) {
  const label = STATUS_LABELS[params.newStatus];
  if (!label) return; // 알림 대상이 아닌 상태

  try {
    // 견적 정보 조회
    const [est] = await db
      .select({
        id: estimates.id,
        siteId: estimates.siteId,
        metadata: estimates.metadata,
        userId: estimates.userId,
      })
      .from(estimates)
      .where(eq(estimates.id, params.estimateId));

    if (!est) return;

    let siteName = "현장";
    if (est.siteId) {
      const [site] = await db.select({ name: sites.name }).from(sites).where(eq(sites.id, est.siteId));
      if (site) siteName = site.name;
    } else {
      const meta = (est.metadata as Record<string, unknown>) || {};
      if (meta.title) siteName = meta.title as string;
    }

    // 견적 소유자에게 알림 (자기 자신이 변경한 경우에도 기록)
    await db.insert(notifications).values({
      userId: est.userId,
      workspaceId: params.workspaceId,
      type: "estimate_status",
      title: `[${siteName}] ${label}`,
      message: `${siteName} 견적서 상태가 "${params.newStatus}"(으)로 변경되었습니다.`,
      link: `/estimates/${params.estimateId}`,
      metadata: {
        estimateId: params.estimateId,
        status: params.newStatus,
        changedBy: params.userId,
      },
    });
  } catch (error) {
    console.error("[estimate-notify] Failed:", error);
  }
}
