import { db } from "@/lib/db";
import { schedulePlans, subscriptions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { TRADES, DEP_WARNINGS, SIZES } from "./trades";
import { buildSchedule } from "./engine";
import type {
  TradeProgress,
  TradeStatus,
  ScheduleResult,
  PLAN_LIMITS,
} from "@/types/schedule-planner";
import { PLAN_LIMITS as planLimits } from "@/types/schedule-planner";

/** 사용자 플랜 조회 */
async function getUserPlan(userId: string): Promise<string> {
  const [sub] = await db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return sub?.plan || "free";
}

/** 사용자 공정표 개수 조회 */
async function getUserScheduleCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(schedulePlans)
    .where(eq(schedulePlans.userId, userId));
  return result?.count || 0;
}

/** 공정표 생성 가능 여부 확인 */
export async function canCreateSchedule(userId: string): Promise<{
  allowed: boolean;
  plan: string;
  current: number;
  limit: number;
}> {
  const plan = await getUserPlan(userId);
  const current = await getUserScheduleCount(userId);
  const limit = planLimits[plan] ?? planLimits.free;
  return {
    allowed: current < limit,
    plan,
    current,
    limit,
  };
}

/** 선택된 공종의 의존성 경고 체크 */
export function checkDependencyWarnings(
  selectedTradeIds: string[],
): Array<{ tradeId: string; needsId: string; msg: string; severity: string }> {
  const warnings: Array<{ tradeId: string; needsId: string; msg: string; severity: string }> = [];
  for (const w of DEP_WARNINGS) {
    if (selectedTradeIds.includes(w.if) && !selectedTradeIds.includes(w.needs)) {
      warnings.push({
        tradeId: w.if,
        needsId: w.needs,
        msg: w.msg,
        severity: w.severity,
      });
    }
  }
  return warnings;
}

/** 공종 진행 상태 업데이트 시 의존성 유효성 검증 */
export function validateTradeProgress(
  tradeId: string,
  newStatus: TradeStatus,
  selectedTradeIds: string[],
  currentProgress: TradeProgress | null,
): { valid: boolean; error?: string } {
  if (newStatus !== "in_progress" && newStatus !== "completed") {
    return { valid: true };
  }

  const trade = TRADES.find((t) => t.id === tradeId);
  if (!trade) return { valid: false, error: `공종을 찾을 수 없습니다: ${tradeId}` };

  // Check all required dependencies are completed
  const progress = currentProgress || {};
  for (const depId of trade.requires) {
    if (!selectedTradeIds.includes(depId)) continue;
    const depProgress = progress[depId];
    if (!depProgress || depProgress.status !== "completed") {
      const depTrade = TRADES.find((t) => t.id === depId);
      return {
        valid: false,
        error: `선행 공종 "${depTrade?.name || depId}"이(가) 완료되지 않았습니다.`,
      };
    }
  }

  return { valid: true };
}

/** 공정표 생성 (buildSchedule 실행 + DB 저장) */
export function generateScheduleResult(
  selectedTradeIds: string[],
  sizeId: string,
  season: string,
): ScheduleResult | null {
  // Validate sizeId
  if (!SIZES.find((s) => s.id === sizeId)) return null;
  return buildSchedule(selectedTradeIds, sizeId, season);
}

/** 공유 토큰 생성 */
export function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/** 전체 진행률 계산 */
export function calculateOverallProgress(
  selectedTradeIds: string[],
  tradeProgress: TradeProgress | null,
): number {
  if (!tradeProgress || selectedTradeIds.length === 0) return 0;
  let completed = 0;
  for (const id of selectedTradeIds) {
    const entry = tradeProgress[id];
    if (entry?.status === "completed" || entry?.status === "skipped") {
      completed++;
    }
  }
  return Math.round((completed / selectedTradeIds.length) * 100);
}

/** 자동 상태 전환: 모든 공종 완료 시 → completed */
export function deriveScheduleStatus(
  selectedTradeIds: string[],
  tradeProgress: TradeProgress | null,
): "draft" | "in_progress" | "completed" {
  if (!tradeProgress) return "draft";

  const entries = Object.values(tradeProgress);
  if (entries.length === 0) return "draft";

  const hasAny = entries.some((e) => e.status === "in_progress" || e.status === "completed");
  if (!hasAny) return "draft";

  const allDone = selectedTradeIds.every((id) => {
    const entry = tradeProgress[id];
    return entry?.status === "completed" || entry?.status === "skipped";
  });

  return allDone ? "completed" : "in_progress";
}
