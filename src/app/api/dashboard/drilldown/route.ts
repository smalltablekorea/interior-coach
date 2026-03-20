import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  estimates,
  estimateItems,
  expenses,
  materialOrders,
  contracts,
  sites,
} from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");

  if (!siteId) {
    return NextResponse.json(
      { error: "siteId 필수" },
      { status: 400 },
    );
  }

  // 현장 정보
  const [site] = await db
    .select({ id: sites.id, name: sites.name })
    .from(sites)
    .where(eq(sites.id, siteId));

  if (!site) {
    return NextResponse.json(
      { error: "현장을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  // 견적 (가장 최신 버전)
  const [latestEstimate] = await db
    .select({ id: estimates.id, totalAmount: estimates.totalAmount })
    .from(estimates)
    .where(eq(estimates.siteId, siteId))
    .orderBy(sql`${estimates.version} desc`)
    .limit(1);

  // 공종별 견적가 합계
  let estimateByCategory: { category: string; amount: number }[] = [];
  if (latestEstimate) {
    estimateByCategory = await db
      .select({
        category: estimateItems.category,
        amount: sql<number>`coalesce(sum(${estimateItems.amount}), 0)`.as(
          "amount",
        ),
      })
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, latestEstimate.id))
      .groupBy(estimateItems.category);
  }

  // 공종별 실제 지출 합계 (expenses)
  const expenseByCategory = await db
    .select({
      category: expenses.category,
      amount: sql<number>`coalesce(sum(${expenses.amount}), 0)`.as("amount"),
    })
    .from(expenses)
    .where(eq(expenses.siteId, siteId))
    .groupBy(expenses.category);

  // 자재 발주 비용 (materialOrders)
  const materialByCategory = await db
    .select({
      amount: sql<number>`coalesce(sum(${materialOrders.totalAmount}), 0)`.as(
        "amount",
      ),
    })
    .from(materialOrders)
    .where(
      and(
        eq(materialOrders.siteId, siteId),
        sql`${materialOrders.status} != '취소'`,
      ),
    );

  const totalMaterialCost = materialByCategory[0]?.amount ?? 0;

  // 계약금액
  const [contract] = await db
    .select({ contractAmount: contracts.contractAmount })
    .from(contracts)
    .where(eq(contracts.siteId, siteId))
    .limit(1);

  const contractAmount = contract?.contractAmount ?? 0;

  // 카테고리 병합 (견적 vs 실행)
  const allCategories = new Set<string>();
  estimateByCategory.forEach((e) => allCategories.add(e.category));
  expenseByCategory.forEach((e) => allCategories.add(e.category));

  const comparison = Array.from(allCategories).map((category) => {
    const est = estimateByCategory.find((e) => e.category === category);
    const exp = expenseByCategory.find((e) => e.category === category);
    const estimateAmt = Number(est?.amount ?? 0);
    const expenseAmt = Number(exp?.amount ?? 0);
    const diff = estimateAmt - expenseAmt;
    const rate = estimateAmt > 0 ? (expenseAmt / estimateAmt) * 100 : 0;

    return {
      category,
      estimate: estimateAmt,
      actual: expenseAmt,
      diff,
      rate: Math.round(rate),
      isOver: expenseAmt > estimateAmt,
    };
  });

  // 합계
  const totalEstimate = comparison.reduce((s, c) => s + c.estimate, 0);
  const totalActual =
    comparison.reduce((s, c) => s + c.actual, 0) + totalMaterialCost;

  return NextResponse.json({
    siteId: site.id,
    siteName: site.name,
    contractAmount,
    totalEstimate: latestEstimate?.totalAmount ?? totalEstimate,
    totalActual,
    expectedProfit: contractAmount - totalActual,
    expectedProfitRate:
      contractAmount > 0
        ? Math.round(((contractAmount - totalActual) / contractAmount) * 100)
        : 0,
    comparison,
    totalMaterialCost,
  });
}
