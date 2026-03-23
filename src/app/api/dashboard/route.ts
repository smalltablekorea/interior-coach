import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sites, constructionPhases, contracts, contractPayments,
  estimates, materialOrders, expenses,
} from "@/lib/db/schema";
import { eq, sql, and, gte, lte, ne, or, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // ── 날짜 범위 계산 ──
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based
  const startOfMonth = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endOfMonth = new Date(y, m + 1, 0).toISOString().slice(0, 10);

  const lastY = m === 0 ? y - 1 : y;
  const lastM = m === 0 ? 12 : m;
  const lastMonthStart = `${lastY}-${String(lastM).padStart(2, "0")}-01`;
  const lastMonthEnd = new Date(lastY, lastM, 0).toISOString().slice(0, 10);

  // 이번주 (월~일)
  const dayOfWeek = now.getDay(); // 0=일
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(y, m, now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  // ── KPI 1: 진행중 현장 ──
  const [activeSiteCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites)
    .where(eq(sites.status, "시공중"));

  const [totalSiteCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites);

  // ── KPI 2: 이번달 수금 ──
  const [thisMonthPaid] = await db
    .select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
    .from(contractPayments)
    .where(and(
      eq(contractPayments.status, "완납"),
      gte(contractPayments.paidDate, startOfMonth),
      lte(contractPayments.paidDate, endOfMonth),
    ));

  const [lastMonthPaid] = await db
    .select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
    .from(contractPayments)
    .where(and(
      eq(contractPayments.status, "완납"),
      gte(contractPayments.paidDate, lastMonthStart),
      lte(contractPayments.paidDate, lastMonthEnd),
    ));

  const [totalContractAmt] = await db
    .select({ total: sql<number>`coalesce(sum(${contracts.contractAmount}), 0)::int` })
    .from(contracts);

  const [totalPaidAll] = await db
    .select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
    .from(contractPayments)
    .where(eq(contractPayments.status, "완납"));

  const collectionRate = totalContractAmt.total > 0
    ? Math.round((totalPaidAll.total / totalContractAmt.total) * 100)
    : 0;

  const revenueTrend = thisMonthPaid.total >= lastMonthPaid.total ? "up" : "down";

  // ── KPI 3: 이번달 지출 ──
  const [thisMonthExp] = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
    .from(expenses)
    .where(and(gte(expenses.date, startOfMonth), lte(expenses.date, endOfMonth)));

  const [thisMonthMat] = await db
    .select({ total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
    .from(materialOrders)
    .where(and(
      gte(materialOrders.orderedDate, startOfMonth),
      lte(materialOrders.orderedDate, endOfMonth),
      ne(materialOrders.status, "취소"),
    ));

  const totalExpenses = thisMonthExp.total + thisMonthMat.total;

  // 예산: 시공중 현장의 승인된 견적 총액
  const [budgetTotal] = await db
    .select({ total: sql<number>`coalesce(sum(${estimates.totalAmount}), 0)::int` })
    .from(estimates)
    .innerJoin(sites, eq(estimates.siteId, sites.id))
    .where(and(eq(sites.status, "시공중"), eq(estimates.status, "승인")));

  const burnRate = budgetTotal.total > 0
    ? Math.round((totalExpenses / budgetTotal.total) * 100)
    : 0;

  // ── KPI 4: 이번주 공정 ──
  const thisWeekPhases = await db
    .select({
      id: constructionPhases.id,
      category: constructionPhases.category,
      siteName: sites.name,
      plannedStart: constructionPhases.plannedStart,
      plannedEnd: constructionPhases.plannedEnd,
      status: constructionPhases.status,
    })
    .from(constructionPhases)
    .leftJoin(sites, eq(constructionPhases.siteId, sites.id))
    .where(and(
      lte(constructionPhases.plannedStart, weekEnd),
      gte(constructionPhases.plannedEnd, weekStart),
    ));

  const todayTasks = thisWeekPhases.filter(
    (p) => p.plannedStart && p.plannedEnd && p.plannedStart <= today && p.plannedEnd >= today,
  );

  // ── 헬스 스코어 (시공중 현장별) ──
  const activeSites = await db
    .select({ id: sites.id, name: sites.name, startDate: sites.startDate, endDate: sites.endDate })
    .from(sites)
    .where(eq(sites.status, "시공중"));

  const healthScores = await Promise.all(activeSites.map(async (site) => {
    // 1. 공정 진행률 준수 (30점)
    const sitePhases = await db
      .select({ progress: constructionPhases.progress, status: constructionPhases.status })
      .from(constructionPhases)
      .where(eq(constructionPhases.siteId, site.id));

    const actualProgress = sitePhases.length > 0
      ? sitePhases.reduce((s, p) => s + (p.progress ?? 0), 0) / sitePhases.length
      : 0;

    let expectedProgress = 50; // default
    if (site.startDate && site.endDate) {
      const start = new Date(site.startDate).getTime();
      const end = new Date(site.endDate).getTime();
      const elapsed = Math.max(0, now.getTime() - start);
      const total = Math.max(1, end - start);
      expectedProgress = Math.min((elapsed / total) * 100, 100);
    }
    const progressRatio = expectedProgress > 0 ? actualProgress / expectedProgress : 1;
    const progressScore = Math.min(Math.round(progressRatio * 30), 30);

    // 2. 예산 건전성 (30점)
    const [estTotal] = await db
      .select({ total: sql<number>`coalesce(sum(${estimates.totalAmount}), 0)::int` })
      .from(estimates)
      .where(and(eq(estimates.siteId, site.id), eq(estimates.status, "승인")));

    const [expTotal] = await db
      .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
      .from(expenses)
      .where(eq(expenses.siteId, site.id));

    const [matTotal] = await db
      .select({ total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
      .from(materialOrders)
      .where(and(eq(materialOrders.siteId, site.id), ne(materialOrders.status, "취소")));

    const totalSpent = expTotal.total + matTotal.total;
    const expectedSpend = estTotal.total > 0 ? estTotal.total * (actualProgress / 100) : 0;
    const spendDev = expectedSpend > 0 ? totalSpent / expectedSpend : (totalSpent === 0 ? 1 : 2);
    const budgetScore = Math.max(0, Math.min(30, Math.round(30 * (1 - Math.max(0, spendDev - 1) / 0.5))));

    // 3. 미수금 상태 (20점)
    const siteContracts = await db
      .select({ id: contracts.id })
      .from(contracts)
      .where(eq(contracts.siteId, site.id));

    let overdueCount = 0;
    let totalPaymentItems = 0;
    for (const c of siteContracts) {
      const payments = await db
        .select({ status: contractPayments.status, dueDate: contractPayments.dueDate })
        .from(contractPayments)
        .where(eq(contractPayments.contractId, c.id));
      totalPaymentItems += payments.length;
      overdueCount += payments.filter(
        (p) => p.status === "미수" && p.dueDate && p.dueDate < today,
      ).length;
    }
    const paymentScore = totalPaymentItems > 0
      ? Math.round(20 * (1 - overdueCount / totalPaymentItems))
      : 20;

    // 4,5. 이슈/응답 (목업)
    const issueScore = 8;
    const responseScore = 7;

    const score = progressScore + budgetScore + paymentScore + issueScore + responseScore;

    return {
      siteId: site.id,
      siteName: site.name,
      score,
      progressScore,
      budgetScore,
      paymentScore,
      issueScore,
      responseScore,
    };
  }));

  // ── 프로젝트별 수익 ──
  const sitesWithContracts = await db
    .select({
      siteId: contracts.siteId,
      siteName: sites.name,
      contractAmount: contracts.contractAmount,
      estimateId: contracts.estimateId,
    })
    .from(contracts)
    .innerJoin(sites, eq(contracts.siteId, sites.id));

  const projectProfits = await Promise.all(sitesWithContracts.map(async (sc) => {
    const [expSum] = await db
      .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
      .from(expenses)
      .where(sql`${expenses.siteId} = ${sc.siteId}`);

    const [matSum] = await db
      .select({ total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
      .from(materialOrders)
      .where(sql`${materialOrders.siteId} = ${sc.siteId} AND ${materialOrders.status} != '취소'`);

    const totalExp = expSum.total + matSum.total;
    const contractAmt = sc.contractAmount ?? 0;
    const profit = contractAmt - totalExp;
    const profitRate = contractAmt > 0 ? Math.round((profit / contractAmt) * 100) : 0;

    return {
      siteId: sc.siteId,
      name: sc.siteName,
      revenue: contractAmt,
      expense: totalExp,
      profit,
      profitRate,
      isLowMargin: profitRate < 10,
      estimateId: sc.estimateId,
    };
  }));

  // ── 액션 아이템 ──
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  // 미수금 독촉 (D+30)
  const overduePayments = await db
    .select({
      paymentId: contractPayments.id,
      type: contractPayments.type,
      amount: contractPayments.amount,
      dueDate: contractPayments.dueDate,
      siteId: contracts.siteId,
      siteName: sites.name,
    })
    .from(contractPayments)
    .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
    .innerJoin(sites, eq(contracts.siteId, sites.id))
    .where(and(
      eq(contractPayments.status, "미수"),
      lte(contractPayments.dueDate, thirtyDaysAgoStr),
    ));

  const overdueItems = overduePayments.map((p) => ({
    siteId: p.siteId,
    siteName: p.siteName,
    type: p.type,
    amount: p.amount ?? 0,
    dueDate: p.dueDate,
    daysOverdue: Math.floor((now.getTime() - new Date(p.dueDate!).getTime()) / 86400000),
  }));

  // 공정 지연
  const delayedPhases = await db
    .select({
      phaseId: constructionPhases.id,
      category: constructionPhases.category,
      plannedEnd: constructionPhases.plannedEnd,
      progress: constructionPhases.progress,
      siteId: constructionPhases.siteId,
      siteName: sites.name,
    })
    .from(constructionPhases)
    .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
    .where(and(
      lte(constructionPhases.plannedEnd, today),
      ne(constructionPhases.status, "완료"),
      eq(sites.status, "시공중"),
    ));

  const delayedItems = delayedPhases.map((p) => ({
    siteId: p.siteId,
    siteName: p.siteName,
    category: p.category,
    plannedEnd: p.plannedEnd,
    daysDelayed: Math.floor((now.getTime() - new Date(p.plannedEnd!).getTime()) / 86400000),
    progress: p.progress ?? 0,
  }));

  // 자재 발주 필요 (다음 7일 내 시작 공정 중 해당 현장에 발주 없는 건)
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  const upcomingPhases = await db
    .select({
      category: constructionPhases.category,
      plannedStart: constructionPhases.plannedStart,
      siteId: constructionPhases.siteId,
      siteName: sites.name,
    })
    .from(constructionPhases)
    .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
    .where(and(
      gte(constructionPhases.plannedStart, today),
      lte(constructionPhases.plannedStart, nextWeekStr),
      eq(constructionPhases.status, "대기"),
      eq(sites.status, "시공중"),
    ));

  const pendingOrderSites = await db
    .selectDistinct({ siteId: materialOrders.siteId })
    .from(materialOrders)
    .where(and(
      or(eq(materialOrders.status, "발주"), eq(materialOrders.status, "배송중")),
      gte(materialOrders.deliveryDate, today),
    ));
  const sitesWithPendingOrders = new Set(pendingOrderSites.map((r) => r.siteId));
  const needsOrdering = upcomingPhases
    .filter((p) => !sitesWithPendingOrders.has(p.siteId))
    .map((p) => ({ siteId: p.siteId, siteName: p.siteName, category: p.category, plannedStart: p.plannedStart }));

  // ── 최근 활동 ──
  const recentPaid = await db
    .select({
      id: contractPayments.id,
      amount: contractPayments.amount,
      type: contractPayments.type,
      paidDate: contractPayments.paidDate,
      siteId: contracts.siteId,
      siteName: sites.name,
    })
    .from(contractPayments)
    .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
    .innerJoin(sites, eq(contracts.siteId, sites.id))
    .where(eq(contractPayments.status, "완납"))
    .orderBy(desc(contractPayments.paidDate))
    .limit(3);

  const recentPhases = await db
    .select({
      id: constructionPhases.id,
      category: constructionPhases.category,
      actualEnd: constructionPhases.actualEnd,
      siteId: constructionPhases.siteId,
      siteName: sites.name,
    })
    .from(constructionPhases)
    .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
    .where(eq(constructionPhases.status, "완료"))
    .orderBy(desc(constructionPhases.actualEnd))
    .limit(3);

  const recentExp = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      date: expenses.date,
      siteId: expenses.siteId,
      siteName: sites.name,
    })
    .from(expenses)
    .leftJoin(sites, eq(expenses.siteId, sites.id))
    .orderBy(desc(expenses.date))
    .limit(3);

  type Activity = { id: string; type: string; message: string; date: string; icon: string; siteId: string | null; siteName: string | null };
  const activities: Activity[] = [
    ...recentPaid.map((p) => ({
      id: `pay-${p.id}`,
      type: "payment",
      message: `${p.siteName} ${p.type} ${Math.round((p.amount ?? 0) / 10000).toLocaleString()}만원 수금`,
      date: p.paidDate || "",
      icon: "wallet",
      siteId: p.siteId,
      siteName: p.siteName,
    })),
    ...recentPhases.map((p) => ({
      id: `phase-${p.id}`,
      type: "phase",
      message: `${p.siteName} ${p.category} 공정 완료`,
      date: p.actualEnd || "",
      icon: "check",
      siteId: p.siteId,
      siteName: p.siteName,
    })),
    ...recentExp.map((e) => ({
      id: `exp-${e.id}`,
      type: "expense",
      message: `${e.description || "지출"} ${Math.round((e.amount ?? 0) / 10000).toLocaleString()}만원`,
      date: e.date || "",
      icon: "receipt",
      siteId: e.siteId,
      siteName: e.siteName,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return NextResponse.json({
    kpi: {
      activeSites: { count: activeSiteCount.count, total: totalSiteCount.count },
      monthlyRevenue: {
        amount: thisMonthPaid.total,
        collectionRate,
        lastMonthAmount: lastMonthPaid.total,
        trend: revenueTrend,
      },
      monthlyExpenses: {
        amount: totalExpenses,
        budgetTotal: budgetTotal.total,
        burnRate,
        overBudget: burnRate > 100,
      },
      weeklySchedule: {
        count: thisWeekPhases.length,
        todayCount: todayTasks.length,
        todayTasks: todayTasks.map((t) => ({ category: t.category, siteName: t.siteName })),
      },
    },
    healthScores,
    projectProfits,
    actionItems: {
      overduePayments: overdueItems,
      delayedPhases: delayedItems,
      needsOrdering,
    },
    recentActivity: activities,
  });
}
