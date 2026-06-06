import { NextRequest } from "next/server";
import { desc, sql, ilike, or, eq, inArray, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user as userTable,
  subscriptions,
  analysisCredits,
  workspaces,
  aiUsage,
} from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api/response";
import {
  SIGNUP_PROMO_START,
  SIGNUP_PROMO_DEADLINE,
} from "@/lib/subscription/trial";

/**
 * GET /api/admin/users
 *   ?q=검색어 (이메일/이름)
 *   &limit=100 (기본 100, 최대 500)
 *   &offset=0
 *
 * 사용자 목록 + 구독/분석권/워크스페이스 조인.
 * 24h AI 호출 횟수도 함께 반환 (비용 모니터링용).
 */
export async function GET(request: NextRequest) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const rawLimit = Number(sp.get("limit") || "100");
  const limit = Math.min(500, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 100));
  const offset = Math.max(0, Number(sp.get("offset") || "0"));

  try {
    const search = q
      ? or(ilike(userTable.email, `%${q}%`), ilike(userTable.name, `%${q}%`))
      : undefined;

    // 1) 사용자 + 구독 + 분석권 LEFT JOIN
    const rows = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        phone: userTable.phone,
        emailVerified: userTable.emailVerified,
        role: userTable.role,
        activeWorkspaceId: userTable.activeWorkspaceId,
        createdAt: userTable.createdAt,
        subPlan: subscriptions.plan,
        subStatus: subscriptions.status,
        trialEndsAt: subscriptions.trialEndsAt,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        creditsTotal: analysisCredits.totalCredits,
        creditsUsed: analysisCredits.usedCredits,
      })
      .from(userTable)
      .leftJoin(subscriptions, eq(subscriptions.userId, userTable.id))
      .leftJoin(analysisCredits, eq(analysisCredits.userId, userTable.id))
      .where(search)
      .orderBy(desc(userTable.createdAt))
      .limit(limit)
      .offset(offset);

    // 2) 워크스페이스 이름 조회 (activeWorkspaceId 기준)
    const wsIds = rows
      .map((r) => r.activeWorkspaceId)
      .filter((v): v is string => Boolean(v));
    const wsMap = new Map<string, string>();
    if (wsIds.length > 0) {
      const wsRows = await db
        .select({ id: workspaces.id, name: workspaces.name })
        .from(workspaces)
        .where(inArray(workspaces.id, wsIds));
      for (const w of wsRows) wsMap.set(w.id, w.name);
    }

    // 3) 24h AI 호출 카운트 (사용자별)
    const userIds = rows.map((r) => r.id);
    const aiUsageMap = new Map<string, number>();
    if (userIds.length > 0) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const usage = await db
        .select({
          userId: aiUsage.userId,
          count: sql<number>`count(*)::int`,
        })
        .from(aiUsage)
        .where(and(gte(aiUsage.createdAt, since), inArray(aiUsage.userId, userIds)))
        .groupBy(aiUsage.userId);
      for (const u of usage) aiUsageMap.set(u.userId, u.count);
    }

    // 4) 총합 + 통계 (전역, 검색 무관)
    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        promo: sql<number>`count(*) filter (where ${userTable.createdAt} >= ${SIGNUP_PROMO_START} and ${userTable.createdAt} < ${SIGNUP_PROMO_DEADLINE})::int`,
      })
      .from(userTable);

    const items = rows.map((r) => {
      const now = Date.now();
      const trialDaysLeft = r.trialEndsAt
        ? Math.ceil((new Date(r.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24))
        : null;
      const isPromoSignup =
        r.createdAt >= SIGNUP_PROMO_START && r.createdAt < SIGNUP_PROMO_DEADLINE;
      return {
        id: r.id,
        email: r.email,
        name: r.name,
        phone: r.phone,
        emailVerified: r.emailVerified,
        role: r.role,
        workspaceName: r.activeWorkspaceId ? wsMap.get(r.activeWorkspaceId) ?? null : null,
        hasWorkspace: !!r.activeWorkspaceId,
        plan: r.subPlan ?? "free",
        status: r.subStatus ?? "—",
        trialEndsAt: r.trialEndsAt,
        trialDaysLeft,
        creditsTotal: r.creditsTotal ?? 0,
        creditsUsed: r.creditsUsed ?? 0,
        creditsRemaining: (r.creditsTotal ?? 0) - (r.creditsUsed ?? 0),
        aiCalls24h: aiUsageMap.get(r.id) ?? 0,
        createdAt: r.createdAt,
        isPromoSignup,
      };
    });

    return ok({
      items,
      meta: {
        total: totals.total,
        promoSignups: totals.promo,
        returned: items.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

