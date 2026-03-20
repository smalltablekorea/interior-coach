import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { estimateItems, estimates, expenses } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: siteId } = await params;

  // Get the latest estimate for this site
  const [latestEstimate] = await db
    .select({ id: estimates.id, totalAmount: estimates.totalAmount })
    .from(estimates)
    .where(eq(estimates.siteId, siteId))
    .orderBy(sql`${estimates.createdAt} DESC`)
    .limit(1);

  if (!latestEstimate) {
    return NextResponse.json({ hasEstimate: false, categories: [], totalBudget: 0, totalSpent: 0 });
  }

  // Get estimate items grouped by category
  const budgetByCategory = await db
    .select({
      category: estimateItems.category,
      budgetAmount: sql<number>`COALESCE(SUM(${estimateItems.amount}), 0)`,
    })
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, latestEstimate.id))
    .groupBy(estimateItems.category);

  // Get expenses grouped by category for this site
  const spentByCategory = await db
    .select({
      category: expenses.category,
      spentAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.siteId, siteId))
    .groupBy(expenses.category);

  // Merge budget and spent data
  const categoryMap = new Map<string, { budget: number; spent: number }>();

  for (const b of budgetByCategory) {
    categoryMap.set(b.category, { budget: Number(b.budgetAmount), spent: 0 });
  }
  for (const s of spentByCategory) {
    const existing = categoryMap.get(s.category);
    if (existing) {
      existing.spent = Number(s.spentAmount);
    } else {
      categoryMap.set(s.category, { budget: 0, spent: Number(s.spentAmount) });
    }
  }

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    category: name,
    budget: data.budget,
    spent: data.spent,
    rate: data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : data.spent > 0 ? 999 : 0,
  }));

  const totalBudget = latestEstimate.totalAmount || categories.reduce((s, c) => s + c.budget, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);

  return NextResponse.json({
    hasEstimate: true,
    estimateId: latestEstimate.id,
    totalBudget,
    totalSpent,
    totalRate: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    categories,
  });
}
