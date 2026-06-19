import { NextRequest } from "next/server";
import { desc, sql, ilike, or, eq, inArray, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user as userTable,
  subscriptions,
  analysisCredits,
  workspaces,
  aiUsage,
  session as sessionTable,
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

    // 3-2) 각 사용자의 마지막 로그인 시각 (max session.createdAt)
    const lastLoginMap = new Map<string, Date>();
    if (userIds.length > 0) {
      const lastLogins = await db
        .select({
          userId: sessionTable.userId,
          lastAt: sql<Date>`max(${sessionTable.createdAt})`,
        })
        .from(sessionTable)
        .where(inArray(sessionTable.userId, userIds))
        .groupBy(sessionTable.userId);
      for (const l of lastLogins) {
        if (l.lastAt) lastLoginMap.set(l.userId, new Date(l.lastAt));
      }
    }

    // 4) 총합 + 통계 (전역, 검색 무관)
    // 오늘(=현재 KST 자정 이후) 로그인한 사용자 수 = 오늘 새 session 만든 unique userId 수.
    // KST 자정 = UTC 어제 15:00. 현재 시각 KST 로 옮긴 뒤 그날 자정 epoch 를 구하고 다시 UTC 로.
    const kstOffsetMs = 9 * 60 * 60 * 1000;
    const kstNowMs = Date.now() + kstOffsetMs;
    const kstStartOfDayMs = Math.floor(kstNowMs / 86400000) * 86400000;
    const todayStart = new Date(kstStartOfDayMs - kstOffsetMs);

    const [todayLoginRow] = await db
      .select({
        count: sql<number>`count(distinct ${sessionTable.userId})::int`,
      })
      .from(sessionTable)
      .where(gte(sessionTable.createdAt, todayStart));

    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        promo: sql<number>`count(*) filter (where ${userTable.createdAt} >= ${SIGNUP_PROMO_START} and ${userTable.createdAt} < ${SIGNUP_PROMO_DEADLINE})::int`,
      })
      .from(userTable);

    // 오늘 로그인한 사용자 상세 (이메일/이름)
    const todayLoginUsers = await db
      .selectDistinct({
        userId: sessionTable.userId,
        email: userTable.email,
        name: userTable.name,
        firstLoginToday: sql<Date>`min(${sessionTable.createdAt})`,
        lastLoginToday: sql<Date>`max(${sessionTable.createdAt})`,
      })
      .from(sessionTable)
      .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
      .where(gte(sessionTable.createdAt, todayStart))
      .groupBy(sessionTable.userId, userTable.email, userTable.name)
      .orderBy(desc(sql`max(${sessionTable.createdAt})`));

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
        lastLoginAt: lastLoginMap.get(r.id) ?? null,
      };
    });

    return ok({
      items,
      meta: {
        total: totals.total,
        promoSignups: totals.promo,
        todayLoginCount: todayLoginRow?.count ?? 0,
        todayLoginUsers: todayLoginUsers.map((u) => ({
          userId: u.userId,
          email: u.email,
          name: u.name,
          firstLoginToday: u.firstLoginToday,
          lastLoginToday: u.lastLoginToday,
        })),
        returned: items.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

