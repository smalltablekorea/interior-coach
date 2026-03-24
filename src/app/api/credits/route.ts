import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

/** GET: 크레딧 잔여량 조회 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const [row] = await db
    .select()
    .from(analysisCredits)
    .where(eq(analysisCredits.userId, auth.userId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ total: 0, used: 0, remaining: 0 });
  }

  return NextResponse.json({
    total: row.totalCredits,
    used: row.usedCredits,
    remaining: row.totalCredits - row.usedCredits,
  });
}
