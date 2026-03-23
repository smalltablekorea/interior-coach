import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, customers, estimates, contracts, contractPayments, constructionPhases } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, notFound, serverError } from "@/lib/api/response";
import { validateBody, siteSchema } from "@/lib/api/validate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

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
    .where(and(eq(sites.id, id), eq(sites.userId, auth.userId)))
    .limit(1);

  if (!site) return notFound("현장을 찾을 수 없습니다");

  const siteEstimates = await db
    .select({
      id: estimates.id,
      version: estimates.version,
      totalAmount: estimates.totalAmount,
      status: estimates.status,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .where(and(eq(estimates.siteId, id), eq(estimates.userId, auth.userId)))
    .orderBy(desc(estimates.createdAt));

  const siteContracts = await db
    .select({
      id: contracts.id,
      contractAmount: contracts.contractAmount,
      contractDate: contracts.contractDate,
    })
    .from(contracts)
    .where(and(eq(contracts.siteId, id), eq(contracts.userId, auth.userId)));

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
    .where(and(eq(constructionPhases.siteId, id), eq(constructionPhases.userId, auth.userId)))
    .orderBy(constructionPhases.sortOrder);

  return ok({
    ...site,
    estimates: siteEstimates,
    contracts: contractsWithPayments,
    phases,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const validation = await validateBody(request, siteSchema.partial());
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .update(sites)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(and(eq(sites.id, id), eq(sites.userId, auth.userId)))
      .returning();

    if (!row) return notFound("현장을 찾을 수 없습니다");
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [row] = await db
    .delete(sites)
    .where(and(eq(sites.id, id), eq(sites.userId, auth.userId)))
    .returning({ id: sites.id });

  if (!row) return notFound("현장을 찾을 수 없습니다");
  return ok({ id: row.id });
}
