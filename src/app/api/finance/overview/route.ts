import { db } from "@/lib/db";
import {
  sites, contracts, contractPayments,
  expenses, materialOrders, estimates,
} from "@/lib/db/schema";
import { eq, sql, and, gte, lte, ne, desc, isNull, inArray } from "drizzle-orm";
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
    const y = now.getFullYear();
    const m = now.getMonth();

    // ── 날짜 범위 ──
    const startOfMonth = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const endOfMonth = new Date(y, m + 1, 0).toISOString().slice(0, 10);

    const siteBase = and(workspaceFilter(sites.workspaceId, sites.userId, wid, uid), isNull(sites.deletedAt));
    const contractBase = and(workspaceFilter(contracts.workspaceId, contracts.userId, wid, uid), isNull(contracts.deletedAt));
    const expenseBase = and(workspaceFilter(expenses.workspaceId, expenses.userId, wid, uid), isNull(expenses.deletedAt));

    // ════════════════════════════════════════
    // 1. 월별 매출/비용 트렌드 (최근 12개월)
    // ════════════════════════════════════════
    const monthlyRevenue: { month: string; revenue: number; expense: number; materialCost: number; profit: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const targetMonth = new Date(y, m - i, 1);
      const mStart = targetMonth.toISOString().slice(0, 10);
      const mEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).toISOString().slice(0, 10);
      const label = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, "0")}`;

      const [[rev], [exp], [mat]] = await Promise.all([
        db.select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
          .from(contractPayments).innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
          .where(and(contractBase, eq(contractPayments.status, "완납"), gte(contractPayments.paidDate, mStart), lte(contractPayments.paidDate, mEnd))),
        db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
          .from(expenses).where(and(expenseBase, gte(expenses.date, mStart), lte(expenses.date, mEnd))),
        db.select({ total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
          .from(materialOrders).where(and(
            workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
            gte(materialOrders.orderedDate, mStart), lte(materialOrders.orderedDate, mEnd), ne(materialOrders.status, "취소"),
          )),
      ]);

      const totalCost = exp.total + mat.total;
      monthlyRevenue.push({
        month: label,
        revenue: rev.total,
        expense: totalCost,
        materialCost: mat.total,
        profit: rev.total - totalCost,
      });
    }

    // ════════════════════════════════════════
    // 2. 현장별 수익 분석 (전체)
    // ════════════════════════════════════════
    const allContracts = await db
      .select({
        siteId: contracts.siteId, siteName: sites.name, siteStatus: sites.status,
        contractAmount: contracts.contractAmount,
      })
      .from(contracts).innerJoin(sites, eq(contracts.siteId, sites.id))
      .where(contractBase);

    const allSiteIds = [...new Set(allContracts.map((c) => c.siteId).filter(Boolean))] as string[];

    let siteExpenses: { siteId: string | null; total: number }[] = [];
    let siteMaterials: { siteId: string | null; total: number }[] = [];

    if (allSiteIds.length > 0) {
      [siteExpenses, siteMaterials] = await Promise.all([
        db.select({ siteId: expenses.siteId, total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
          .from(expenses)
          .where(and(inArray(expenses.siteId!, allSiteIds), expenseBase))
          .groupBy(expenses.siteId),
        db.select({ siteId: materialOrders.siteId, total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
          .from(materialOrders)
          .where(and(
            inArray(materialOrders.siteId!, allSiteIds),
            workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
            ne(materialOrders.status, "취소"),
          ))
          .groupBy(materialOrders.siteId),
      ]);
    }

    const expMap = new Map(siteExpenses.map((r) => [r.siteId, r.total]));
    const matMap = new Map(siteMaterials.map((r) => [r.siteId, r.total]));

    // 계약별 → 사이트별 집계
    const siteMap = new Map<string, { name: string; status: string; contractAmount: number }>();
    for (const c of allContracts) {
      if (!c.siteId) continue;
      const existing = siteMap.get(c.siteId);
      if (existing) {
        existing.contractAmount += c.contractAmount ?? 0;
      } else {
        siteMap.set(c.siteId, {
          name: c.siteName ?? "이름없음",
          status: c.siteStatus ?? "",
          contractAmount: c.contractAmount ?? 0,
        });
      }
    }

    const projectProfits = [...siteMap.entries()].map(([siteId, info]) => {
      const totalCost = (expMap.get(siteId) ?? 0) + (matMap.get(siteId) ?? 0);
      const profit = info.contractAmount - totalCost;
      const profitRate = info.contractAmount > 0 ? Math.round((profit / info.contractAmount) * 100) : 0;
      return {
        siteId, name: info.name, status: info.status,
        revenue: info.contractAmount, expense: totalCost,
        profit, profitRate,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // ════════════════════════════════════════
    // 3. 미수금 현황
    // ════════════════════════════════════════
    const unpaidPayments = await db
      .select({
        siteId: contracts.siteId, siteName: sites.name,
        type: contractPayments.type, amount: contractPayments.amount,
        dueDate: contractPayments.dueDate,
      })
      .from(contractPayments)
      .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
      .innerJoin(sites, eq(contracts.siteId, sites.id))
      .where(and(contractBase, eq(contractPayments.status, "미수")))
      .orderBy(contractPayments.dueDate);

    const today = now.toISOString().slice(0, 10);
    const receivables = unpaidPayments.map((p) => ({
      siteId: p.siteId, siteName: p.siteName, type: p.type,
      amount: p.amount ?? 0, dueDate: p.dueDate,
      isOverdue: p.dueDate ? p.dueDate < today : false,
      daysOverdue: p.dueDate && p.dueDate < today
        ? Math.floor((now.getTime() - new Date(p.dueDate).getTime()) / 86400000)
        : 0,
    }));

    // ════════════════════════════════════════
    // 4. 비용 카테고리 분석 (이번 달)
    // ════════════════════════════════════════
    const expenseByCategory = await db
      .select({
        category: expenses.category,
        total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(expenses)
      .where(and(expenseBase, gte(expenses.date, startOfMonth), lte(expenses.date, endOfMonth)))
      .groupBy(expenses.category);

    // ════════════════════════════════════════
    // 5. KPI 요약
    // ════════════════════════════════════════
    const currentMonth = monthlyRevenue[11]; // 이번 달
    const lastMonth = monthlyRevenue[10]; // 지난 달

    const totalContractValue = projectProfits.reduce((s, p) => s + p.revenue, 0);
    const totalCostValue = projectProfits.reduce((s, p) => s + p.expense, 0);
    const totalProfitValue = totalContractValue - totalCostValue;
    const avgProfitRate = totalContractValue > 0
      ? Math.round((totalProfitValue / totalContractValue) * 100) : 0;

    const totalUnpaid = receivables.reduce((s, r) => s + r.amount, 0);
    const overdueAmount = receivables.filter((r) => r.isOverdue).reduce((s, r) => s + r.amount, 0);

    // 3개월 캐시플로우 예측 (단순 이동 평균)
    const last3MonthsRevenue = monthlyRevenue.slice(9, 12);
    const avgMonthlyRevenue = Math.round(last3MonthsRevenue.reduce((s, m) => s + m.revenue, 0) / 3);
    const avgMonthlyExpense = Math.round(last3MonthsRevenue.reduce((s, m) => s + m.expense, 0) / 3);

    const cashFlowForecast = [];
    for (let i = 1; i <= 3; i++) {
      const forecastMonth = new Date(y, m + i, 1);
      const label = `${forecastMonth.getFullYear()}-${String(forecastMonth.getMonth() + 1).padStart(2, "0")}`;
      cashFlowForecast.push({
        month: label,
        expectedRevenue: avgMonthlyRevenue,
        expectedExpense: avgMonthlyExpense,
        netCashFlow: avgMonthlyRevenue - avgMonthlyExpense,
      });
    }

    // 연 목표 대비 진행률
    const annualTarget = 6_000_000_000; // 60억 (설정 가능하게 나중에)
    const ytdRevenue = monthlyRevenue.filter((m) => m.month.startsWith(String(y))).reduce((s, m) => s + m.revenue, 0);
    const targetProgress = Math.round((ytdRevenue / annualTarget) * 100);
    const monthsElapsed = m + 1;
    const expectedProgress = Math.round((monthsElapsed / 12) * 100);

    return ok({
      kpiSummary: {
        thisMonthRevenue: currentMonth?.revenue ?? 0,
        lastMonthRevenue: lastMonth?.revenue ?? 0,
        revenueGrowth: lastMonth?.revenue && lastMonth.revenue > 0
          ? Math.round(((currentMonth?.revenue ?? 0) - lastMonth.revenue) / lastMonth.revenue * 100) : 0,
        thisMonthExpense: currentMonth?.expense ?? 0,
        thisMonthProfit: currentMonth?.profit ?? 0,
        totalContractValue,
        totalCostValue,
        totalProfitValue,
        avgProfitRate,
        totalUnpaid,
        overdueAmount,
        annualTarget,
        ytdRevenue,
        targetProgress,
        expectedProgress,
      },
      monthlyTrend: monthlyRevenue,
      projectProfits,
      receivables,
      expenseByCategory,
      cashFlowForecast,
    });
  } catch (error) {
    return serverError(error);
  }
}
