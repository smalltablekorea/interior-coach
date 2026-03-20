import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { smsLeads } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const grade = request.nextUrl.searchParams.get("grade");
    const status = request.nextUrl.searchParams.get("status");
    const source = request.nextUrl.searchParams.get("source");

    const conditions = [];
    if (grade) conditions.push(eq(smsLeads.grade, grade));
    if (status) conditions.push(eq(smsLeads.status, status));
    if (source) conditions.push(eq(smsLeads.source, source));

    const rows = await db
      .select()
      .from(smsLeads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(smsLeads.createdAt));

    // Grade summary
    const gradeStats = await db
      .select({
        grade: smsLeads.grade,
        count: sql<number>`count(*)::int`,
      })
      .from(smsLeads)
      .groupBy(smsLeads.grade);

    // Status summary
    const statusStats = await db
      .select({
        status: smsLeads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(smsLeads)
      .groupBy(smsLeads.status);

    return NextResponse.json({
      leads: rows,
      stats: {
        total: rows.length,
        byGrade: Object.fromEntries(gradeStats.map((g) => [g.grade, g.count])),
        byStatus: Object.fromEntries(statusStats.map((s) => [s.status, s.count])),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "리드 목록 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, phone, source, sourceUrl, sourceKeyword,
      grade, score, scoringFactors, area, buildingType,
      areaPyeong, budget, timeline, memo,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "이름과 전화번호는 필수입니다." }, { status: 400 });
    }

    const [row] = await db
      .insert(smsLeads)
      .values({
        userId: "system",
        name,
        phone,
        source: source || "manual",
        sourceUrl,
        sourceKeyword,
        grade: grade || "C",
        score: score || 0,
        scoringFactors,
        area,
        buildingType,
        areaPyeong,
        budget,
        timeline,
        memo,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "리드 등록 실패";
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
      .update(smsLeads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsLeads.id, id))
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "리드 수정 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await db.delete(smsLeads).where(eq(smsLeads.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "리드 삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
