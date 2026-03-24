import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

/** POST: 관리자용 크레딧 설정/추가 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  // 관리자 이메일 체크
  if (auth.session.user.email !== "smalltablekorea@gmail.com") {
    return NextResponse.json({ error: "관리자만 사용 가능" }, { status: 403 });
  }

  const body = await request.json();
  const totalCredits = Number(body.totalCredits) || 14;

  const [existing] = await db
    .select()
    .from(analysisCredits)
    .where(eq(analysisCredits.userId, auth.userId))
    .limit(1);

  if (existing) {
    await db
      .update(analysisCredits)
      .set({ totalCredits, updatedAt: new Date() })
      .where(eq(analysisCredits.userId, auth.userId));
  } else {
    await db.insert(analysisCredits).values({
      userId: auth.userId,
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
