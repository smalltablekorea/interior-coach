import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, constructionPhases, materialOrders, customers } from "@/lib/db/schema";
import { eq, sql, or, and, gte, lte, isNotNull } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM

  // Default to current month
  const target = month || new Date().toISOString().slice(0, 7);
  const startOfMonth = `${target}-01`;
  const [y, m] = target.split("-").map(Number);
  const endOfMonth = new Date(y, m, 0).toISOString().slice(0, 10);

  // 1. Sites with dates overlapping the month
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
        or(isNotNull(sites.startDate), isNotNull(sites.endDate)),
        or(
          and(gte(sites.startDate, startOfMonth), lte(sites.startDate, endOfMonth)),
          and(gte(sites.endDate, startOfMonth), lte(sites.endDate, endOfMonth)),
          and(lte(sites.startDate, startOfMonth), gte(sites.endDate, endOfMonth)),
        )
      )
    );

  // 2. Construction phases with dates in the month
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
    .leftJoin(sites, eq(constructionPhases.siteId, sites.id))
    .where(
      or(
        // By planned dates
        and(gte(constructionPhases.plannedStart, startOfMonth), lte(constructionPhases.plannedStart, endOfMonth)),
        and(gte(constructionPhases.plannedEnd, startOfMonth), lte(constructionPhases.plannedEnd, endOfMonth)),
        and(lte(constructionPhases.plannedStart, startOfMonth), gte(constructionPhases.plannedEnd, endOfMonth)),
        // By actual dates
        and(gte(constructionPhases.actualStart, startOfMonth), lte(constructionPhases.actualStart, endOfMonth)),
        and(gte(constructionPhases.actualEnd, startOfMonth), lte(constructionPhases.actualEnd, endOfMonth)),
        and(lte(constructionPhases.actualStart, startOfMonth), gte(constructionPhases.actualEnd, endOfMonth)),
      )
    );

  // 3. Material orders with dates in the month
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
    .leftJoin(sites, eq(materialOrders.siteId, sites.id))
    .where(
      or(
        and(gte(materialOrders.orderedDate, startOfMonth), lte(materialOrders.orderedDate, endOfMonth)),
        and(gte(materialOrders.deliveryDate, startOfMonth), lte(materialOrders.deliveryDate, endOfMonth)),
      )
    );

  return NextResponse.json({ sites: siteRows, phases: phaseRows, orders: orderRows, month: target });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { siteId, category, plannedStart, plannedEnd, status, progress, memo } = body;
  if (!siteId || !category) {
    return NextResponse.json({ error: "siteId, category 필수" }, { status: 400 });
  }
  const maxOrder = await db
    .select({ max: sql<number>`COALESCE(MAX(${constructionPhases.sortOrder}), 0)` })
    .from(constructionPhases)
    .where(eq(constructionPhases.siteId, siteId));
  const [row] = await db
    .insert(constructionPhases)
    .values({
      userId: "demo",
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
  return NextResponse.json(row);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, category, plannedStart, plannedEnd, status, progress, memo } = body;
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });
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
    .where(eq(constructionPhases.id, id))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });
  await db.delete(constructionPhases).where(eq(constructionPhases.id, id));
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, progress } = body;
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });
  const updates: { status?: string; progress?: number } = {};
  if (status !== undefined) updates.status = status;
  if (progress !== undefined) updates.progress = progress;
  const [row] = await db
    .update(constructionPhases)
    .set(updates)
    .where(eq(constructionPhases.id, id))
    .returning();
  return NextResponse.json(row);
}
