import { db } from "@/lib/db";
import { sites, constructionPhases, materialOrders, customers } from "@/lib/db/schema";
import { eq, sql, or, and, gte, lte, isNotNull, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: Request) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const target = month || new Date().toISOString().slice(0, 7);
    const startOfMonth = `${target}-01`;
    const [y, m] = target.split("-").map(Number);
    const endOfMonth = new Date(y, m, 0).toISOString().slice(0, 10);

    const uid = auth.userId;
    const wid = auth.workspaceId;

    const siteRows = await db
      .select({
        id: sites.id,
        name: sites.name,
        address: sites.address,
        status: sites.status,
        startDate: sites.startDate,
        endDate: sites.endDate,
        customerName: customers.name,
      })
      .from(sites)
      .leftJoin(customers, eq(sites.customerId, customers.id))
      .where(
        and(
          workspaceFilter(sites.workspaceId, sites.userId, wid, uid),
          isNull(sites.deletedAt),
          or(isNotNull(sites.startDate), isNotNull(sites.endDate)),
          or(
            and(gte(sites.startDate, startOfMonth), lte(sites.startDate, endOfMonth)),
            and(gte(sites.endDate, startOfMonth), lte(sites.endDate, endOfMonth)),
            and(lte(sites.startDate, startOfMonth), gte(sites.endDate, endOfMonth)),
          )
        )
      );

    const phaseRows = await db
      .select({
        id: constructionPhases.id,
        category: constructionPhases.category,
        plannedStart: constructionPhases.plannedStart,
        plannedEnd: constructionPhases.plannedEnd,
        actualStart: constructionPhases.actualStart,
        actualEnd: constructionPhases.actualEnd,
        progress: constructionPhases.progress,
        status: constructionPhases.status,
        siteId: constructionPhases.siteId,
        siteName: sites.name,
        memo: constructionPhases.memo,
      })
      .from(constructionPhases)
      .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
      .where(
        and(
          workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid),
          or(
            and(gte(constructionPhases.plannedStart, startOfMonth), lte(constructionPhases.plannedStart, endOfMonth)),
            and(gte(constructionPhases.plannedEnd, startOfMonth), lte(constructionPhases.plannedEnd, endOfMonth)),
            and(lte(constructionPhases.plannedStart, startOfMonth), gte(constructionPhases.plannedEnd, endOfMonth)),
            and(gte(constructionPhases.actualStart, startOfMonth), lte(constructionPhases.actualStart, endOfMonth)),
            and(gte(constructionPhases.actualEnd, startOfMonth), lte(constructionPhases.actualEnd, endOfMonth)),
            and(lte(constructionPhases.actualStart, startOfMonth), gte(constructionPhases.actualEnd, endOfMonth)),
          )
        )
      );

    const orderRows = await db
      .select({
        id: materialOrders.id,
        materialName: materialOrders.materialName,
        quantity: materialOrders.quantity,
        orderedDate: materialOrders.orderedDate,
        deliveryDate: materialOrders.deliveryDate,
        status: materialOrders.status,
        siteId: materialOrders.siteId,
        siteName: sites.name,
      })
      .from(materialOrders)
      .innerJoin(sites, eq(materialOrders.siteId, sites.id))
      .where(
        and(
          workspaceFilter(materialOrders.workspaceId, materialOrders.userId, wid, uid),
          or(
            and(gte(materialOrders.orderedDate, startOfMonth), lte(materialOrders.orderedDate, endOfMonth)),
            and(gte(materialOrders.deliveryDate, startOfMonth), lte(materialOrders.deliveryDate, endOfMonth)),
          )
        )
      );

    // 현장 선택 드롭다운용: 모든 활성 현장 (월 필터 없이)
    const allSiteRows = await db
      .select({ id: sites.id, name: sites.name, status: sites.status })
      .from(sites)
      .where(and(workspaceFilter(sites.workspaceId, sites.userId, wid, uid), isNull(sites.deletedAt)));

    return ok({ sites: siteRows, allSites: allSiteRows, phases: phaseRows, orders: orderRows, month: target });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { siteId, category, plannedStart, plannedEnd, status, progress, memo } = body;
    if (!siteId || !category) return err("siteId, category 필수");

    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${constructionPhases.sortOrder}), 0)` })
      .from(constructionPhases)
      .where(eq(constructionPhases.siteId, siteId));

    const [row] = await db
      .insert(constructionPhases)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        siteId,
        category,
        plannedStart: plannedStart || null,
        plannedEnd: plannedEnd || null,
        status: status || "예정",
        progress: progress ?? 0,
        sortOrder: (maxOrder[0]?.max ?? 0) + 1,
        memo: memo || null,
      })
      .returning();
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, category, plannedStart, plannedEnd, status, progress, memo } = body;
    if (!id) return err("id 필수");

    const [row] = await db
      .update(constructionPhases)
      .set({
        category,
        plannedStart: plannedStart || null,
        plannedEnd: plannedEnd || null,
        status: status || "예정",
        progress: progress ?? 0,
        memo: memo || null,
      })
      .where(and(eq(constructionPhases.id, id), eq(constructionPhases.userId, auth.userId), eq(constructionPhases.workspaceId, auth.workspaceId)))
      .returning();

    if (!row) return err("공정을 찾을 수 없습니다", 404);
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return err("id 필수");

    await db
      .delete(constructionPhases)
      .where(and(eq(constructionPhases.id, id), eq(constructionPhases.userId, auth.userId), eq(constructionPhases.workspaceId, auth.workspaceId)));

    return ok({ message: "삭제되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, status, progress } = body;
    if (!id) return err("id 필수");

    const updates: { status?: string; progress?: number } = {};
    if (status !== undefined) updates.status = status;
    if (progress !== undefined) updates.progress = progress;

    const [row] = await db
      .update(constructionPhases)
      .set(updates)
      .where(and(eq(constructionPhases.id, id), eq(constructionPhases.userId, auth.userId), eq(constructionPhases.workspaceId, auth.workspaceId)))
      .returning();

    if (!row) return err("공정을 찾을 수 없습니다", 404);
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
