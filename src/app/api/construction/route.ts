import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constructionPhases, sites } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");

  const query = db
    .select({
      id: constructionPhases.id,
      category: constructionPhases.category,
      plannedStart: constructionPhases.plannedStart,
      plannedEnd: constructionPhases.plannedEnd,
      actualStart: constructionPhases.actualStart,
      actualEnd: constructionPhases.actualEnd,
      progress: constructionPhases.progress,
      status: constructionPhases.status,
      sortOrder: constructionPhases.sortOrder,
      memo: constructionPhases.memo,
      siteId: constructionPhases.siteId,
      siteName: sites.name,
    })
    .from(constructionPhases)
    .leftJoin(sites, eq(constructionPhases.siteId, sites.id))
    .orderBy(constructionPhases.sortOrder);

  const rows = siteId
    ? await query.where(eq(constructionPhases.siteId, siteId))
    : await query;

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siteId, category, plannedStart, plannedEnd, status, memo } = body;

  if (!siteId || !category) {
    return NextResponse.json({ error: "현장과 공종명은 필수입니다" }, { status: 400 });
  }

  // Get the next sort order for this site
  const [maxOrder] = await db
    .select({ max: sql<number>`coalesce(max(${constructionPhases.sortOrder}), 0)` })
    .from(constructionPhases)
    .where(eq(constructionPhases.siteId, siteId));

  const [row] = await db
    .insert(constructionPhases)
    .values({
      userId: "system",
      siteId,
      category,
      plannedStart: plannedStart || null,
      plannedEnd: plannedEnd || null,
      status: status || "대기",
      memo: memo || null,
      sortOrder: (maxOrder?.max ?? 0) + 1,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
