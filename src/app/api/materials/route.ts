import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materials, materialOrders, sites, user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  if (type === "orders") {
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
      .orderBy(sql`${materialOrders.createdAt} DESC`);

    return NextResponse.json(rows);
  }

  // Return all standard materials (868 items)
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
    .where(eq(materials.isStandard, true))
    .orderBy(materials.category, materials.name);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  if (type === "orders") {
    const body = await request.json();
    const { siteId, materialName, quantity, unitPrice, totalAmount, orderedDate, deliveryDate, memo } = body;

    const [row] = await db
      .insert(materialOrders)
      .values({
        userId: "system", // TODO: get from session
        siteId: siteId || null,
        materialName,
        quantity,
        unitPrice: unitPrice || 0,
        totalAmount: totalAmount || 0,
        orderedDate: orderedDate || null,
        deliveryDate: deliveryDate || null,
        memo: memo || null,
      })
      .returning();

    return NextResponse.json(row);
  }

  return NextResponse.json({ message: "Not supported" }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  if (type === "orders") {
    const body = await request.json();
    const { id, materialName, quantity, unitPrice, totalAmount, orderedDate, deliveryDate, status, memo } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const [row] = await db
      .update(materialOrders)
      .set({
        materialName,
        quantity,
        unitPrice: unitPrice || 0,
        totalAmount: totalAmount || 0,
        orderedDate: orderedDate || null,
        deliveryDate: deliveryDate || null,
        status: status || "발주",
        memo: memo || null,
      })
      .where(eq(materialOrders.id, id))
      .returning();

    return NextResponse.json(row);
  }

  return NextResponse.json({ message: "Not supported" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const id = request.nextUrl.searchParams.get("id");

  if (type === "orders" && id) {
    await db.delete(materialOrders).where(eq(materialOrders.id, id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ message: "Not supported" }, { status: 400 });
}
