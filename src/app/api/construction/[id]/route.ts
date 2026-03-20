import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constructionPhases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Build update object from provided fields
  const update: Record<string, unknown> = {};
  if (body.category !== undefined) update.category = body.category;
  if (body.plannedStart !== undefined) update.plannedStart = body.plannedStart || null;
  if (body.plannedEnd !== undefined) update.plannedEnd = body.plannedEnd || null;
  if (body.actualStart !== undefined) update.actualStart = body.actualStart || null;
  if (body.actualEnd !== undefined) update.actualEnd = body.actualEnd || null;
  if (body.progress !== undefined) update.progress = body.progress;
  if (body.status !== undefined) update.status = body.status;
  if (body.memo !== undefined) update.memo = body.memo || null;
  if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "수정할 항목이 없습니다" }, { status: 400 });
  }

  const [row] = await db
    .update(constructionPhases)
    .set(update)
    .where(eq(constructionPhases.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "공정을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(constructionPhases).where(eq(constructionPhases.id, id));
  return NextResponse.json({ success: true });
}
