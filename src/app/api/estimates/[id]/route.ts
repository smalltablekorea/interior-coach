import { db } from "@/lib/db";
import { estimates, estimateItems, sites, customers } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { logEstimateChange } from "@/lib/api/estimate-audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

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
    .where(and(eq(estimates.id, id), workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId), isNull(estimates.deletedAt)));

  if (!row) return notFound("견적을 찾을 수 없습니다");

  const items = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, id))
    .orderBy(estimateItems.sortOrder);

  const meta = (row.metadata as Record<string, unknown>) || {};

  return ok({
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [existing] = await db
    .select({ id: estimates.id, updatedAt: estimates.updatedAt })
    .from(estimates)
    .where(and(eq(estimates.id, id), workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId), isNull(estimates.deletedAt)));

  if (!existing) return notFound("견적을 찾을 수 없습니다");

  try {
    const body = await request.json();

    // Optimistic locking: 클라이언트가 보낸 updatedAt과 DB의 updatedAt 비교
    if (body.expectedUpdatedAt && existing.updatedAt) {
      const clientTime = new Date(body.expectedUpdatedAt).getTime();
      const dbTime = new Date(existing.updatedAt).getTime();
      if (clientTime !== dbTime) {
        return err("다른 사용자가 이미 수정했습니다. 새로고침 후 다시 시도해주세요.", 409);
      }
    }

    if (body.items) {
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

      const newTotal = body.items.reduce(
        (sum: number, item: { amount?: number }) => sum + (item.amount ?? 0),
        0
      );

      await db
        .update(estimates)
        .set({ totalAmount: newTotal, updatedAt: new Date() })
        .where(eq(estimates.id, id));
    }

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.memo !== undefined) updateFields.memo = body.memo;
    if (body.profitRate !== undefined) updateFields.profitRate = body.profitRate;
    if (body.overheadRate !== undefined) updateFields.overheadRate = body.overheadRate;
    if (body.vatEnabled !== undefined) updateFields.vatEnabled = body.vatEnabled;
    if (body.totalAmount !== undefined) updateFields.totalAmount = body.totalAmount;

    if (Object.keys(updateFields).length > 1) {
      await db.update(estimates).set(updateFields).where(eq(estimates.id, id));
    }

    // Audit log 기록
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (body.status !== undefined) changes.status = { old: null, new: body.status };
    if (body.items) changes.items = { old: "이전 항목", new: `${body.items.length}개 항목` };
    if (body.profitRate !== undefined) changes.profitRate = { old: null, new: body.profitRate };
    if (body.overheadRate !== undefined) changes.overheadRate = { old: null, new: body.overheadRate };

    const action = body.status ? "status_changed" as const : body.items ? "items_updated" as const : "updated" as const;
    await logEstimateChange({ estimateId: id, userId: auth.userId, action, changes });

    return ok({ message: "수정되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [row] = await db
    .update(estimates)
    .set({ deletedAt: new Date() })
    .where(and(eq(estimates.id, id), workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId), isNull(estimates.deletedAt)))
    .returning({ id: estimates.id });

  if (!row) return notFound("견적을 찾을 수 없습니다");
  return ok({ id: row.id });
}
