import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contracts, contractPayments, sites, customers, estimates } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, notFound, serverError } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const [contract] = await db
      .select({
        id: contracts.id,
        contractAmount: contracts.contractAmount,
        contractDate: contracts.contractDate,
        siteId: contracts.siteId,
        siteName: sites.name,
        customerName: customers.name,
        customerPhone: customers.phone,
        memo: contracts.memo,
        createdAt: contracts.createdAt,
        estimateId: contracts.estimateId,
        estimateAmount: estimates.totalAmount,
      })
      .from(contracts)
      .leftJoin(sites, eq(contracts.siteId, sites.id))
      .leftJoin(customers, eq(sites.customerId, customers.id))
      .leftJoin(estimates, eq(contracts.estimateId, estimates.id))
      .where(and(eq(contracts.id, id), workspaceFilter(contracts.workspaceId, contracts.userId, auth.workspaceId, auth.userId), isNull(contracts.deletedAt)))
      .limit(1);

    if (!contract) return notFound("계약을 찾을 수 없습니다");

    const payments = await db
      .select({
        id: contractPayments.id,
        type: contractPayments.type,
        amount: contractPayments.amount,
        dueDate: contractPayments.dueDate,
        paidDate: contractPayments.paidDate,
        status: contractPayments.status,
        memo: contractPayments.memo,
      })
      .from(contractPayments)
      .where(eq(contractPayments.contractId, id));

    return ok({ ...contract, payments });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { contractAmount, contractDate, memo, payments } = body;

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (contractAmount !== undefined) update.contractAmount = contractAmount;
    if (contractDate !== undefined) update.contractDate = contractDate || null;
    if (memo !== undefined) update.memo = memo || null;

    const [row] = await db
      .update(contracts)
      .set(update)
      .where(and(eq(contracts.id, id), workspaceFilter(contracts.workspaceId, contracts.userId, auth.workspaceId, auth.userId), isNull(contracts.deletedAt)))
      .returning();

    if (!row) return notFound("계약을 찾을 수 없습니다");

    if (payments && Array.isArray(payments)) {
      for (const p of payments) {
        const payUpdate: Record<string, unknown> = {};
        if (p.status !== undefined) {
          payUpdate.status = p.status;
          if (p.status === "완납" && !p.paidDate) {
            payUpdate.paidDate = new Date().toISOString().split("T")[0];
          }
        }
        if (p.paidDate !== undefined) payUpdate.paidDate = p.paidDate || null;
        if (p.amount !== undefined) payUpdate.amount = p.amount;
        if (p.dueDate !== undefined) payUpdate.dueDate = p.dueDate || null;
        if (p.memo !== undefined) payUpdate.memo = p.memo || null;
        if (Object.keys(payUpdate).length > 0) {
          await db.update(contractPayments).set(payUpdate).where(eq(contractPayments.id, p.id));
        }
      }
    }

    return ok(row);
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

  try {
    const { id } = await params;

    const [row] = await db
      .update(contracts)
      .set({ deletedAt: new Date() })
      .where(and(eq(contracts.id, id), workspaceFilter(contracts.workspaceId, contracts.userId, auth.workspaceId, auth.userId), isNull(contracts.deletedAt)))
      .returning({ id: contracts.id });

    if (!row) return notFound("계약을 찾을 수 없습니다");
    return ok({ id: row.id });
  } catch (error) {
    return serverError(error);
  }
}
