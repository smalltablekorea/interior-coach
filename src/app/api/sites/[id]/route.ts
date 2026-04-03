import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, customers, estimates, contracts, contractPayments, constructionPhases } from "@/lib/db/schema";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, notFound, serverError } from "@/lib/api/response";
import { validateBody, siteSchema } from "@/lib/api/validate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
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
      .where(and(eq(sites.id, id), workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId), isNull(sites.deletedAt)))
      .limit(1);

    if (!site) return notFound("현장을 찾을 수 없습니다");

    const [siteEstimates, siteContracts, phases] = await Promise.all([
      db
        .select({
          id: estimates.id,
          version: estimates.version,
          totalAmount: estimates.totalAmount,
          status: estimates.status,
          createdAt: estimates.createdAt,
        })
        .from(estimates)
        .where(and(eq(estimates.siteId, id), workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId), isNull(estimates.deletedAt)))
        .orderBy(desc(estimates.createdAt)),
      db
        .select({
          id: contracts.id,
          contractAmount: contracts.contractAmount,
          contractDate: contracts.contractDate,
        })
        .from(contracts)
        .where(and(eq(contracts.siteId, id), workspaceFilter(contracts.workspaceId, contracts.userId, auth.workspaceId, auth.userId), isNull(contracts.deletedAt))),
      db
        .select({
          id: constructionPhases.id,
          category: constructionPhases.category,
          progress: constructionPhases.progress,
          status: constructionPhases.status,
          plannedStart: constructionPhases.plannedStart,
          plannedEnd: constructionPhases.plannedEnd,
        })
        .from(constructionPhases)
        .where(and(eq(constructionPhases.siteId, id), workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, auth.workspaceId, auth.userId)))
        .orderBy(constructionPhases.sortOrder),
    ]);

    const contractIds = siteContracts.map((c) => c.id);
    const allPayments = contractIds.length > 0
      ? await db
          .select({
            contractId: contractPayments.contractId,
            type: contractPayments.type,
            amount: contractPayments.amount,
            status: contractPayments.status,
            dueDate: contractPayments.dueDate,
            paidDate: contractPayments.paidDate,
          })
          .from(contractPayments)
          .where(inArray(contractPayments.contractId, contractIds))
      : [];

    const paymentsByContract = new Map<string, typeof allPayments>();
    for (const p of allPayments) {
      const arr = paymentsByContract.get(p.contractId) || [];
      arr.push(p);
      paymentsByContract.set(p.contractId, arr);
    }

    const contractsWithPayments = siteContracts.map((c) => ({
      ...c,
      payments: (paymentsByContract.get(c.id) || []).map(({ contractId, ...rest }) => rest),
    }));

    return ok({
      ...site,
      estimates: siteEstimates,
      contracts: contractsWithPayments,
      phases,
    });
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
  const validation = await validateBody(request, siteSchema.partial());
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .update(sites)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(and(eq(sites.id, id), workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId), isNull(sites.deletedAt)))
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
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const [row] = await db
      .update(sites)
      .set({ deletedAt: new Date() })
      .where(and(eq(sites.id, id), workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId), isNull(sites.deletedAt)))
      .returning({ id: sites.id });

    if (!row) return notFound("현장을 찾을 수 없습니다");
    return ok({ id: row.id });
  } catch (error) {
    return serverError(error);
  }
}
