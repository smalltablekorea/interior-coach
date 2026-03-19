import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, customers, estimates, contracts, contractPayments, constructionPhases } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get site with customer info
  const [site] = await db
    .select({
      id: sites.id,
      name: sites.name,
      address: sites.address,
      buildingType: sites.buildingType,
      areaPyeong: sites.areaPyeong,
      status: sites.status,
      startDate: sites.startDate,
      endDate: sites.endDate,
      memo: sites.memo,
      customerName: customers.name,
      customerId: sites.customerId,
      customerPhone: customers.phone,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .leftJoin(customers, eq(sites.customerId, customers.id))
    .where(eq(sites.id, id))
    .limit(1);

  if (!site) {
    return NextResponse.json({ error: "현장을 찾을 수 없습니다" }, { status: 404 });
  }

  // Get related estimates
  const siteEstimates = await db
    .select({
      id: estimates.id,
      version: estimates.version,
      totalAmount: estimates.totalAmount,
      status: estimates.status,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .where(eq(estimates.siteId, id))
    .orderBy(sql`${estimates.createdAt} DESC`);

  // Get related contracts with payments
  const siteContracts = await db
    .select({
      id: contracts.id,
      contractAmount: contracts.contractAmount,
      contractDate: contracts.contractDate,
    })
    .from(contracts)
    .where(eq(contracts.siteId, id));

  const contractsWithPayments = await Promise.all(
    siteContracts.map(async (c) => {
      const payments = await db
        .select({
          type: contractPayments.type,
          amount: contractPayments.amount,
          status: contractPayments.status,
          dueDate: contractPayments.dueDate,
          paidDate: contractPayments.paidDate,
        })
        .from(contractPayments)
        .where(eq(contractPayments.contractId, c.id));
      return { ...c, payments };
    })
  );

  // Get construction phases
  const phases = await db
    .select({
      id: constructionPhases.id,
      category: constructionPhases.category,
      progress: constructionPhases.progress,
      status: constructionPhases.status,
      plannedStart: constructionPhases.plannedStart,
      plannedEnd: constructionPhases.plannedEnd,
    })
    .from(constructionPhases)
    .where(eq(constructionPhases.siteId, id))
    .orderBy(constructionPhases.sortOrder);

  return NextResponse.json({
    ...site,
    estimates: siteEstimates,
    contracts: contractsWithPayments,
    phases,
    expenses: [],
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, customerId, address, buildingType, areaPyeong, status, startDate, endDate, memo } = body;

  const [row] = await db
    .update(sites)
    .set({
      name,
      customerId: customerId || null,
      address: address || null,
      buildingType: buildingType || null,
      areaPyeong: areaPyeong || null,
      status: status || "상담중",
      startDate: startDate || null,
      endDate: endDate || null,
      memo: memo || null,
      updatedAt: new Date(),
    })
    .where(eq(sites.id, id))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(sites).where(eq(sites.id, id));
  return NextResponse.json({ success: true });
}
