import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { smsCampaigns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(smsCampaigns)
      .orderBy(desc(smsCampaigns.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "캠페인 목록 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, targetGrade, targetSource, steps, startDate, endDate } = body;

    if (!name) {
      return NextResponse.json({ error: "캠페인 이름은 필수입니다." }, { status: 400 });
    }

    const [row] = await db
      .insert(smsCampaigns)
      .values({
        userId: "system",
        name,
        type: type || "drip",
        targetGrade,
        targetSource,
        steps,
        startDate,
        endDate,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "캠페인 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const [row] = await db
      .update(smsCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsCampaigns.id, id))
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "캠페인 수정 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await db.delete(smsCampaigns).where(eq(smsCampaigns.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "캠페인 삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
