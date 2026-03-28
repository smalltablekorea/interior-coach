import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  sites, contracts, contractPayments, expenses,
  materialOrders, estimates, constructionPhases,
} from "@/lib/db/schema";
import { eq, and, sql, gte, lte, ne, isNull, desc } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("tax", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;
  const siteId = request.nextUrl.searchParams.get("siteId");
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");

  try {
    // 현장별 정산 리포트
    if (siteId) {
      // 현장 소유권 확인
      const [site] = await db
        .select({
          id: sites.id,
          name: sites.name,
          status: sites.status,
          startDate: sites.startDate,
          endDate: sites.endDate,
        })
        .from(sites)
        .where(and(eq(sites.id, siteId), workspaceFilter(sites.workspaceId, sites.userId, wid, uid), isNull(sites.deletedAt)));

      if (!site) return err("현장을 찾을 수 없습니다", 404);

      // 계약금액
      const [contractTotal] = await db
        .select({ total: sql<number>`coalesce(sum(${contracts.contractAmount}), 0)::int` })
        .from(contracts)
        .where(and(eq(contracts.siteId, siteId), workspaceFilter(contracts.workspaceId, contracts.userId, wid, uid), isNull(contracts.deletedAt)));

      // 수금 현황
      const payments = await db
        .select({
          id: contractPayments.id,
          type: contractPayments.type,
          amount: contractPayments.amount,
          dueDate: contractPayments.dueDate,
          paidDate: contractPayments.paidDate,
          status: contractPayments.status,
        })
        .from(contractPayments)
        .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
        .where(and(eq(contracts.siteId, siteId), workspaceFilter(contracts.workspaceId, contracts.userId, wid, uid), isNull(contracts.deletedAt)));

      const collected = payments
        .filter((p) => p.status === "완납")
        .reduce((s, p) => s + (p.amount ?? 0), 0);
      const outstanding = payments
        .filter((p) => p.status === "미수")
        .reduce((s, p) => s + (p.amount ?? 0), 0);

      // 지출 카테고리별
      const expensesByCategory = await db
        .select({
          category: expenses.category,
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(expenses)
        .where(and(eq(expenses.siteId, siteId), workspaceFilter(expenses.workspaceId, expenses.userId, wid, uid), isNull(expenses.deletedAt)))
        .groupBy(expenses.category);

      // 자재비
      const [materialTotal] = await db
        .select({ total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
        .from(materialOrders)
        .where(and(eq(materialOrders.siteId, siteId), workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid), ne(materialOrders.status, "취소")));

      const totalExpense = expensesByCategory.reduce((s, e) => s + e.total, 0) + materialTotal.total;

      // 견적 대비
      const [estimateTotal] = await db
        .select({ total: sql<number>`coalesce(sum(${estimates.totalAmount}), 0)::int` })
        .from(estimates)
        .where(and(eq(estimates.siteId, siteId), workspaceFilter(estimates.workspaceId, estimates.userId, wid, uid), eq(estimates.status, "승인"), isNull(estimates.deletedAt)));

      // 공정 현황
      const [phaseStats] = await db
        .select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${constructionPhases.status} = '완료')::int`,
          avgProgress: sql<number>`coalesce(avg(${constructionPhases.progress}), 0)::int`,
        })
        .from(constructionPhases)
        .where(and(eq(constructionPhases.siteId, siteId), workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid)));

      const profit = contractTotal.total - totalExpense;
      const profitRate = contractTotal.total > 0 ? Math.round((profit / contractTotal.total) * 100) : 0;

      return ok({
        site: { id: site.id, name: site.name, status: site.status, startDate: site.startDate, endDate: site.endDate },
        financials: {
          contractAmount: contractTotal.total,
          estimateAmount: estimateTotal.total,
          totalExpense,
          materialExpense: materialTotal.total,
          otherExpenses: expensesByCategory,
          collected,
          outstanding,
          profit,
          profitRate,
          budgetVariance: estimateTotal.total > 0 ? totalExpense - estimateTotal.total : 0,
        },
        payments: payments.map((p) => ({
          type: p.type,
          amount: p.amount,
          dueDate: p.dueDate,
          paidDate: p.paidDate,
          status: p.status,
        })),
        progress: {
          totalPhases: phaseStats.total,
          completedPhases: phaseStats.completed,
          avgProgress: phaseStats.avgProgress,
        },
      });
    }

    // 전체 기간 요약 리포트
    const dateFrom = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const dateTo = endDate || new Date().toISOString().slice(0, 10);

    // 기간 내 수금
    const [periodRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(${contractPayments.amount}), 0)::int` })
      .from(contractPayments)
      .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
      .where(and(
        workspaceFilter(contracts.workspaceId, contracts.userId, wid, uid),
        isNull(contracts.deletedAt),
        eq(contractPayments.status, "완납"),
        gte(contractPayments.paidDate, dateFrom),
        lte(contractPayments.paidDate, dateTo),
      ));

    // 기간 내 지출
    const [periodExpenses] = await db
      .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
      .from(expenses)
      .where(and(
        workspaceFilter(expenses.workspaceId, expenses.userId, wid, uid),
        isNull(expenses.deletedAt),
        gte(expenses.date, dateFrom),
        lte(expenses.date, dateTo),
      ));

    const [periodMaterials] = await db
      .select({ total: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)::int` })
      .from(materialOrders)
      .where(and(
        workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
        ne(materialOrders.status, "취소"),
        gte(materialOrders.orderedDate, dateFrom),
        lte(materialOrders.orderedDate, dateTo),
      ));

    // 현장별 수익 요약
    const sitesSummary = await db
      .select({
        siteId: sites.id,
        siteName: sites.name,
        status: sites.status,
        contractAmount: sql<number>`coalesce(sum(${contracts.contractAmount}), 0)::int`,
      })
      .from(sites)
      .leftJoin(contracts, and(eq(contracts.siteId, sites.id), isNull(contracts.deletedAt)))
      .where(and(workspaceFilter(sites.workspaceId, sites.userId, wid, uid), isNull(sites.deletedAt)))
      .groupBy(sites.id, sites.name, sites.status)
      .orderBy(desc(sites.createdAt));

    const totalExpenseAmount = periodExpenses.total + periodMaterials.total;

    return ok({
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalRevenue: periodRevenue.total,
        totalExpenses: totalExpenseAmount,
        netProfit: periodRevenue.total - totalExpenseAmount,
        profitRate: periodRevenue.total > 0 ? Math.round(((periodRevenue.total - totalExpenseAmount) / periodRevenue.total) * 100) : 0,
      },
      sites: sitesSummary,
    });
  } catch (error) {
    return serverError(error);
  }
}
