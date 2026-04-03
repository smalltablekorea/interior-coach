import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits, analysisResults } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

/** POST: 1 크레딧 사용하여 프로 분석 잠금해제 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("settings", "write");
  if (!auth.ok) return auth.response;

  const wid = auth.workspaceId;
  const uid = auth.userId;
  try {
    const body = await request.json();
    const { area, grade, buildingType, profitRate, overheadRate, vatEnabled, resultData } = body;

    if (!area || !grade) {
      return err("area, grade 필수");
    }

    // 크레딧 확인
    const [credit] = await db
      .select()
      .from(analysisCredits)
      .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, wid, uid))
      .limit(1);

    if (!credit || credit.totalCredits - credit.usedCredits <= 0) {
      return err("크레딧이 부족합니다. 크레딧을 충전해주세요.", 402);
    }

    // 크레딧 차감
    await db
      .update(analysisCredits)
      .set({
        usedCredits: sql`${analysisCredits.usedCredits} + 1`,
        updatedAt: new Date(),
      })
      .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, wid, uid));

    // 분석 결과 저장
    const [result] = await db
      .insert(analysisResults)
      .values({
        userId: uid,
        workspaceId: wid,
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

    return ok({
      success: true,
      analysisId: result.id,
      remainingCredits: credit.totalCredits - credit.usedCredits - 1,
    });
  } catch (error) {
    return serverError(error);
  }
}
