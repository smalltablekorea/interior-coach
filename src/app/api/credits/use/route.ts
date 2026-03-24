import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits, analysisResults } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

/** POST: 1 크레딧 사용하여 프로 분석 잠금해제 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { area, grade, buildingType, profitRate, overheadRate, vatEnabled, resultData } = body;

  if (!area || !grade) {
    return NextResponse.json({ error: "area, grade 필수" }, { status: 400 });
  }

  // 크레딧 확인
  const [credit] = await db
    .select()
    .from(analysisCredits)
    .where(eq(analysisCredits.userId, auth.userId))
    .limit(1);

  if (!credit || credit.totalCredits - credit.usedCredits <= 0) {
    return NextResponse.json(
      { error: "크레딧이 부족합니다. 크레딧을 충전해주세요." },
      { status: 402 }
    );
  }

  // 크레딧 차감
  await db
    .update(analysisCredits)
    .set({
      usedCredits: sql`${analysisCredits.usedCredits} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(analysisCredits.userId, auth.userId));

  // 분석 결과 저장
  const [result] = await db
    .insert(analysisResults)
    .values({
      userId: auth.userId,
      area,
      grade,
      buildingType: buildingType || "apt",
      profitRate: profitRate ?? 20,
      overheadRate: overheadRate ?? 6,
      vatEnabled: vatEnabled ?? false,
      resultData: resultData || null,
      creditUsed: true,
    })
    .returning();

  return NextResponse.json({
    success: true,
    analysisId: result.id,
    remainingCredits: credit.totalCredits - credit.usedCredits - 1,
  });
}
