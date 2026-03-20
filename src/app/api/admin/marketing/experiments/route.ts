import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktExperiments, mktExperimentVariants } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// 실험 목록
export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  try {
    const experiments = await db
      .select()
      .from(mktExperiments)
      .orderBy(desc(mktExperiments.createdAt));

    const result = await Promise.all(
      experiments.map(async (exp) => {
        const variants = await db
          .select()
          .from(mktExperimentVariants)
          .where(eq(mktExperimentVariants.experimentId, exp.id));

        return { ...exp, variants };
      })
    );

    return NextResponse.json({ experiments: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "실험 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 실험 생성
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const { name, description, targetElement, primaryMetric, startDate, endDate, trafficPercent, variants } = body;

  if (!name) {
    return NextResponse.json({ error: "name 필수" }, { status: 400 });
  }

  try {
    const [experiment] = await db
      .insert(mktExperiments)
      .values({
        name,
        description: description || null,
        targetElement: targetElement || null,
        status: "draft",
        primaryMetric: primaryMetric || null,
        startDate: startDate || null,
        endDate: endDate || null,
        trafficPercent: trafficPercent || 100,
      })
      .returning();

    // 변형 생성
    if (variants && Array.isArray(variants) && variants.length > 0) {
      await db.insert(mktExperimentVariants).values(
        variants.map((v: { name: string; description?: string; content?: unknown; trafficWeight?: number; isControl?: boolean }) => ({
          experimentId: experiment.id,
          name: v.name,
          description: v.description || null,
          content: v.content || null,
          trafficWeight: v.trafficWeight || Math.floor(100 / variants.length),
          isControl: v.isControl || false,
        }))
      );
    }

    return NextResponse.json(experiment, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "실험 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 실험 수정
export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  try {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    const allowedFields = [
      "name", "description", "targetElement", "status",
      "primaryMetric", "startDate", "endDate", "trafficPercent", "winnerVariantId",
    ];
    for (const key of allowedFields) {
      if (fields[key] !== undefined) updateFields[key] = fields[key];
    }

    await db
      .update(mktExperiments)
      .set(updateFields)
      .where(eq(mktExperiments.id, id));

    return NextResponse.json({ message: "수정되었습니다" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "실험 수정 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
