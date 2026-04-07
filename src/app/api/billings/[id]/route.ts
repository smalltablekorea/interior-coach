import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { billings, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { logActivity } from "@/lib/activity-log";
import type { UpdateBillingRequest, BillingStatus } from "@/types/billing";

const VALID_STATUSES: BillingStatus[] = ["pending", "invoiced", "paid", "overdue", "cancelled"];

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/billings/[id] — 수금 상세 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [row] = await db
      .select({
        id: billings.id,
        siteId: billings.siteId,
        siteName: sites.name,
        milestoneName: billings.milestoneName,
        tradeId: billings.tradeId,
        milestoneOrder: billings.milestoneOrder,
        amount: billings.amount,
        taxAmount: billings.taxAmount,
        status: billings.status,
        dueDate: billings.dueDate,
        invoicedAt: billings.invoicedAt,
        paidAt: billings.paidAt,
        invoiceNumber: billings.invoiceNumber,
        paymentMethod: billings.paymentMethod,
        notes: billings.notes,
        createdAt: billings.createdAt,
        updatedAt: billings.updatedAt,
      })
      .from(billings)
      .leftJoin(sites, eq(billings.siteId, sites.id))
      .where(
        and(
          eq(billings.id, id),
          workspaceFilter(billings.workspaceId, billings.userId, auth.workspaceId, auth.userId),
        ),
      )
      .limit(1);

    if (!row) return notFound("수금 항목을 찾을 수 없습니다.");
    return ok({ ...row, totalAmount: (row.amount || 0) + (row.taxAmount || 0) });
  } catch (error) {
    return serverError(error);
  }
}

/** PATCH /api/billings/[id] — 수금 수정 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body: UpdateBillingRequest = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.milestoneName !== undefined) updates.milestoneName = body.milestoneName.trim();
    if (body.tradeId !== undefined) updates.tradeId = body.tradeId || null;
    if (body.milestoneOrder !== undefined) updates.milestoneOrder = body.milestoneOrder;
    if (body.amount !== undefined) {
      if (body.amount <= 0) return err("금액은 0보다 커야 합니다.");
      updates.amount = body.amount;
    }
    if (body.taxAmount !== undefined) updates.taxAmount = body.taxAmount;
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) return err("유효하지 않은 상태입니다.");
      updates.status = body.status;
      if (body.status === "invoiced") updates.invoicedAt = new Date();
      if (body.status === "paid") updates.paidAt = new Date();
    }
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate || null;
    if (body.invoicedAt !== undefined) updates.invoicedAt = body.invoicedAt ? new Date(body.invoicedAt) : null;
    if (body.paidAt !== undefined) updates.paidAt = body.paidAt ? new Date(body.paidAt) : null;
    if (body.invoiceNumber !== undefined) updates.invoiceNumber = body.invoiceNumber || null;
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod || null;
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;

    const [updated] = await db
      .update(billings)
      .set(updates)
      .where(
        and(
          eq(billings.id, id),
          workspaceFilter(billings.workspaceId, billings.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning();

    if (!updated) return notFound("수금 항목을 찾을 수 없습니다.");

    if (body.status === "paid") {
      logActivity({
        siteId: updated.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        action: "billing_paid",
        targetType: "billing",
        targetId: updated.id,
        metadata: {
          milestoneName: updated.milestoneName,
          amount: updated.amount,
          taxAmount: updated.taxAmount,
        },
      });
    } else if (body.status === "invoiced") {
      logActivity({
        siteId: updated.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        action: "billing_invoiced",
        targetType: "billing",
        targetId: updated.id,
        metadata: { milestoneName: updated.milestoneName },
      });
    }

    return ok({ ...updated, totalAmount: (updated.amount || 0) + (updated.taxAmount || 0) });
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE /api/billings/[id] — 수금 삭제 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "delete");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [deleted] = await db
      .delete(billings)
      .where(
        and(
          eq(billings.id, id),
          workspaceFilter(billings.workspaceId, billings.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning({ id: billings.id, siteId: billings.siteId, milestoneName: billings.milestoneName });

    if (!deleted) return notFound("수금 항목을 찾을 수 없습니다.");

    logActivity({
      siteId: deleted.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "billing_deleted",
      targetType: "billing",
      targetId: deleted.id,
      metadata: { milestoneName: deleted.milestoneName },
    });

    return ok({ message: "삭제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}
