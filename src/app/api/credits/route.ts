import { db } from "@/lib/db";
import { analysisCredits } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

/** GET: 분석권 잔여 횟수 조회 */
export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const [row] = await db
      .select()
      .from(analysisCredits)
      .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, auth.workspaceId, auth.userId))
      .limit(1);

    if (!row) {
      return ok({ total: 0, used: 0, remaining: 0 });
    }

    return ok({
      total: row.totalCredits,
      used: row.usedCredits,
      remaining: row.totalCredits - row.usedCredits,
    });
  } catch (error) {
    return serverError(error);
  }
}
