import { db } from "@/lib/db";
import { attendance, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { logActivity } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

// ── 상세 조회 ──
export async function GET(_: Request, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [row] = await db
      .select({
        id: attendance.id,
        siteId: attendance.siteId,
        siteName: sites.name,
        memberId: attendance.memberId,
        memberName: attendance.memberName,
        role: attendance.role,
        workDate: attendance.workDate,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        hoursWorked: attendance.hoursWorked,
        overtimeHours: attendance.overtimeHours,
        status: attendance.status,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .leftJoin(sites, eq(attendance.siteId, sites.id))
      .where(
        and(
          eq(attendance.id, id),
          workspaceFilter(attendance.workspaceId, attendance.userId, auth.workspaceId, auth.userId),
        ),
      );

    if (!row) return notFound("출역 기록을 찾을 수 없습니다.");
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

// ── 수정 (퇴근 시간 업데이트 등) ──
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.checkIn !== undefined) updates.checkIn = body.checkIn;
    if (body.checkOut !== undefined) updates.checkOut = body.checkOut;
    if (body.status !== undefined) {
      const validStatuses = ["present", "absent", "half_day", "holiday"];
      if (!validStatuses.includes(body.status)) return err("유효하지 않은 status입니다.");
      updates.status = body.status;
    }
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.role !== undefined) updates.role = body.role;
    if (body.memberName !== undefined) updates.memberName = body.memberName;

    // 근무시간 자동 재계산
    const checkIn = body.checkIn ?? undefined;
    const checkOut = body.checkOut ?? undefined;
    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(":").map(Number);
      const [outH, outM] = checkOut.split(":").map(Number);
      const hours = Math.max(0, (outH * 60 + outM - (inH * 60 + inM)) / 60);
      updates.hoursWorked = hours;
      updates.overtimeHours = Math.max(0, hours - 8);
    } else if (checkIn !== undefined || checkOut !== undefined) {
      // 한쪽만 바뀌면 기존 값 가져와서 재계산
      const [existing] = await db
        .select({ checkIn: attendance.checkIn, checkOut: attendance.checkOut })
        .from(attendance)
        .where(eq(attendance.id, id));
      if (existing) {
        const ci = checkIn || existing.checkIn;
        const co = checkOut || existing.checkOut;
        if (ci && co) {
          const [inH, inM] = ci.split(":").map(Number);
          const [outH, outM] = co.split(":").map(Number);
          const hours = Math.max(0, (outH * 60 + outM - (inH * 60 + inM)) / 60);
          updates.hoursWorked = hours;
          updates.overtimeHours = Math.max(0, hours - 8);
        }
      }
    }

    const [updated] = await db
      .update(attendance)
      .set(updates)
      .where(
        and(
          eq(attendance.id, id),
          workspaceFilter(attendance.workspaceId, attendance.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning();

    if (!updated) return notFound("출역 기록을 찾을 수 없습니다.");

    logActivity({
      siteId: updated.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "attendance_updated",
      targetType: "attendance",
      targetId: updated.id,
      metadata: { memberName: updated.memberName, changes: Object.keys(body) },
    });

    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

// ── 삭제 ──
export async function DELETE(_: Request, context: RouteContext) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [deleted] = await db
      .delete(attendance)
      .where(
        and(
          eq(attendance.id, id),
          workspaceFilter(attendance.workspaceId, attendance.userId, auth.workspaceId, auth.userId),
        ),
      )
      .returning({ id: attendance.id, siteId: attendance.siteId, memberName: attendance.memberName });

    if (!deleted) return notFound("출역 기록을 찾을 수 없습니다.");

    logActivity({
      siteId: deleted.siteId,
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      action: "attendance_deleted",
      targetType: "attendance",
      targetId: deleted.id,
      metadata: { memberName: deleted.memberName },
    });

    return ok({ message: "삭제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}
