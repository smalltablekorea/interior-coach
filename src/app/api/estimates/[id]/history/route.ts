import { db } from "@/lib/db";
import { estimateHistory, estimates, user } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, notFound, serverError } from "@/lib/api/response";

// 변경 이력 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // 견적 소유 확인
  const [est] = await db
    .select({ id: estimates.id })
    .from(estimates)
    .where(
      and(
        eq(estimates.id, id),
        workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId),
        isNull(estimates.deletedAt)
      )
    );

  if (!est) return notFound("견적을 찾을 수 없습니다");

  try {
    const history = await db
      .select({
        id: estimateHistory.id,
        action: estimateHistory.action,
        changes: estimateHistory.changes,
        createdAt: estimateHistory.createdAt,
        userName: user.name,
      })
      .from(estimateHistory)
      .leftJoin(user, eq(estimateHistory.userId, user.id))
      .where(eq(estimateHistory.estimateId, id))
      .orderBy(desc(estimateHistory.createdAt))
      .limit(50);

    return ok({ history });
  } catch (error) {
    return serverError(error);
  }
}
