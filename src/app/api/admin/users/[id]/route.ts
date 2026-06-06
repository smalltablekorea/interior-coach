import { NextRequest } from "next/server";
import { eq, desc, sql, inArray, isNull, and, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user as userTable,
  subscriptions,
  analysisCredits,
  analysisResults,
  workspaces,
  workspaceMembers,
  sites,
  constructionPhases,
  estimates,
  customers,
  aiUsage,
} from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * GET /api/admin/users/[id]
 *   특정 사용자의 종합 데이터:
 *   - 프로필 + 구독 + 분석권
 *   - 멤버로 속한 모든 워크스페이스
 *   - 활성 워크스페이스의 현장(공정 포함), 견적, 고객 수
 *   - 최근 분석권 사용 이력 / AI 호출 이력
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  const { id: userId } = await params;
  if (!userId) return err("userId 필수", 400);

  try {
    const [u] = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        phone: userTable.phone,
        emailVerified: userTable.emailVerified,
        role: userTable.role,
        activeWorkspaceId: userTable.activeWorkspaceId,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!u) return err("사용자를 찾을 수 없습니다", 404);

    // 구독
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    // 분석권
    const [credit] = await db
      .select()
      .from(analysisCredits)
      .where(eq(analysisCredits.userId, userId))
      .limit(1);

    // 워크스페이스 멤버십 (모든 워크스페이스)
    const memberships = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        wsName: workspaces.name,
        wsCreatedAt: workspaces.createdAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId))
      .orderBy(desc(workspaceMembers.joinedAt));

    const wsIds = memberships.map((m) => m.workspaceId);

    // 현장 (workspaceId 또는 userId 기준 — 워크스페이스 없던 시절 데이터 호환)
    const allSites = await db
      .select({
        id: sites.id,
        workspaceId: sites.workspaceId,
        name: sites.name,
        address: sites.address,
        buildingType: sites.buildingType,
        areaPyeong: sites.areaPyeong,
        status: sites.status,
        startDate: sites.startDate,
        endDate: sites.endDate,
        progress: sites.progress,
        budget: sites.budget,
        spent: sites.spent,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .where(
        and(
          isNull(sites.deletedAt),
          wsIds.length > 0
            ? or(inArray(sites.workspaceId, wsIds), eq(sites.userId, userId))
            : eq(sites.userId, userId),
        ),
      )
      .orderBy(desc(sites.createdAt));

    // 각 현장의 공정 일정
    const siteIds = allSites.map((s) => s.id);
    const phasesMap = new Map<
      string,
      { category: string; plannedStart: string | null; plannedEnd: string | null; actualStart: string | null; actualEnd: string | null; status: string; progress: number }[]
    >();
    if (siteIds.length > 0) {
      const phases = await db
        .select({
          siteId: constructionPhases.siteId,
          category: constructionPhases.category,
          plannedStart: constructionPhases.plannedStart,
          plannedEnd: constructionPhases.plannedEnd,
          actualStart: constructionPhases.actualStart,
          actualEnd: constructionPhases.actualEnd,
          status: constructionPhases.status,
          progress: constructionPhases.progress,
        })
        .from(constructionPhases)
        .where(inArray(constructionPhases.siteId, siteIds))
        .orderBy(constructionPhases.plannedStart);
      for (const p of phases) {
        const arr = phasesMap.get(p.siteId) ?? [];
        arr.push({
          category: p.category,
          plannedStart: p.plannedStart,
          plannedEnd: p.plannedEnd,
          actualStart: p.actualStart,
          actualEnd: p.actualEnd,
          status: p.status ?? "대기",
          progress: p.progress ?? 0,
        });
        phasesMap.set(p.siteId, arr);
      }
    }

    const sitesWithPhases = allSites.map((s) => ({
      ...s,
      phases: phasesMap.get(s.id) ?? [],
    }));

    // 견적 — 최근 20건
    const recentEstimates = await db
      .select({
        id: estimates.id,
        workspaceId: estimates.workspaceId,
        siteId: estimates.siteId,
        version: estimates.version,
        totalAmount: estimates.totalAmount,
        status: estimates.status,
        createdAt: estimates.createdAt,
      })
      .from(estimates)
      .where(
        and(
          isNull(estimates.deletedAt),
          wsIds.length > 0
            ? or(inArray(estimates.workspaceId, wsIds), eq(estimates.userId, userId))
            : eq(estimates.userId, userId),
        ),
      )
      .orderBy(desc(estimates.createdAt))
      .limit(20);

    // 고객 수 (전체)
    const [{ customerCount }] = await db
      .select({ customerCount: sql<number>`count(*)::int` })
      .from(customers)
      .where(
        and(
          isNull(customers.deletedAt),
          wsIds.length > 0
            ? or(inArray(customers.workspaceId, wsIds), eq(customers.userId, userId))
            : eq(customers.userId, userId),
        ),
      );

    // 분석권 사용 이력 (최근 20건)
    const recentAnalysis = await db
      .select({
        id: analysisResults.id,
        area: analysisResults.area,
        grade: analysisResults.grade,
        buildingType: analysisResults.buildingType,
        createdAt: analysisResults.createdAt,
      })
      .from(analysisResults)
      .where(eq(analysisResults.userId, userId))
      .orderBy(desc(analysisResults.createdAt))
      .limit(20);

    // AI 호출 이력 (최근 50건) + 24h 통계
    const recentAi = await db
      .select({
        endpoint: aiUsage.endpoint,
        model: aiUsage.model,
        inputTokens: aiUsage.inputTokens,
        outputTokens: aiUsage.outputTokens,
        createdAt: aiUsage.createdAt,
      })
      .from(aiUsage)
      .where(eq(aiUsage.userId, userId))
      .orderBy(desc(aiUsage.createdAt))
      .limit(50);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [aiStats] = await db
      .select({
        count24h: sql<number>`count(*) filter (where ${aiUsage.createdAt} >= ${since24h})::int`,
        totalIn: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::int`,
        totalOut: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::int`,
      })
      .from(aiUsage)
      .where(eq(aiUsage.userId, userId));

    return ok({
      user: {
        ...u,
        activeWorkspaceName:
          memberships.find((m) => m.workspaceId === u.activeWorkspaceId)?.wsName ?? null,
      },
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            billingCycle: sub.billingCycle,
            trialEndsAt: sub.trialEndsAt,
            currentPeriodEnd: sub.currentPeriodEnd,
            canceledAt: sub.canceledAt,
          }
        : null,
      credits: credit
        ? {
            total: credit.totalCredits,
            used: credit.usedCredits,
            remaining: credit.totalCredits - credit.usedCredits,
          }
        : null,
      workspaces: memberships.map((m) => ({
        id: m.workspaceId,
        name: m.wsName,
        role: m.role,
        joinedAt: m.joinedAt,
        isActive: m.workspaceId === u.activeWorkspaceId,
      })),
      sites: sitesWithPhases,
      estimates: recentEstimates,
      stats: {
        siteCount: allSites.length,
        customerCount,
        estimateCount: recentEstimates.length,
        analysisCount: recentAnalysis.length,
        aiCallsTotal: recentAi.length, // 표시용 (최대 50 cap)
        aiCalls24h: aiStats?.count24h ?? 0,
        aiTokensIn: aiStats?.totalIn ?? 0,
        aiTokensOut: aiStats?.totalOut ?? 0,
      },
      recentAnalysis,
      recentAi,
    });
  } catch (e) {
    return serverError(e);
  }
}
