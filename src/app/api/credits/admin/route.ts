import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, forbidden, serverError } from "@/lib/api/response";
import { isUnlimitedAccount } from "@/lib/subscription";

/** POST: 관리자용 분석권 설정/추가 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("settings", "write");
  if (!auth.ok) return auth.response;

  const wid = auth.workspaceId;
  const uid = auth.userId;

  // 관리자 이메일 체크
  if (!isUnlimitedAccount(auth.session.user.email)) {
    return forbidden("관리자만 사용 가능");
  }

  try {
    const body = await request.json();
    const totalCredits = Number(body.totalCredits) || 14;

    const [existing] = await db
      .select()
      .from(analysisCredits)
      .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, wid, uid))
      .limit(1);

    if (existing) {
      await db
        .update(analysisCredits)
        .set({ totalCredits, updatedAt: new Date() })
        .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, wid, uid));
    } else {
      await db.insert(analysisCredits).values({
        userId: uid,
        workspaceId: wid,
        totalCredits,
        usedCredits: 0,
      });
    }

    return ok({
      success: true,
      total: totalCredits,
      used: existing?.usedCredits ?? 0,
      remaining: totalCredits - (existing?.usedCredits ?? 0),
    });
  } catch (error) {
    return serverError(error);
  }
}
