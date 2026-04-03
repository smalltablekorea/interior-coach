import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { materials, materialOrders, sites, user } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";
import { validateBody, materialSchema } from "@/lib/api/validate";
import { z } from "zod";

const orderSchema = z.object({
  siteId: z.string().uuid().nullable().optional(),
  materialId: z.string().uuid().nullable().optional(),
  materialName: z.string().min(1, "자재명은 필수입니다"),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0).optional().default(0),
  orderedDate: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const type = request.nextUrl.searchParams.get("type");

  try {
    if (type === "orders") {
      const pagination = parsePagination(request);

      const ordersWsFilter = workspaceFilter(materialOrders.workspaceId, materialOrders.userId, auth.workspaceId, auth.userId);

      const [{ count: total }] = await db
        .select({ count: countSql() })
        .from(materialOrders)
        .where(ordersWsFilter);

      const rows = await db
        .select({
          id: materialOrders.id,
          materialName: materialOrders.materialName,
          quantity: materialOrders.quantity,
          unitPrice: materialOrders.unitPrice,
          totalAmount: materialOrders.totalAmount,
          orderedDate: materialOrders.orderedDate,
          deliveryDate: materialOrders.deliveryDate,
          status: materialOrders.status,
          memo: materialOrders.memo,
          siteId: materialOrders.siteId,
          siteName: sites.name,
          category: materials.category,
          userId: materialOrders.userId,
          userName: user.name,
        })
        .from(materialOrders)
        .leftJoin(sites, eq(materialOrders.siteId, sites.id))
        .leftJoin(materials, eq(materialOrders.materialId, materials.id))
        .leftJoin(user, eq(materialOrders.userId, user.id))
        .where(ordersWsFilter)
        .orderBy(desc(materialOrders.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return ok(rows, buildPaginationMeta(total, pagination));
    }

    // 표준 자재 목록 (공용 데이터)
    const rows = await db
      .select({
        id: materials.id,
        name: materials.name,
        category: materials.category,
        brand: materials.brand,
        grade: materials.grade,
        unit: materials.unit,
        unitPrice: materials.unitPrice,
      })
      .from(materials)
      .where(and(eq(materials.isStandard, true), isNull(materials.deletedAt)))
      .orderBy(materials.category, materials.name);

    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const type = request.nextUrl.searchParams.get("type");

  try {
    if (type === "orders") {
      const validation = await validateBody(request, orderSchema);
      if (!validation.ok) return validation.response;

      const [row] = await db
        .insert(materialOrders)
        .values({
          userId: auth.userId,
          workspaceId: auth.workspaceId,
          siteId: validation.data.siteId ?? null,
          materialId: validation.data.materialId ?? null,
          materialName: validation.data.materialName,
          quantity: validation.data.quantity,
          unitPrice: validation.data.unitPrice,
          totalAmount: validation.data.totalAmount,
          orderedDate: validation.data.orderedDate ?? null,
          deliveryDate: validation.data.deliveryDate ?? null,
          memo: validation.data.memo ?? null,
        })
        .returning();

      return ok(row);
    }

    // 커스텀 자재 등록
    const validation = await validateBody(request, materialSchema);
    if (!validation.ok) return validation.response;

    const [row] = await db
      .insert(materials)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        name: validation.data.name,
        category: validation.data.category ?? null,
        brand: validation.data.brand ?? null,
        grade: validation.data.grade ?? null,
        unit: validation.data.unit ?? null,
        unitPrice: validation.data.unitPrice ?? null,
        supplier: validation.data.supplier ?? null,
        memo: validation.data.memo ?? null,
        isStandard: false,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const type = request.nextUrl.searchParams.get("type");

  if (type === "orders") {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) return err("id가 필요합니다");

      const [row] = await db
        .update(materialOrders)
        .set({
          materialName: updateData.materialName,
          quantity: updateData.quantity,
          unitPrice: updateData.unitPrice || 0,
          totalAmount: updateData.totalAmount || 0,
          orderedDate: updateData.orderedDate || null,
          deliveryDate: updateData.deliveryDate || null,
          status: updateData.status || "발주",
          memo: updateData.memo || null,
        })
        .where(and(eq(materialOrders.id, id), eq(materialOrders.userId, auth.userId), eq(materialOrders.workspaceId, auth.workspaceId)))
        .returning();

      if (!row) return err("주문을 찾을 수 없습니다", 404);
      return ok(row);
    } catch (error) {
      return serverError(error);
    }
  }

  return err("지원하지 않는 요청입니다");
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const type = request.nextUrl.searchParams.get("type");
    const id = request.nextUrl.searchParams.get("id");

    if (type === "orders" && id) {
      const [row] = await db
        .delete(materialOrders)
        .where(and(eq(materialOrders.id, id), eq(materialOrders.userId, auth.userId), eq(materialOrders.workspaceId, auth.workspaceId)))
        .returning({ id: materialOrders.id });

      if (!row) return err("주문을 찾을 수 없습니다", 404);
      return ok({ id: row.id });
    }

    return err("지원하지 않는 요청입니다");
  } catch (error) {
    return serverError(error);
  }
}
