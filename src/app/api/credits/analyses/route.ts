import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

/** GET: 분석 이력 조회 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rows = await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.userId, auth.userId))
    .orderBy(desc(analysisResults.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}
