import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisCredits } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";

/** GET: 크레딧 잔여량 조회 */
export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  const [row] = await db
    .select()
    .from(analysisCredits)
    .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, auth.workspaceId, auth.userId))
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
