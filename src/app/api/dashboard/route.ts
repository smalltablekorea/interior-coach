import { db } from "@/lib/db";
import {
  sites, constructionPhases, contracts, contractPayments,
  estimates, materialOrders, expenses,
} from "@/lib/db/schema";
import { eq, sql, and, gte, lte, ne, or, desc, isNull, inArray } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  const auth = await requireWorkspaceAuth("dashboard", "read");
  if (!auth.ok) return auth.response;

  try {
    const uid = auth.userId;
    const wid = auth.workspaceId;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // ── 날짜 범위 계산 ──
    const y = now.getFullYear();
    const m = now.getMonth();
    const startOfMonth = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const endOfMonth = new Date(y, m + 1, 0).toISOString().slice(0, 10);

    const lastY = m === 0 ? y - 1 : y;
    const lastM = m === 0 ? 12 : m;
    const lastMonthStart = `${lastY}-${String(lastM).padStart(2, "0")}-01`;
    const lastMonthEnd = new Date(lastY, lastM, 0).toISOString().slice(0, 10);

    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(y, m, now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekStart = monday.toISOString().slice(0, 10);
    const weekEnd = sunday.toISOString().slice(0, 10);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);
    const fourteenDaysLater = new Date(now);
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
    const fourteenDaysStr = fourteenDaysLater.toISOString().slice(0, 10);

    // 공통 조건
    const siteBase = and(workspaceFilter(sites.workspaceId, sites.userId, wid, uid), isNull(sites.deletedAt));
    const contractBase = and(workspaceFilter(contracts.workspaceId, contracts.userId, wid, uid), isNull(contracts.deletedAt));
    const expenseBase = and(workspaceFilter(expenses.workspaceId, expenses.userId, wid, uid), isNull(expenses.deletedAt));
    const estimateBase = and(workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid), isNull(estimates.deletedAt));

    // ════════════════════════════════════════
    // 그룹 A: KPI + 기본 데이터 (11개 쿼리 병렬)
    // ════════════════════════════════════════
    const [
      [activeSiteCount], [totalSiteCount],
      [thisMonthPaid], [lastMonthPaid], [totalContractAmt], [totalPaidAll],
      [thisMonthExp], [thisMonthMat], [budgetTotal],
      thisWeekPhases, activeSites,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(sites)
        .where(and(siteBase, eq(sites.status, "시공중"))),
      db.select({ count: sql<number>`count(*)::int` }).from(sites)
        .where(siteBase),
      db.select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
        .from(contractPayments).innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .where(and(contractBase, eq(contractPayments.status, "완납"), gte(contractPayments.paidDate, startOfMonth), lte(contractPayments.paidDate, endOfMonth))),
      db.select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
        .from(contractPayments).innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .where(and(contractBase, eq(contractPayments.status, "완납"), gte(contractPayments.paidDate, lastMonthStart), lte(contractPayments.paidDate, lastMonthEnd))),
      db.select({ total: sql<number>`coalesce(sum(${contracts.contractAmount}), 0)::int` })
        .from(contracts).where(contractBase),
      db.select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
        .from(contractPayments).innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .where(and(contractBase, eq(contractPayments.status, "완납"))),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
        .from(expenses).where(and(expenseBase, gte(expenses.date, startOfMonth), lte(expenses.date, endOfMonth))),
      db.select({ total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
        .from(materialOrders).where(and(
          workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
          gte(materialOrders.orderedDate, startOfMonth), lte(materialOrders.orderedDate, endOfMonth), ne(materialOrders.status, "취소"),
        )),
      db.select({ total: sql<number>`coalesce(sum(${estimates.totalAmount}), 0)::int` })
        .from(estimates).innerJoin(sites, eq(estimates.siteId, sites.id))
        .where(and(estimateBase, eq(sites.status, "시공중"), eq(estimates.status, "승인"))),
      db.select({
        id: constructionPhases.id, category: constructionPhases.category,
        siteName: sites.name, plannedStart: constructionPhases.plannedStart,
        plannedEnd: constructionPhases.plannedEnd, status: constructionPhases.status,
      }).from(constructionPhases).innerJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(and(
          workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid),
          lte(constructionPhases.plannedStart, weekEnd), gte(constructionPhases.plannedEnd, weekStart),
        )),
      db.select({ id: sites.id, name: sites.name, startDate: sites.startDate, endDate: sites.endDate })
        .from(sites).where(and(siteBase, eq(sites.status, "시공중"))),
    ]);

    // KPI 계산
    const collectionRate = totalContractAmt.total > 0 ? Math.round((totalPaidAll.total / totalContractAmt.total) * 100) : 0;
    const revenueTrend = thisMonthPaid.total >= lastMonthPaid.total ? "up" : "down";
    const totalExpenses = thisMonthExp.total + thisMonthMat.total;
    const burnRate = budgetTotal.total > 0 ? Math.round((totalExpenses / budgetTotal.total) * 100) : 0;
    const todayTasks = thisWeekPhases.filter(
      (p) => p.plannedStart && p.plannedEnd && p.plannedStart <= today && p.plannedEnd >= today,
    );

    // ════════════════════════════════════════
    // 그룹 B: 헬스 스코어 배치 쿼리 (N+1 → 배치)
    // ════════════════════════════════════════
    const activeSiteIds = activeSites.map((s) => s.id);
    let healthScores: { siteId: string; siteName: string; score: number; progressScore: number; budgetScore: number; paymentScore: number; issueScore: number; responseScore: number }[] = [];

    if (activeSiteIds.length > 0) {
      // 모든 활성 현장의 데이터를 한번에 조회 (4개 배치 쿼리 병렬)
      const [allPhases, allEstTotals, allExpTotals, allMatTotals, allPayments] = await Promise.all([
        db.select({
          siteId: constructionPhases.siteId,
          progress: constructionPhases.progress,
          status: constructionPhases.status,
        }).from(constructionPhases)
          .where(and(
            inArray(constructionPhases.siteId, activeSiteIds),
            workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid),
          )),
        db.select({
          siteId: estimates.siteId,
          total: sql<number>`coalesce(sum(${estimates.totalAmount}), 0)::int`,
        }).from(estimates)
          .where(and(
            inArray(estimates.siteId!, activeSiteIds),
            workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid),
            eq(estimates.status, "승인"), isNull(estimates.deletedAt),
          ))
          .groupBy(estimates.siteId),
        db.select({
          siteId: expenses.siteId,
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
        }).from(expenses)
          .where(and(
            inArray(expenses.siteId!, activeSiteIds),
            workspaceFilter(expenses.workspaceId, expenses.userId, wid, uid),
            isNull(expenses.deletedAt),
          ))
          .groupBy(expenses.siteId),
        db.select({
          siteId: materialOrders.siteId,
          total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int`,
        }).from(materialOrders)
          .where(and(
            inArray(materialOrders.siteId!, activeSiteIds),
            workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
            ne(materialOrders.status, "취소"),
          ))
          .groupBy(materialOrders.siteId),
        // 모든 활성 현장의 계약 결제 건을 한번에 조회 (N+1 중첩 루프 제거)
        db.select({
          siteId: contracts.siteId,
          paymentStatus: contractPayments.status,
          dueDate: contractPayments.dueDate,
        }).from(contractPayments)
          .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
          .where(and(
            inArray(contracts.siteId!, activeSiteIds),
            workspaceFilter(contracts.workspaceId, contracts.userId, wid, uid),
            isNull(contracts.deletedAt),
          )),
      ]);

      // 사이트별 맵 구성
      const phasesBySite = Map.groupBy(allPhases, (p) => p.siteId!);
      const estMap = new Map(allEstTotals.map((r) => [r.siteId, r.total]));
      const expMap = new Map(allExpTotals.map((r) => [r.siteId, r.total]));
      const matMap = new Map(allMatTotals.map((r) => [r.siteId, r.total]));
      const paymentsBySite = Map.groupBy(allPayments, (p) => p.siteId!);

      healthScores = activeSites.map((site) => {
        const sitePhases = phasesBySite.get(site.id) ?? [];
        const actualProgress = sitePhases.length > 0
          ? sitePhases.reduce((s, p) => s + (p.progress ?? 0), 0) / sitePhases.length : 0;

        let expectedProgress = 50;
        if (site.startDate && site.endDate) {
          const start = new Date(site.startDate).getTime();
          const end = new Date(site.endDate).getTime();
          expectedProgress = Math.min((Math.max(0, now.getTime() - start) / Math.max(1, end - start)) * 100, 100);
        }
        const progressScore = Math.min(Math.round((expectedProgress > 0 ? actualProgress / expectedProgress : 1) * 30), 30);

        const estTotal = estMap.get(site.id) ?? 0;
        const totalSpent = (expMap.get(site.id) ?? 0) + (matMap.get(site.id) ?? 0);
        const expectedSpend = estTotal > 0 ? estTotal * (actualProgress / 100) : 0;
        const spendDev = expectedSpend > 0 ? totalSpent / expectedSpend : (totalSpent === 0 ? 1 : 2);
        const budgetScore = Math.max(0, Math.min(30, Math.round(30 * (1 - Math.max(0, spendDev - 1) / 0.5))));

        const sitePayments = paymentsBySite.get(site.id) ?? [];
        const overdueCount = sitePayments.filter((p) => p.paymentStatus === "미수" && p.dueDate && p.dueDate < today).length;
        const paymentScore = sitePayments.length > 0 ? Math.round(20 * (1 - overdueCount / sitePayments.length)) : 20;

        const score = progressScore + budgetScore + paymentScore + 8 + 7; // issueScore=8, responseScore=7
        return { siteId: site.id, siteName: site.name, score, progressScore, budgetScore, paymentScore, issueScore: 8, responseScore: 7 };
      });
    }

    // ════════════════════════════════════════
    // 그룹 C: 프로젝트 수익 배치 + 액션 아이템 + 최근 활동 (병렬)
    // ════════════════════════════════════════
    const sitesWithContracts = await db
      .select({
        siteId: contracts.siteId, siteName: sites.name,
        contractAmount: contracts.contractAmount, estimateId: contracts.estimateId,
      })
      .from(contracts).innerJoin(sites, eq(contracts.siteId, sites.id))
      .where(contractBase);

    const profitSiteIds = [...new Set(sitesWithContracts.map((sc) => sc.siteId).filter(Boolean))] as string[];

    const [
      profitExpTotals, profitMatTotals,
      overduePayments, delayedPhases, upcomingPhases, pendingOrderSites, upcomingPaymentsDue,
      recentPaid, recentPhases, recentExp,
    ] = await Promise.all([
      // 프로젝트 수익: 배치 쿼리
      profitSiteIds.length > 0
        ? db.select({ siteId: expenses.siteId, total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
            .from(expenses)
            .where(and(inArray(expenses.siteId!, profitSiteIds), workspaceFilter(expenses.workspaceId, expenses.userId, wid, uid), isNull(expenses.deletedAt)))
            .groupBy(expenses.siteId)
        : Promise.resolve([]),
      profitSiteIds.length > 0
        ? db.select({ siteId: materialOrders.siteId, total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
            .from(materialOrders)
            .where(and(inArray(materialOrders.siteId!, profitSiteIds), workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid), ne(materialOrders.status, "취소")))
            .groupBy(materialOrders.siteId)
        : Promise.resolve([]),
      // 액션 아이템
      db.select({
        paymentId: contractPayments.id, type: contractPayments.type,
        amount: contractPayments.amount, dueDate: contractPayments.dueDate,
        siteId: contracts.siteId, siteName: sites.name,
      }).from(contractPayments)
        .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .innerJoin(sites, eq(contracts.siteId, sites.id))
        .where(and(contractBase, eq(contractPayments.status, "미수"), lte(contractPayments.dueDate, thirtyDaysAgoStr))),
      db.select({
        phaseId: constructionPhases.id, category: constructionPhases.category,
        plannedEnd: constructionPhases.plannedEnd, progress: constructionPhases.progress,
        siteId: constructionPhases.siteId, siteName: sites.name,
      }).from(constructionPhases)
        .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(and(
          workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid),
          lte(constructionPhases.plannedEnd, today), ne(constructionPhases.status, "완료"),
          eq(sites.status, "시공중"), isNull(sites.deletedAt),
        )),
      db.select({
        category: constructionPhases.category, plannedStart: constructionPhases.plannedStart,
        siteId: constructionPhases.siteId, siteName: sites.name,
      }).from(constructionPhases)
        .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(and(
          workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid),
          gte(constructionPhases.plannedStart, today), lte(constructionPhases.plannedStart, nextWeekStr),
          eq(constructionPhases.status, "대기"), eq(sites.status, "시공중"), isNull(sites.deletedAt),
        )),
      db.selectDistinct({ siteId: materialOrders.siteId }).from(materialOrders)
        .where(and(
          workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
          or(eq(materialOrders.status, "발주"), eq(materialOrders.status, "배송중")),
          gte(materialOrders.deliveryDate, today),
        )),
      db.select({
        type: contractPayments.type, amount: contractPayments.amount,
        dueDate: contractPayments.dueDate, siteId: contracts.siteId, siteName: sites.name,
      }).from(contractPayments)
        .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .innerJoin(sites, eq(contracts.siteId, sites.id))
        .where(and(contractBase, eq(contractPayments.status, "미수"), gte(contractPayments.dueDate, today), lte(contractPayments.dueDate, fourteenDaysStr)))
        .orderBy(contractPayments.dueDate).limit(5),
      // 최근 활동
      db.select({
        id: contractPayments.id, amount: contractPayments.amount,
        type: contractPayments.type, paidDate: contractPayments.paidDate,
        siteId: contracts.siteId, siteName: sites.name,
      }).from(contractPayments)
        .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .innerJoin(sites, eq(contracts.siteId, sites.id))
        .where(and(contractBase, eq(contractPayments.status, "완납")))
        .orderBy(desc(contractPayments.paidDate)).limit(3),
      db.select({
        id: constructionPhases.id, category: constructionPhases.category,
        actualEnd: constructionPhases.actualEnd, siteId: constructionPhases.siteId, siteName: sites.name,
      }).from(constructionPhases)
        .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(and(workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid), eq(constructionPhases.status, "완료")))
        .orderBy(desc(constructionPhases.actualEnd)).limit(3),
      db.select({
        id: expenses.id, description: expenses.description,
        amount: expenses.amount, date: expenses.date,
        siteId: expenses.siteId, siteName: sites.name,
      }).from(expenses)
        .leftJoin(sites, eq(expenses.siteId, sites.id))
        .where(expenseBase).orderBy(desc(expenses.date)).limit(3),
    ]);

    // ── 프로젝트 수익 계산 (JS 집계) ──
    const profitExpMap = new Map(profitExpTotals.map((r) => [r.siteId, r.total]));
    const profitMatMap = new Map(profitMatTotals.map((r) => [r.siteId, r.total]));
    const projectProfits = sitesWithContracts.map((sc) => {
      const totalExp = (profitExpMap.get(sc.siteId) ?? 0) + (profitMatMap.get(sc.siteId) ?? 0);
      const contractAmt = sc.contractAmount ?? 0;
      const profit = contractAmt - totalExp;
      const profitRate = contractAmt > 0 ? Math.round((profit / contractAmt) * 100) : 0;
      return { siteId: sc.siteId, name: sc.siteName, revenue: contractAmt, expense: totalExp, profit, profitRate, isLowMargin: profitRate < 10, estimateId: sc.estimateId };
    });

    // ── 액션 아이템 조합 ──
    const overdueItems = overduePayments.map((p) => ({
      siteId: p.siteId, siteName: p.siteName, type: p.type, amount: p.amount ?? 0,
      dueDate: p.dueDate, daysOverdue: Math.floor((now.getTime() - new Date(p.dueDate!).getTime()) / 86400000),
    }));
    const delayedItems = delayedPhases.map((p) => ({
      siteId: p.siteId, siteName: p.siteName, category: p.category, plannedEnd: p.plannedEnd,
      daysDelayed: Math.floor((now.getTime() - new Date(p.plannedEnd!).getTime()) / 86400000), progress: p.progress ?? 0,
    }));
    const sitesWithPendingOrders = new Set(pendingOrderSites.map((r) => r.siteId));
    const needsOrdering = upcomingPhases
      .filter((p) => !sitesWithPendingOrders.has(p.siteId))
      .map((p) => ({ siteId: p.siteId, siteName: p.siteName, category: p.category, plannedStart: p.plannedStart }));

    const upcomingMilestones = [
      ...upcomingPhases.map((p) => ({
        type: "phase" as const, siteId: p.siteId, siteName: p.siteName, label: `${p.category} 공정 시작`, date: p.plannedStart,
        daysUntil: p.plannedStart ? Math.max(0, Math.ceil((new Date(p.plannedStart).getTime() - now.getTime()) / 86400000)) : 0,
      })),
      ...upcomingPaymentsDue.map((p) => ({
        type: "payment" as const, siteId: p.siteId, siteName: p.siteName,
        label: `${p.type} ${Math.round((p.amount ?? 0) / 10000).toLocaleString()}만원 납기`, date: p.dueDate,
        daysUntil: p.dueDate ? Math.max(0, Math.ceil((new Date(p.dueDate).getTime() - now.getTime()) / 86400000)) : 0,
      })),
    ].sort((a, b) => (a.date || "").localeCompare(b.date || "")).slice(0, 6);

    // ── 최근 활동 ──
    type Activity = { id: string; type: string; message: string; date: string; icon: string; siteId: string | null; siteName: string | null };
    const activities: Activity[] = [
      ...recentPaid.map((p) => ({ id: `pay-${p.id}`, type: "payment", message: `${p.siteName} ${p.type} ${Math.round((p.amount ?? 0) / 10000).toLocaleString()}만원 수금`, date: p.paidDate || "", icon: "wallet", siteId: p.siteId, siteName: p.siteName })),
      ...recentPhases.map((p) => ({ id: `phase-${p.id}`, type: "phase", message: `${p.siteName} ${p.category} 공정 완료`, date: p.actualEnd || "", icon: "check", siteId: p.siteId, siteName: p.siteName })),
      ...recentExp.map((e) => ({ id: `exp-${e.id}`, type: "expense", message: `${e.description || "지출"} ${Math.round((e.amount ?? 0) / 10000).toLocaleString()}만원`, date: e.date || "", icon: "receipt", siteId: e.siteId, siteName: e.siteName })),
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return ok({
      kpi: {
        activeSites: { count: activeSiteCount.count, total: totalSiteCount.count },
        monthlyRevenue: { amount: thisMonthPaid.total, collectionRate, lastMonthAmount: lastMonthPaid.total, trend: revenueTrend },
        monthlyExpenses: { amount: totalExpenses, budgetTotal: budgetTotal.total, burnRate, overBudget: burnRate > 100 },
        weeklySchedule: { count: thisWeekPhases.length, todayCount: todayTasks.length, todayTasks: todayTasks.map((t) => ({ category: t.category, siteName: t.siteName })) },
      },
      healthScores,
      projectProfits,
      actionItems: { overduePayments: overdueItems, delayedPhases: delayedItems, needsOrdering },
      recentActivity: activities,
      upcomingMilestones,
    });
  } catch (error) {
    return serverError(error);
  }
}
