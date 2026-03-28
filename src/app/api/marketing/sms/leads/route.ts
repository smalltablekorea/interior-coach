import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsLeads } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const grade = request.nextUrl.searchParams.get("grade");
    const status = request.nextUrl.searchParams.get("status");
    const source = request.nextUrl.searchParams.get("source");

    const conditions = [eq(smsLeads.userId, auth.userId)];
    if (grade) conditions.push(eq(smsLeads.grade, grade));
    if (status) conditions.push(eq(smsLeads.status, status));
    if (source) conditions.push(eq(smsLeads.source, source));

    const rows = await db
      .select()
      .from(smsLeads)
      .where(and(...conditions))
      .orderBy(desc(smsLeads.createdAt));

    // Grade summary
    const gradeStats = await db
      .select({
        grade: smsLeads.grade,
        count: sql<number>`count(*)::int`,
      })
      .from(smsLeads)
      .where(eq(smsLeads.userId, auth.userId))
      .groupBy(smsLeads.grade);

    // Status summary
    const statusStats = await db
      .select({
        status: smsLeads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(smsLeads)
      .where(eq(smsLeads.userId, auth.userId))
      .groupBy(smsLeads.status);

    return ok({
      leads: rows,
      stats: {
        total: rows.length,
        byGrade: Object.fromEntries(gradeStats.map((g) => [g.grade, g.count])),
        byStatus: Object.fromEntries(statusStats.map((s) => [s.status, s.count])),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const {
      name, phone, source, sourceUrl, sourceKeyword,
      grade, score, scoringFactors, area, buildingType,
      areaPyeong, budget, timeline, memo,
    } = body;

    if (!name || !phone) {
      return err("이름과 전화번호는 필수입니다.");
    }

    const [row] = await db
      .insert(smsLeads)
      .values({
        userId: auth.userId,
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

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return err("id required");
    }

    const [row] = await db
      .update(smsLeads)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(smsLeads.id, id), eq(smsLeads.userId, auth.userId)))
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const { id } = await request.json();
    if (!id) {
      return err("id required");
    }

    await db.delete(smsLeads).where(and(eq(smsLeads.id, id), eq(smsLeads.userId, auth.userId)));
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
