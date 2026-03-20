import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, contractPayments, sites, customers } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: contracts.id,
      contractAmount: contracts.contractAmount,
      contractDate: contracts.contractDate,
      siteName: sites.name,
      siteId: contracts.siteId,
      createdAt: contracts.createdAt,
    })
    .from(contracts)
    .leftJoin(sites, eq(contracts.siteId, sites.id))
    .orderBy(desc(contracts.createdAt));

  // Get payments for each contract
  const result = await Promise.all(
    rows.map(async (c) => {
      const pays = await db
        .select({
          id: contractPayments.id,
          type: contractPayments.type,
          amount: contractPayments.amount,
          dueDate: contractPayments.dueDate,
          paidDate: contractPayments.paidDate,
          status: contractPayments.status,
        })
        .from(contractPayments)
        .where(eq(contractPayments.contractId, c.id));
      return { ...c, payments: pays };
    })
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siteId, estimateId, contractAmount, contractDate, memo, payments } = body;

    if (!contractAmount) {
      return NextResponse.json({ error: "계약금액은 필수입니다" }, { status: 400 });
    }

    const [row] = await db
      .insert(contracts)
      .values({
        userId: "system",
        siteId: siteId || null,
        estimateId: estimateId || null,
        contractAmount,
        contractDate: contractDate || null,
        memo: memo || null,
      })
      .returning();

    // Insert payments if provided
    if (payments && Array.isArray(payments) && payments.length > 0) {
      await db.insert(contractPayments).values(
        payments.map((p: { type: string; amount: number; dueDate?: string }) => ({
          contractId: row.id,
          type: p.type,
          amount: p.amount,
          dueDate: p.dueDate || null,
          status: "미수" as const,
        }))
      );
    }

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
