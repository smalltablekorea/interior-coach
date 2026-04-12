import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { estimates, estimateItems } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";

// 두 견적 버전 비교
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const compareId = new URL(request.url).searchParams.get("compareWith");

  if (!compareId) return err("compareWith 파라미터가 필요합니다.");

  try {
    // 두 견적 모두 조회
    const [estA, estB] = await Promise.all([
      db.select({
        id: estimates.id, version: estimates.version, totalAmount: estimates.totalAmount,
        profitRate: estimates.profitRate, overheadRate: estimates.overheadRate,
        vatEnabled: estimates.vatEnabled, status: estimates.status, createdAt: estimates.createdAt,
      }).from(estimates).where(and(eq(estimates.id, id), workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId), isNull(estimates.deletedAt))),
      db.select({
        id: estimates.id, version: estimates.version, totalAmount: estimates.totalAmount,
        profitRate: estimates.profitRate, overheadRate: estimates.overheadRate,
        vatEnabled: estimates.vatEnabled, status: estimates.status, createdAt: estimates.createdAt,
      }).from(estimates).where(and(eq(estimates.id, compareId), workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId), isNull(estimates.deletedAt))),
    ]);

    if (!estA[0]) return notFound("기준 견적을 찾을 수 없습니다");
    if (!estB[0]) return notFound("비교 견적을 찾을 수 없습니다");

    // 항목 조회
    const [itemsA, itemsB] = await Promise.all([
      db.select().from(estimateItems).where(eq(estimateItems.estimateId, id)).orderBy(estimateItems.sortOrder),
      db.select().from(estimateItems).where(eq(estimateItems.estimateId, compareId)).orderBy(estimateItems.sortOrder),
    ]);

    // 공종별 비교
    const categoriesA = groupByCategory(itemsA);
    const categoriesB = groupByCategory(itemsB);

    const allCategories = [...new Set([...Object.keys(categoriesA), ...Object.keys(categoriesB)])];

    const comparison = allCategories.map((cat) => {
      const a = categoriesA[cat] ?? { items: [], total: 0 };
      const b = categoriesB[cat] ?? { items: [], total: 0 };
      return {
        category: cat,
        versionA: { items: a.items, total: a.total },
        versionB: { items: b.items, total: b.total },
        diff: b.total - a.total,
        diffPercent: a.total > 0 ? Math.round(((b.total - a.total) / a.total) * 100) : null,
      };
    });

    return ok({
      versionA: estA[0],
      versionB: estB[0],
      totalDiff: (estB[0].totalAmount ?? 0) - (estA[0].totalAmount ?? 0),
      comparison,
    });
  } catch (error) {
    return serverError(error);
  }
}

type ItemRow = { category: string; itemName: string; amount: number | null };

function groupByCategory(items: ItemRow[]) {
  const grouped: Record<string, { items: { name: string; amount: number }[]; total: number }> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = { items: [], total: 0 };
    const amount = item.amount ?? 0;
    grouped[item.category].items.push({ name: item.itemName, amount });
    grouped[item.category].total += amount;
  }
  return grouped;
}
