import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { estimates, estimateItems, sites, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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

// 견적 상세 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();

  // 견적 기본 정보 + 현장 + 고객 조인
  const [row] = await db
    .select({
      id: estimates.id,
      version: estimates.version,
      totalAmount: estimates.totalAmount,
      status: estimates.status,
      profitRate: estimates.profitRate,
      overheadRate: estimates.overheadRate,
      vatEnabled: estimates.vatEnabled,
      memo: estimates.memo,
      metadata: estimates.metadata,
      siteId: estimates.siteId,
      createdAt: estimates.createdAt,
      updatedAt: estimates.updatedAt,
      siteName: sites.name,
      siteAddress: sites.address,
      areaPyeong: sites.areaPyeong,
      customerId: sites.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(estimates)
    .leftJoin(sites, eq(estimates.siteId, sites.id))
    .leftJoin(customers, eq(sites.customerId, customers.id))
    .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

  if (!row) {
    return NextResponse.json({ error: "견적을 찾을 수 없습니다" }, { status: 404 });
  }

  // 견적 항목
  const items = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, id))
    .orderBy(estimateItems.sortOrder);

  // metadata에서 추가 정보 추출
  const meta = (row.metadata as Record<string, unknown>) || {};

  return NextResponse.json({
    id: row.id,
    version: row.version,
    totalAmount: row.totalAmount,
    status: row.status,
    profitRate: row.profitRate,
    overheadRate: row.overheadRate,
    vatEnabled: row.vatEnabled,
    memo: row.memo,
    metadata: row.metadata,
    siteId: row.siteId,
    siteName: row.siteName || (meta.title as string) || "현장 미지정",
    siteAddress: row.siteAddress || (meta.siteAddress as string) || "",
    areaPyeong: row.areaPyeong || (meta.areaPyeong as number) || 0,
    customerName: row.customerName || (meta.clientName as string) || "",
    customerPhone: row.customerPhone || (meta.clientPhone as string) || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map((item) => ({
      id: item.id,
      category: item.category,
      itemName: item.itemName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
  });
}

// 견적 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  const body = await request.json();

  // 견적 소유권 확인
  const [existing] = await db
    .select({ id: estimates.id })
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "견적을 찾을 수 없습니다" }, { status: 404 });
  }

  // 항목 업데이트가 있으면 처리
  if (body.items) {
    // 기존 항목 삭제 후 재생성
    await db.delete(estimateItems).where(eq(estimateItems.estimateId, id));

    if (body.items.length > 0) {
      await db.insert(estimateItems).values(
        body.items.map((item: { category: string; itemName: string; unit?: string; quantity?: number; unitPrice?: number; amount?: number }, idx: number) => ({
          estimateId: id,
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

    // 총액 재계산
    const newTotal = body.items.reduce(
      (sum: number, item: { amount?: number }) => sum + (item.amount ?? 0),
      0
    );

    await db
      .update(estimates)
      .set({
        totalAmount: newTotal,
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, id));
  }

  // 상태, 메모 등 필드 업데이트
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.memo !== undefined) updateFields.memo = body.memo;
  if (body.profitRate !== undefined) updateFields.profitRate = body.profitRate;
  if (body.overheadRate !== undefined) updateFields.overheadRate = body.overheadRate;
  if (body.vatEnabled !== undefined) updateFields.vatEnabled = body.vatEnabled;
  if (body.totalAmount !== undefined) updateFields.totalAmount = body.totalAmount;

  if (Object.keys(updateFields).length > 1) {
    await db
      .update(estimates)
      .set(updateFields)
      .where(eq(estimates.id, id));
  }

  return NextResponse.json({ message: "수정되었습니다" });
}

// 견적 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();

  const [existing] = await db
    .select({ id: estimates.id })
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "견적을 찾을 수 없습니다" }, { status: 404 });
  }

  // cascade로 estimate_items도 자동 삭제
  await db.delete(estimates).where(eq(estimates.id, id));

  return NextResponse.json({ message: "삭제되었습니다" });
}
