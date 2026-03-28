import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analysisResults } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";

/** GET: 분석 이력 조회 */
export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  const rows = await db
    .select()
    .from(analysisResults)
    .where(workspaceFilter(analysisResults.workspaceId, analysisResults.userId, auth.workspaceId, auth.userId))
    .orderBy(desc(analysisResults.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}
