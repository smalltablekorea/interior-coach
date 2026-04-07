import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schedulePlans } from "@/lib/db/schema";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";
import {
  canCreateSchedule,
  checkDependencyWarnings,
  generateScheduleResult,
} from "@/lib/schedule-planner/service";
import { SIZES, SEASONS } from "@/lib/schedule-planner/trades";
import type { CreateSchedulePlanRequest, TradeProgress } from "@/types/schedule-planner";

/** GET /api/schedule-planner — 내 공정표 목록 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions = [eq(schedulePlans.userId, auth.userId)];
    if (status) conditions.push(eq(schedulePlans.status, status));
    if (search) conditions.push(ilike(schedulePlans.siteName, `%${search}%`));

    const where = and(...conditions);

    const [items, [countResult]] = await Promise.all([
      db
        .select({
          id: schedulePlans.id,
          siteName: schedulePlans.siteName,
          siteAddress: schedulePlans.siteAddress,
          startDate: schedulePlans.startDate,
          sizeId: schedulePlans.sizeId,
          selectedTrades: schedulePlans.selectedTrades,
          season: schedulePlans.season,
          status: schedulePlans.status,
          isPublic: schedulePlans.isPublic,
          createdAt: schedulePlans.createdAt,
          updatedAt: schedulePlans.updatedAt,
        })
        .from(schedulePlans)
        .where(where)
        .orderBy(desc(schedulePlans.updatedAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: countSql() }).from(schedulePlans).where(where),
    ]);

    const total = countResult?.count || 0;

    return ok({
      items,
      meta: buildPaginationMeta(total, pagination),
    });
  } catch (error) {
    return serverError(error);
  }
}

/** POST /api/schedule-planner — 새 공정표 생성 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body: CreateSchedulePlanRequest = await request.json();

    // Validation
    if (!body.siteName?.trim()) return err("현장명을 입력해주세요.");
    if (!body.startDate) return err("시작일을 입력해주세요.");
    if (!body.sizeId || !SIZES.find((s) => s.id === body.sizeId)) {
      return err("유효한 평형을 선택해주세요.");
    }
    if (!body.selectedTrades?.length) return err("최소 1개 이상의 공종을 선택해주세요.");
    if (!body.season || !SEASONS[body.season]) return err("유효한 계절을 선택해주세요.");

    // Plan limit check
    const planCheck = await canCreateSchedule(auth.userId);
    if (!planCheck.allowed) {
      return err(
        `현재 ${planCheck.plan} 플랜에서는 최대 ${planCheck.limit}개까지 생성 가능합니다. (현재 ${planCheck.current}개)`,
        403,
      );
    }

    // Dependency warnings (return but don't block)
    const warnings = checkDependencyWarnings(body.selectedTrades);

    // Generate schedule
    const result = generateScheduleResult(body.selectedTrades, body.sizeId, body.season);
    if (!result) return err("공정표 생성에 실패했습니다.");

    // Initial trade progress
    const tradeProgress: TradeProgress = {};
    for (const id of body.selectedTrades) {
      tradeProgress[id] = { status: "pending" };
    }

    const [row] = await db
      .insert(schedulePlans)
      .values({
        userId: auth.userId,
        siteName: body.siteName.trim(),
        siteAddress: body.siteAddress?.trim() || null,
        startDate: body.startDate,
        memo: body.memo?.trim() || null,
        sizeId: body.sizeId,
        selectedTrades: body.selectedTrades,
        season: body.season,
        resultJson: result,
        status: "draft",
        tradeProgress,
      })
      .returning();

    return ok({ schedule: row, warnings });
  } catch (error) {
    return serverError(error);
  }
}
