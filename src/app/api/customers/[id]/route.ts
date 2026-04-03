import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { customers, sites, estimates, contracts, contractPayments } from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, notFound, serverError } from "@/lib/api/response";
import { validateBody, customerSchema } from "@/lib/api/validate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId), isNull(customers.deletedAt)))
      .limit(1);

    if (!customer) {
      return notFound("고객을 찾을 수 없습니다");
    }

    const [customerSites, customerEstimates, customerContracts] = await Promise.all([
      db
        .select({
          id: sites.id,
          name: sites.name,
          status: sites.status,
          areaPyeong: sites.areaPyeong,
        })
        .from(sites)
        .where(and(eq(sites.customerId, id), workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId), isNull(sites.deletedAt))),
      db
        .select({
          id: estimates.id,
          siteName: sites.name,
          totalAmount: estimates.totalAmount,
          status: estimates.status,
          createdAt: estimates.createdAt,
        })
        .from(estimates)
        .leftJoin(sites, eq(estimates.siteId, sites.id))
        .where(and(eq(sites.customerId, id), workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId), isNull(estimates.deletedAt))),
      db
        .select({
          id: contracts.id,
          siteName: sites.name,
          contractAmount: contracts.contractAmount,
          paidAmount: sql<number>`COALESCE(SUM(CASE WHEN ${contractPayments.status} = '완납' THEN ${contractPayments.amount} ELSE 0 END), 0)`,
        })
        .from(contracts)
        .leftJoin(sites, eq(contracts.siteId, sites.id))
        .leftJoin(contractPayments, eq(contractPayments.contractId, contracts.id))
        .where(and(eq(sites.customerId, id), workspaceFilter(contracts.workspaceId, contracts.userId, auth.workspaceId, auth.userId), isNull(contracts.deletedAt)))
        .groupBy(contracts.id, sites.name),
    ]);

    return ok({
      ...customer,
      sites: customerSites,
      estimates: customerEstimates,
      contracts: customerContracts,
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

  const validation = await validateBody(request, customerSchema.partial());
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .update(customers)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(and(eq(customers.id, id), workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId), isNull(customers.deletedAt)))
      .returning();

    if (!row) return notFound("고객을 찾을 수 없습니다");
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
      .update(customers)
      .set({ deletedAt: new Date() })
      .where(and(eq(customers.id, id), workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId), isNull(customers.deletedAt)))
      .returning({ id: customers.id });

    if (!row) return notFound("고객을 찾을 수 없습니다");
    return ok({ id: row.id });
  } catch (error) {
    return serverError(error);
  }
}
