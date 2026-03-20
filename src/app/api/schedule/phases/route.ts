import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constructionPhases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siteId, category, plannedStart, plannedEnd, status, progress, memo } = body;

    if (!siteId || !category) {
      return NextResponse.json({ error: "siteId와 category는 필수입니다" }, { status: 400 });
    }

    const [row] = await db
      .insert(constructionPhases)
      .values({
        userId: "system",
        siteId,
        category,
        plannedStart: plannedStart || null,
        plannedEnd: plannedEnd || null,
        status: status || "대기",
        progress: progress ?? (status === "완료" ? 100 : 0),
        memo: memo || null,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.plannedStart !== undefined) data.plannedStart = updates.plannedStart || null;
    if (updates.plannedEnd !== undefined) data.plannedEnd = updates.plannedEnd || null;
    if (updates.actualStart !== undefined) data.actualStart = updates.actualStart || null;
    if (updates.actualEnd !== undefined) data.actualEnd = updates.actualEnd || null;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.progress !== undefined) data.progress = updates.progress;
    if (updates.memo !== undefined) data.memo = updates.memo || null;

    const [row] = await db
      .update(constructionPhases)
      .set(data)
      .where(eq(constructionPhases.id, id))
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "수정 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

    await db.delete(constructionPhases).where(eq(constructionPhases.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "삭제 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
