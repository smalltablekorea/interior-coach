import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits, analysisResults } from "@/lib/db/schema";
import { and, sql } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

/** POST: 분석권 1회 사용하여 프로 분석 잠금해제 */
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

    // 조건부 UPDATE + RETURNING 으로 한도 검사와 차감을 한 트랜잭션 안에서 처리.
    // 동시 요청이 들어와도 used < total 인 행만 +1 되므로 한도 초과 사용 차단.
    const updated = await db
      .update(analysisCredits)
      .set({
        usedCredits: sql`${analysisCredits.usedCredits} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, wid, uid),
          sql`${analysisCredits.usedCredits} < ${analysisCredits.totalCredits}`,
        ),
      )
      .returning({
        totalCredits: analysisCredits.totalCredits,
        usedCredits: analysisCredits.usedCredits,
      });

    if (updated.length === 0) {
      return err("분석권이 부족합니다. 분석권을 구매해주세요.", 402);
    }

    const { totalCredits, usedCredits } = updated[0];

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
      remainingCredits: totalCredits - usedCredits,
    });
  } catch (error) {
    return serverError(error);
  }
}
