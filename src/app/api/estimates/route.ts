import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { estimates, estimateItems, sites } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? "system";
  } catch {
    return "system";
  }
}

// 견적 목록 조회
export async function GET(request: NextRequest) {
  const userId = await getUserId();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const siteIdFilter = searchParams.get("siteId");

  let conditions = eq(estimates.userId, userId);
  if (statusFilter) {
    conditions = and(conditions, eq(estimates.status, statusFilter))!;
  }
  if (siteIdFilter) {
    conditions = and(conditions, eq(estimates.siteId, siteIdFilter))!;
  }

  const rows = await db
    .select({
      id: estimates.id,
      version: estimates.version,
      totalAmount: estimates.totalAmount,
      status: estimates.status,
      siteName: sites.name,
      siteId: estimates.siteId,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .leftJoin(sites, eq(estimates.siteId, sites.id))
    .where(conditions)
    .orderBy(desc(estimates.createdAt));

  return NextResponse.json(rows);
}

// 빠른 견적 생성 (모달에서)
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  const body = await request.json();
  const {
    siteId,
    totalAmount,
    profitRate,
    overheadRate,
    vatEnabled,
    items,
  } = body;

  // 트랜잭션: estimate + items 생성
  const [estimate] = await db
    .insert(estimates)
    .values({
      userId,
      siteId: siteId || null,
      version: 1,
      totalAmount: totalAmount || 0,
      profitRate: profitRate ?? 10,
      overheadRate: overheadRate ?? 5,
      vatEnabled: vatEnabled ?? true,
      status: "작성중",
    })
    .returning();

  if (items && items.length > 0) {
    await db.insert(estimateItems).values(
      items.map((item: { category: string; itemName: string; unit?: string; quantity?: number; unitPrice?: number; amount?: number }, idx: number) => ({
        estimateId: estimate.id,
        category: item.category,
        itemName: item.itemName,
        unit: item.unit || "식",
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        amount: item.amount ?? 0,
        sortOrder: idx,
      }))
    );
  }

  return NextResponse.json(estimate, { status: 201 });
}
