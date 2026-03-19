import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, sites, estimates, contracts, contractPayments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get customer
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "고객을 찾을 수 없습니다" }, { status: 404 });
  }

  // Get related sites
  const customerSites = await db
    .select({
      id: sites.id,
      name: sites.name,
      status: sites.status,
      areaPyeong: sites.areaPyeong,
    })
    .from(sites)
    .where(eq(sites.customerId, id));

  // Get related estimates
  const customerEstimates = await db
    .select({
      id: estimates.id,
      siteName: sites.name,
      totalAmount: estimates.totalAmount,
      status: estimates.status,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .leftJoin(sites, eq(estimates.siteId, sites.id))
    .where(eq(sites.customerId, id));

  // Get related contracts with paid amounts
  const customerContracts = await db
    .select({
      id: contracts.id,
      siteName: sites.name,
      contractAmount: contracts.contractAmount,
      paidAmount: sql<number>`COALESCE(SUM(CASE WHEN ${contractPayments.status} = '완납' THEN ${contractPayments.amount} ELSE 0 END), 0)`,
    })
    .from(contracts)
    .leftJoin(sites, eq(contracts.siteId, sites.id))
    .leftJoin(contractPayments, eq(contractPayments.contractId, contracts.id))
    .where(eq(sites.customerId, id))
    .groupBy(contracts.id, sites.name);

  return NextResponse.json({
    ...customer,
    sites: customerSites,
    estimates: customerEstimates,
    contracts: customerContracts,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, phone, email, address, memo } = body;

  const [row] = await db
    .update(customers)
    .set({
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      memo: memo || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(customers).where(eq(customers.id, id));
  return NextResponse.json({ success: true });
}
