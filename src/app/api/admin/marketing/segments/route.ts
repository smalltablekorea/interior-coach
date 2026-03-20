import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktSegments } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// 세그먼트 목록 조회
export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const segments = await db
      .select()
      .from(mktSegments)
      .where(eq(mktSegments.isActive, true))
      .orderBy(desc(mktSegments.isSystem), desc(mktSegments.memberCount));

    return NextResponse.json({ segments });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "세그먼트 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 세그먼트 생성
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const { name, description, rules } = body;

  if (!name || !rules) {
    return NextResponse.json({ error: "name, rules 필수" }, { status: 400 });
  }

  try {
    const [segment] = await db
      .insert(mktSegments)
      .values({
        name,
        description: description || null,
        rules,
        isSystem: false,
      })
      .returning();

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "세그먼트 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 세그먼트 수정
export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const { id, name, description, rules, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  try {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (rules !== undefined) updateFields.rules = rules;
    if (isActive !== undefined) updateFields.isActive = isActive;

    await db
      .update(mktSegments)
      .set(updateFields)
      .where(eq(mktSegments.id, id));

    return NextResponse.json({ message: "수정되었습니다" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "세그먼트 수정 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
