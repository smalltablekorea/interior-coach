import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { customers, sites, estimates, contracts, contractPayments, customerStatusHistory, user } from "@/lib/db/schema";
import { eq, and, sql, isNull, desc } from "drizzle-orm";
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

    const [customerSites, customerEstimates, customerContracts, statusHistory] = await Promise.all([
      db
        .select({
          id: sites.id,
          name: sites.name,
          status: sites.status,
          areaPyeong: sites.areaPyeong,
          address: sites.address,
          buildingType: sites.buildingType,
          createdAt: sites.createdAt,
        })
        .from(sites)
        .where(and(eq(sites.customerId, id), workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId), isNull(sites.deletedAt)))
        .orderBy(desc(sites.createdAt)),
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
      // 상담이력 — 최근 N개만 (전체는 별도 엔드포인트). 사용자명 join 으로 표시.
      db
        .select({
          id: customerStatusHistory.id,
          fromStatus: customerStatusHistory.fromStatus,
          toStatus: customerStatusHistory.toStatus,
          note: customerStatusHistory.note,
          changedAt: customerStatusHistory.changedAt,
          changedBy: customerStatusHistory.changedBy,
          changedByName: user.name,
        })
        .from(customerStatusHistory)
        .leftJoin(user, eq(customerStatusHistory.changedBy, user.id))
        .where(eq(customerStatusHistory.customerId, id))
        .orderBy(desc(customerStatusHistory.changedAt))
        .limit(20),
    ]);

    // 견적 폼 자동채움 hint — 최신 현장 1건. 없으면 고객 자체 주소로 fallback.
    const top = customerSites[0];
    const latestSite = top
      ? {
          id: top.id,
          name: top.name,
          address: top.address ?? customer.address ?? null,
          areaPyeong: top.areaPyeong ?? null,
          buildingType: top.buildingType ?? null,
        }
      : customer.address
        ? { id: null, name: null, address: customer.address, areaPyeong: null, buildingType: null }
        : null;

    return ok({
      ...customer,
      sites: customerSites,
      estimates: customerEstimates,
      contracts: customerContracts,
      latestSite,
      statusHistory,
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
    // 상태 변경 감지 — 변경 전 상태 가져와서 비교, 다르면 이력 1행 INSERT.
    let previousStatus: string | null = null;
    if (typeof validation.data.status === "string") {
      const [prev] = await db
        .select({ status: customers.status })
        .from(customers)
        .where(
          and(
            eq(customers.id, id),
            workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId),
            isNull(customers.deletedAt),
          ),
        )
        .limit(1);
      previousStatus = prev?.status ?? null;
    }

    const [row] = await db
      .update(customers)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(and(eq(customers.id, id), workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId), isNull(customers.deletedAt)))
      .returning();

    if (!row) return notFound("고객을 찾을 수 없습니다");

    // 상태가 실제로 변경됐을 때만 이력 기록 (같은 값으로 PUT 한 경우 무의미한 노이즈 회피)
    if (
      typeof validation.data.status === "string" &&
      previousStatus !== validation.data.status
    ) {
      await db.insert(customerStatusHistory).values({
        customerId: id,
        workspaceId: auth.workspaceId,
        fromStatus: previousStatus,
        toStatus: validation.data.status,
        changedBy: auth.userId,
      });
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
