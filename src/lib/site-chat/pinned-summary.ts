import { db } from "@/lib/db";
import {
  siteChatRooms,
  siteChatPinnedSummary,
  constructionPhases,
  contractPayments,
  contracts,
  defects,
  sites,
} from "@/lib/db/schema";
import { eq, and, ne, sql, asc } from "drizzle-orm";
import { broadcastToRoom } from "./utils";

/**
 * 특정 현장(siteId)에 연결된 톡방의 pinned_summary를 갱신합니다.
 * 공정/수금/하자 변경 시 호출.
 */
export async function refreshPinnedSummary(siteId: string) {
  // 현장에 연결된 톡방 찾기
  const rooms = await db
    .select({ id: siteChatRooms.id })
    .from(siteChatRooms)
    .where(eq(siteChatRooms.siteId, siteId));

  if (rooms.length === 0) return;

  // 1. 전체 공정 진행률 계산
  const phases = await db
    .select({
      progress: constructionPhases.progress,
      status: constructionPhases.status,
    })
    .from(constructionPhases)
    .where(eq(constructionPhases.siteId, siteId));

  let currentProgressPercent = 0;
  if (phases.length > 0) {
    const totalProgress = phases.reduce((sum, p) => sum + (p.progress || 0), 0);
    currentProgressPercent = Math.round(totalProgress / phases.length);
  }

  // 2. 다음 마일스톤 (진행 중이거나 대기 중인 공정 중 가장 빠른 것)
  const [nextPhase] = await db
    .select({
      category: constructionPhases.category,
      plannedEnd: constructionPhases.plannedEnd,
    })
    .from(constructionPhases)
    .where(
      and(
        eq(constructionPhases.siteId, siteId),
        ne(constructionPhases.status, "완료"),
      ),
    )
    .orderBy(asc(constructionPhases.plannedEnd))
    .limit(1);

  // 3. 미수금 계산
  const siteContracts = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(eq(contracts.siteId, siteId));

  let pendingPaymentAmount = 0;
  let pendingPaymentDueDate: string | null = null;

  if (siteContracts.length > 0) {
    const contractIds = siteContracts.map((c) => c.id);
    const { inArray } = await import("drizzle-orm");

    const pendingPayments = await db
      .select({
        amount: contractPayments.amount,
        dueDate: contractPayments.dueDate,
      })
      .from(contractPayments)
      .where(
        and(
          inArray(contractPayments.contractId, contractIds),
          eq(contractPayments.status, "미수"),
        ),
      )
      .orderBy(asc(contractPayments.dueDate));

    pendingPaymentAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    pendingPaymentDueDate = pendingPayments[0]?.dueDate || null;
  }

  // 4. 미해결 하자 건수
  const [defectCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(defects)
    .where(
      and(
        eq(defects.siteId, siteId),
        ne(defects.status, "closed"),
        ne(defects.status, "resolved"),
      ),
    );

  // 업데이트
  const summaryData = {
    currentProgressPercent,
    nextMilestoneTitle: nextPhase?.category || null,
    nextMilestoneDate: nextPhase?.plannedEnd || null,
    pendingPaymentAmount,
    pendingPaymentDueDate,
    openDefectsCount: defectCount?.count || 0,
    updatedAt: new Date(),
  };

  for (const room of rooms) {
    await db
      .update(siteChatPinnedSummary)
      .set(summaryData)
      .where(eq(siteChatPinnedSummary.roomId, room.id));

    // SSE 브로드캐스트
    broadcastToRoom(room.id, "summary_updated", summaryData);
  }
}
