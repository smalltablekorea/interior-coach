import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schedulePlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, notFound, serverError } from "@/lib/api/response";
import { generateShareToken } from "@/lib/schedule-planner/service";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/schedule-planner/[id]/share — 공유 활성화/비활성화 토글 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [current] = await db
      .select({
        id: schedulePlans.id,
        isPublic: schedulePlans.isPublic,
        shareToken: schedulePlans.shareToken,
      })
      .from(schedulePlans)
      .where(and(eq(schedulePlans.id, id), eq(schedulePlans.userId, auth.userId)))
      .limit(1);

    if (!current) return notFound("공정표를 찾을 수 없습니다.");

    const newIsPublic = !current.isPublic;
    const shareToken = newIsPublic
      ? current.shareToken || generateShareToken()
      : current.shareToken; // keep token even when disabling

    const [updated] = await db
      .update(schedulePlans)
      .set({
        isPublic: newIsPublic,
        shareToken,
        updatedAt: new Date(),
      })
      .where(and(eq(schedulePlans.id, id), eq(schedulePlans.userId, auth.userId)))
      .returning({
        id: schedulePlans.id,
        isPublic: schedulePlans.isPublic,
        shareToken: schedulePlans.shareToken,
      });

    return ok({
      ...updated,
      shareUrl: newIsPublic ? `/schedule-planner/${updated.id}?token=${updated.shareToken}` : null,
    });
  } catch (error) {
    return serverError(error);
  }
}
