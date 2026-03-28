import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";

/** POST: 관리자용 크레딧 설정/추가 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("settings", "write");
  if (!auth.ok) return auth.response;

  const wid = auth.workspaceId;
  const uid = auth.userId;

  // 관리자 이메일 체크
  if (auth.session.user.email !== "smalltablekorea@gmail.com") {
    return NextResponse.json({ error: "관리자만 사용 가능" }, { status: 403 });
  }

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

  return NextResponse.json({
    success: true,
    total: totalCredits,
    used: existing?.usedCredits ?? 0,
    remaining: totalCredits - (existing?.usedCredits ?? 0),
  });
}
