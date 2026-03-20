import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, contractPayments, sites, customers, estimates } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    .where(eq(contracts.id, id))
    .limit(1);

  if (!contract) {
    return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
  }

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

  return NextResponse.json({ ...contract, payments });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { contractAmount, contractDate, memo, payments } = body;

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (contractAmount !== undefined) update.contractAmount = contractAmount;
  if (contractDate !== undefined) update.contractDate = contractDate || null;
  if (memo !== undefined) update.memo = memo || null;

  const [row] = await db
    .update(contracts)
    .set(update)
    .where(eq(contracts.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
  }

  // Update payment statuses if provided
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

  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(contracts).where(eq(contracts.id, id));
  return NextResponse.json({ success: true });
}
