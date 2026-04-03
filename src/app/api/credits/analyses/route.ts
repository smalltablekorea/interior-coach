import { db } from "@/lib/db";
import { analysisResults } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

/** GET: 분석 이력 조회 */
export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const rows = await db
      .select()
      .from(analysisResults)
      .where(workspaceFilter(analysisResults.workspaceId, analysisResults.userId, auth.workspaceId, auth.userId))
      .orderBy(desc(analysisResults.createdAt))
      .limit(50);

    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}
