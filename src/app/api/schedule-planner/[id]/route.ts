import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schedulePlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import {
  validateTradeProgress,
  generateScheduleResult,
  calculateOverallProgress,
  deriveScheduleStatus,
} from "@/lib/schedule-planner/service";
import { SIZES, SEASONS } from "@/lib/schedule-planner/trades";
import type { TradeProgress, UpdateTradeProgressRequest } from "@/types/schedule-planner";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/schedule-planner/[id] — 공정표 상세 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // Public share access check
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get("token");

  if (shareToken) {
    // Public access via share token
    const [row] = await db
      .select()
      .from(schedulePlans)
      .where(and(eq(schedulePlans.id, id), eq(schedulePlans.shareToken, shareToken), eq(schedulePlans.isPublic, true)))
      .limit(1);

    if (!row) return notFound("공정표를 찾을 수 없거나 공유가 비활성화되었습니다.");
    return ok(row);
  }

  // Authenticated access
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const [row] = await db
      .select()
      .from(schedulePlans)
      .where(and(eq(schedulePlans.id, id), eq(schedulePlans.userId, auth.userId)))
      .limit(1);

    if (!row) return notFound("공정표를 찾을 수 없습니다.");

    const selectedTrades = (row.selectedTrades as string[]) || [];
    const tradeProgress = (row.tradeProgress as TradeProgress) || null;
    const overallProgress = calculateOverallProgress(selectedTrades, tradeProgress);

    return ok({ ...row, overallProgress });
  } catch (error) {
    return serverError(error);
  }
}

/** PATCH /api/schedule-planner/[id] — 공정표 수정 / 공종 진행 업데이트 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    // Get current schedule
    const [current] = await db
      .select()
      .from(schedulePlans)
      .where(and(eq(schedulePlans.id, id), eq(schedulePlans.userId, auth.userId)))
      .limit(1);

    if (!current) return notFound("공정표를 찾을 수 없습니다.");

    const body = await request.json();

    // Trade progress update
    if (body.tradeUpdate) {
      const { tradeId, status: newStatus } = body.tradeUpdate as UpdateTradeProgressRequest;
      const selectedTrades = (current.selectedTrades as string[]) || [];
      const currentProgress = (current.tradeProgress as TradeProgress) || {};

      // Validate dependency
      const validation = validateTradeProgress(tradeId, newStatus, selectedTrades, currentProgress);
      if (!validation.valid) return err(validation.error!, 400);

      // Update trade progress
      const updatedProgress: TradeProgress = {
        ...currentProgress,
        [tradeId]: {
          status: newStatus,
          ...(newStatus === "completed" ? { completedAt: new Date().toISOString() } : {}),
        },
      };

      // Auto-derive schedule status
      const newScheduleStatus = deriveScheduleStatus(selectedTrades, updatedProgress);

      const [updated] = await db
        .update(schedulePlans)
        .set({
          tradeProgress: updatedProgress,
          status: newScheduleStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(schedulePlans.id, id), eq(schedulePlans.userId, auth.userId)))
        .returning();

      const overallProgress = calculateOverallProgress(selectedTrades, updatedProgress);
      return ok({ ...updated, overallProgress });
    }

    // General field update
    const updates: Record<string, unknown> = {};
    if (body.siteName !== undefined) updates.siteName = body.siteName.trim();
    if (body.siteAddress !== undefined) updates.siteAddress = body.siteAddress?.trim() || null;
    if (body.startDate !== undefined) updates.startDate = body.startDate;
    if (body.memo !== undefined) updates.memo = body.memo?.trim() || null;

    // If schedule parameters changed, regenerate result
    if (body.sizeId || body.selectedTrades || body.season) {
      const sizeId = body.sizeId || current.sizeId;
      const selectedTrades = body.selectedTrades || (current.selectedTrades as string[]);
      const season = body.season || current.season;

      if (body.sizeId && !SIZES.find((s) => s.id === body.sizeId)) {
        return err("유효한 평형을 선택해주세요.");
      }
      if (body.season && !SEASONS[body.season]) {
        return err("유효한 계절을 선택해주세요.");
      }

      const result = generateScheduleResult(selectedTrades, sizeId, season);
      if (!result) return err("공정표 재생성에 실패했습니다.");

      updates.sizeId = sizeId;
      updates.selectedTrades = selectedTrades;
      updates.season = season;
      updates.resultJson = result;

      // Reset trade progress for new trades
      const newProgress: TradeProgress = {};
      for (const tid of selectedTrades) {
        const existing = (current.tradeProgress as TradeProgress)?.[tid];
        newProgress[tid] = existing || { status: "pending" };
      }
      updates.tradeProgress = newProgress;
    }

    if (Object.keys(updates).length === 0) return err("수정할 내용이 없습니다.");
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(schedulePlans)
      .set(updates)
      .where(and(eq(schedulePlans.id, id), eq(schedulePlans.userId, auth.userId)))
      .returning();

    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE /api/schedule-planner/[id] — 공정표 삭제 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [deleted] = await db
      .delete(schedulePlans)
      .where(and(eq(schedulePlans.id, id), eq(schedulePlans.userId, auth.userId)))
      .returning({ id: schedulePlans.id });

    if (!deleted) return notFound("공정표를 찾을 수 없습니다.");
    return ok({ message: "삭제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}
