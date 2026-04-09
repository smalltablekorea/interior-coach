import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { constructionPhases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { refreshPinnedSummary } from "@/lib/site-chat/pinned-summary";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const update: Record<string, unknown> = {};
    if (body.category !== undefined) update.category = body.category;
    if (body.plannedStart !== undefined) update.plannedStart = body.plannedStart || null;
    if (body.plannedEnd !== undefined) update.plannedEnd = body.plannedEnd || null;
    if (body.actualStart !== undefined) update.actualStart = body.actualStart || null;
    if (body.actualEnd !== undefined) update.actualEnd = body.actualEnd || null;
    if (body.progress !== undefined) update.progress = body.progress;
    if (body.status !== undefined) update.status = body.status;
    if (body.memo !== undefined) update.memo = body.memo || null;
    if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;

    if (Object.keys(update).length === 0) return err("수정할 항목이 없습니다");

    const [row] = await db
      .update(constructionPhases)
      .set(update)
      .where(and(eq(constructionPhases.id, id), workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, auth.workspaceId, auth.userId)))
      .returning();

    if (!row) return err("공정을 찾을 수 없습니다", 404);

    // pinned_summary 자동 갱신
    refreshPinnedSummary(row.siteId).catch(() => {});

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    await db
      .delete(constructionPhases)
      .where(and(eq(constructionPhases.id, id), workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, auth.workspaceId, auth.userId)));

    return ok({ message: "삭제되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}
