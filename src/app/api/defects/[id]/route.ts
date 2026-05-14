import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { defects, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { logActivity } from "@/lib/activity-log";
import type { UpdateDefectRequest, DefectSeverity } from "@/types/defect";

const VALID_SEVERITIES: DefectSeverity[] = ["minor", "major", "critical"];
const VALID_STATUSES = ["reported", "in_progress", "resolved", "closed"];

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/defects/[id] — 하자 상세 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [row] = await db
      .select({
        id: defects.id,
        siteId: defects.siteId,
        siteName: sites.name,
        tradeId: defects.tradeId,
        tradeName: defects.tradeName,
        title: defects.title,
        description: defects.description,
        photoUrls: defects.photoUrls,
        severity: defects.severity,
        status: defects.status,
        reportedBy: defects.reportedBy,
        assignedTo: defects.assignedTo,
        assignedToName: defects.assignedToName,
        resolutionNote: defects.resolutionNote,
        resolutionPhotoUrls: defects.resolutionPhotoUrls,
        reportedAt: defects.reportedAt,
        resolvedAt: defects.resolvedAt,
        closedAt: defects.closedAt,
        createdAt: defects.createdAt,
        updatedAt: defects.updatedAt,
      })
      .from(defects)
      .leftJoin(sites, eq(defects.siteId, sites.id))
      .where(
        and(
          eq(defects.id, id),
          workspaceFilter(defects.workspaceId, defects.userId, auth.workspaceId, auth.userId),
        ),
      )
      .limit(1);

    if (!row) return notFound("하자를 찾을 수 없습니다.");
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

/** PATCH /api/defects/[id] — 하자 수정 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body: UpdateDefectRequest = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.photoUrls !== undefined) updates.photoUrls = body.photoUrls;
    if (body.severity !== undefined) {
      if (!VALID_SEVERITIES.includes(body.severity)) return err("유효하지 않은 심각도입니다.");
      updates.severity = body.severity;
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) return err("유효하지 않은 상태입니다.");
      updates.status = body.status;
      if (body.status === "resolved") updates.resolvedAt = new Date();
      if (body.status === "closed") updates.closedAt = new Date();
    }
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
    if (body.assignedToName !== undefined) updates.assignedToName = body.assignedToName;
    if (body.resolutionNote !== undefined) updates.resolutionNote = body.resolutionNote?.trim() || null;
    if (body.resolutionPhotoUrls !== undefined) updates.resolutionPhotoUrls = body.resolutionPhotoUrls;

    const [updated] = await db
      .update(defects)
      .set(updates)
      .where(
        and(
          eq(defects.id, id),
          workspaceFilter(defects.workspaceId, defects.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning();

    if (!updated) return notFound("하자를 찾을 수 없습니다.");

    const actionMap: Record<string, string> = {
      in_progress: "defect_assigned",
      resolved: "defect_resolved",
      closed: "defect_closed",
    };
    if (body.status && actionMap[body.status]) {
      logActivity({
        siteId: updated.siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        action: actionMap[body.status],
        targetType: "defect",
        targetId: updated.id,
        metadata: { title: updated.title, status: body.status },
      });
    }

    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE /api/defects/[id] — 하자 삭제 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "delete");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [deleted] = await db
      .delete(defects)
      .where(
        and(
          eq(defects.id, id),
          workspaceFilter(defects.workspaceId, defects.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning({ id: defects.id, siteId: defects.siteId, title: defects.title });

    if (!deleted) return notFound("하자를 찾을 수 없습니다.");

    logActivity({
      siteId: deleted.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "defect_deleted",
      targetType: "defect",
      targetId: deleted.id,
      metadata: { title: deleted.title },
    });

    return ok({ message: "삭제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}
