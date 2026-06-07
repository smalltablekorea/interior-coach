import { NextRequest } from "next/server";
import { eq, desc, sql, inArray, isNull, and, or, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
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
  workers,
  attendance,
  materials,
  materialOrders,
  expenses,
  billings,
  contracts,
  contractPayments,
  defects,
  dailyLogs,
  communicationLogs,
  sitePhotos,
  schedulePlans,
  taxRevenue,
  taxExpenses,
  taxInvoices,
  taxAiConsultations,
  marketingPosts,
  threadsPosts,
  notifications,
  activityLog,
  aiUsage,
} from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

const RECENT_LIMIT = 30;

/**
 * GET /api/admin/users/[id]
 *   특정 사용자가 입력·생성한 모든 데이터의 종합 뷰.
 *   - 프로필 / 구독 / 분석권 / 워크스페이스
 *   - 현장(공정 포함) / 견적 / 계약(결제 포함)
 *   - 작업자 / 근태
 *   - 자재 / 자재 발주 / 지출 / 정산
 *   - 하자 / 작업일지 / 사이트 사진(카운트) / 고객 / 상담 이력
 *   - 세무 / 마케팅 / 알림 / 활동로그
 *   - AI 호출 이력 + 24h 통계
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

    // 1단계: 사용자 단일 조회 (구독·분석권·워크스페이스)
    const [sub, credit, memberships] = await Promise.all([
      db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1).then((r) => r[0]),
      db.select().from(analysisCredits).where(eq(analysisCredits.userId, userId)).limit(1).then((r) => r[0]),
      db
        .select({
          workspaceId: workspaceMembers.workspaceId,
          role: workspaceMembers.role,
          joinedAt: workspaceMembers.joinedAt,
          wsName: workspaces.name,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, userId))
        .orderBy(desc(workspaceMembers.joinedAt)),
    ]);

    const wsIds = memberships.map((m) => m.workspaceId);

    // workspaceId 또는 userId 매칭용 필터 헬퍼 — Drizzle 칼럼 타입 통일을 위해 AnyPgColumn 사용
    const wsOrUserFilter = (wsCol: AnyPgColumn, userCol: AnyPgColumn): SQL =>
      (wsIds.length > 0
        ? or(inArray(wsCol, wsIds), eq(userCol, userId))
        : eq(userCol, userId)) as SQL;

    // 2단계: userId/workspaceId 직접 매칭되는 테이블 병렬 조회
    const [
      allSites,
      allCustomers,
      allEstimates,
      allWorkers,
      allMaterials,
      allMaterialOrders,
      allExpenses,
      allContracts,
      allSchedulePlans,
      allTaxRevenue,
      allTaxExpenses,
      allTaxInvoices,
      allTaxConsults,
      allMarketingPosts,
      allThreadsPosts,
      allNotifications,
      allActivity,
    ] = await Promise.all([
      db.select().from(sites)
        .where(and(isNull(sites.deletedAt), wsOrUserFilter(sites.workspaceId, sites.userId)))
        .orderBy(desc(sites.createdAt)),
      db.select().from(customers)
        .where(and(isNull(customers.deletedAt), wsOrUserFilter(customers.workspaceId, customers.userId)))
        .orderBy(desc(customers.createdAt)).limit(RECENT_LIMIT),
      db.select().from(estimates)
        .where(and(isNull(estimates.deletedAt), wsOrUserFilter(estimates.workspaceId, estimates.userId)))
        .orderBy(desc(estimates.createdAt)).limit(RECENT_LIMIT),
      db.select().from(workers)
        .where(wsOrUserFilter(workers.workspaceId, workers.userId))
        .orderBy(desc(workers.createdAt)).limit(RECENT_LIMIT),
      db.select().from(materials)
        .where(wsOrUserFilter(materials.workspaceId, materials.userId))
        .orderBy(desc(materials.createdAt)).limit(RECENT_LIMIT),
      db.select().from(materialOrders)
        .where(wsOrUserFilter(materialOrders.workspaceId, materialOrders.userId))
        .orderBy(desc(materialOrders.createdAt)).limit(RECENT_LIMIT),
      db.select().from(expenses)
        .where(wsOrUserFilter(expenses.workspaceId, expenses.userId))
        .orderBy(desc(expenses.createdAt)).limit(RECENT_LIMIT),
      db.select().from(contracts)
        .where(and(isNull(contracts.deletedAt), wsOrUserFilter(contracts.workspaceId, contracts.userId)))
        .orderBy(desc(contracts.createdAt)).limit(RECENT_LIMIT),
      // schedulePlans는 workspaceId 없음 — userId 단일 매칭
      db.select().from(schedulePlans)
        .where(eq(schedulePlans.userId, userId))
        .orderBy(desc(schedulePlans.createdAt)).limit(15),
      db.select({ count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${taxRevenue.totalAmount}), 0)::bigint` })
        .from(taxRevenue)
        .where(wsOrUserFilter(taxRevenue.workspaceId, taxRevenue.userId)),
      db.select({ count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${taxExpenses.totalAmount}), 0)::bigint` })
        .from(taxExpenses)
        .where(wsOrUserFilter(taxExpenses.workspaceId, taxExpenses.userId)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(taxInvoices)
        .where(wsOrUserFilter(taxInvoices.workspaceId, taxInvoices.userId)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(taxAiConsultations)
        .where(eq(taxAiConsultations.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(marketingPosts)
        .where(wsOrUserFilter(marketingPosts.workspaceId, marketingPosts.userId)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(threadsPosts)
        .where(wsOrUserFilter(threadsPosts.workspaceId, threadsPosts.userId)),
      db.select().from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt)).limit(20),
      db.select().from(activityLog)
        .where(eq(activityLog.userId, userId))
        .orderBy(desc(activityLog.createdAt)).limit(RECENT_LIMIT),
    ]);

    // 3단계: 자식 ID 기반 테이블 (siteId / customerId / contractId)
    const siteIds = allSites.map((s) => s.id);
    const customerIds = allCustomers.map((c) => c.id);
    const contractIds = allContracts.map((c) => c.id);

    const [
      allPhases,
      allAttendance,
      allBillings,
      allDefects,
      allDailyLogs,
      photoCountRow,
      allCommLogs,
      allContractPayments,
    ] = await Promise.all([
      siteIds.length > 0
        ? db.select().from(constructionPhases).where(inArray(constructionPhases.siteId, siteIds)).orderBy(constructionPhases.plannedStart)
        : Promise.resolve([]),
      siteIds.length > 0
        ? db.select().from(attendance).where(inArray(attendance.siteId, siteIds)).orderBy(desc(attendance.workDate)).limit(RECENT_LIMIT)
        : Promise.resolve([]),
      siteIds.length > 0
        ? db.select().from(billings).where(inArray(billings.siteId, siteIds)).orderBy(desc(billings.createdAt)).limit(RECENT_LIMIT)
        : Promise.resolve([]),
      siteIds.length > 0
        ? db.select().from(defects).where(inArray(defects.siteId, siteIds)).orderBy(desc(defects.createdAt)).limit(RECENT_LIMIT)
        : Promise.resolve([]),
      siteIds.length > 0
        ? db.select().from(dailyLogs).where(inArray(dailyLogs.siteId, siteIds)).orderBy(desc(dailyLogs.logDate)).limit(RECENT_LIMIT)
        : Promise.resolve([]),
      siteIds.length > 0
        ? db.select({ count: sql<number>`count(*)::int` }).from(sitePhotos).where(inArray(sitePhotos.siteId, siteIds))
        : Promise.resolve([{ count: 0 }]),
      customerIds.length > 0
        ? db.select().from(communicationLogs).where(inArray(communicationLogs.customerId, customerIds)).orderBy(desc(communicationLogs.createdAt)).limit(RECENT_LIMIT)
        : Promise.resolve([]),
      contractIds.length > 0
        ? db.select().from(contractPayments).where(inArray(contractPayments.contractId, contractIds)).orderBy(desc(contractPayments.dueDate)).limit(RECENT_LIMIT)
        : Promise.resolve([]),
    ]);

    // siteId → phases 맵
    const phasesMap = new Map<string, typeof allPhases>();
    for (const p of allPhases) {
      const arr = phasesMap.get(p.siteId) ?? [];
      arr.push(p);
      phasesMap.set(p.siteId, arr);
    }

    // 4단계: AI 호출 이력 + 24h 통계
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentAi, recentAnalysis, aiStatsRow] = await Promise.all([
      db.select({
        endpoint: aiUsage.endpoint,
        model: aiUsage.model,
        inputTokens: aiUsage.inputTokens,
        outputTokens: aiUsage.outputTokens,
        createdAt: aiUsage.createdAt,
      }).from(aiUsage).where(eq(aiUsage.userId, userId)).orderBy(desc(aiUsage.createdAt)).limit(50),
      db.select().from(analysisResults).where(eq(analysisResults.userId, userId)).orderBy(desc(analysisResults.createdAt)).limit(20),
      db.select({
        count24h: sql<number>`count(*) filter (where ${aiUsage.createdAt} >= ${since24h})::int`,
        totalIn: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::int`,
        totalOut: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::int`,
      }).from(aiUsage).where(eq(aiUsage.userId, userId)).then((r) => r[0]),
    ]);

    // 집계: 지출/계약/결제 합계
    const expenseTotal = allExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const contractValueTotal = allContracts.reduce((s, c) => s + (Number(c.contractAmount) || 0), 0);
    const paymentReceived = allContractPayments
      .filter((p) => p.status === "완납" || p.paidDate)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paymentPending = allContractPayments
      .filter((p) => !p.paidDate && p.status !== "완납")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const defectOpen = allDefects.filter((d) => d.status !== "완료" && d.status !== "해결").length;

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
        ? { total: credit.totalCredits, used: credit.usedCredits, remaining: credit.totalCredits - credit.usedCredits }
        : null,
      workspaces: memberships.map((m) => ({
        id: m.workspaceId, name: m.wsName, role: m.role,
        joinedAt: m.joinedAt, isActive: m.workspaceId === u.activeWorkspaceId,
      })),
      stats: {
        siteCount: allSites.length,
        customerCount: allCustomers.length,
        estimateCount: allEstimates.length,
        workerCount: allWorkers.length,
        attendanceCount: allAttendance.length,
        materialCount: allMaterials.length,
        materialOrderCount: allMaterialOrders.length,
        expenseCount: allExpenses.length,
        expenseTotal,
        billingCount: allBillings.length,
        contractCount: allContracts.length,
        contractValueTotal,
        paymentReceived,
        paymentPending,
        defectCount: allDefects.length,
        defectOpen,
        dailyLogCount: allDailyLogs.length,
        commLogCount: allCommLogs.length,
        photoCount: photoCountRow[0]?.count ?? 0,
        schedulePlanCount: allSchedulePlans.length,
        taxRevenueCount: allTaxRevenue[0]?.count ?? 0,
        taxRevenueTotal: Number(allTaxRevenue[0]?.total ?? 0),
        taxExpenseCount: allTaxExpenses[0]?.count ?? 0,
        taxExpenseTotal: Number(allTaxExpenses[0]?.total ?? 0),
        taxInvoiceCount: allTaxInvoices[0]?.count ?? 0,
        taxConsultCount: allTaxConsults[0]?.count ?? 0,
        marketingPostCount: allMarketingPosts[0]?.count ?? 0,
        threadsPostCount: allThreadsPosts[0]?.count ?? 0,
        analysisCount: recentAnalysis.length,
        aiCalls24h: aiStatsRow?.count24h ?? 0,
        aiTokensIn: aiStatsRow?.totalIn ?? 0,
        aiTokensOut: aiStatsRow?.totalOut ?? 0,
      },
      sites: allSites.map((s) => ({
        id: s.id, name: s.name, address: s.address,
        buildingType: s.buildingType, areaPyeong: s.areaPyeong,
        status: s.status, startDate: s.startDate, endDate: s.endDate,
        progress: s.progress, budget: s.budget, spent: s.spent,
        createdAt: s.createdAt,
        phases: phasesMap.get(s.id) ?? [],
      })),
      customers: allCustomers,
      estimates: allEstimates,
      workers: allWorkers,
      attendance: allAttendance,
      materials: allMaterials,
      materialOrders: allMaterialOrders,
      expenses: allExpenses,
      contracts: allContracts,
      contractPayments: allContractPayments,
      billings: allBillings,
      defects: allDefects,
      dailyLogs: allDailyLogs,
      communicationLogs: allCommLogs,
      schedulePlans: allSchedulePlans,
      notifications: allNotifications,
      activityLog: allActivity,
      recentAi,
      recentAnalysis,
    });
  } catch (e) {
    return serverError(e);
  }
}
