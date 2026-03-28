import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaceMembers, workspacePermissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { err, serverError, forbidden } from "@/lib/api/response";
import { hasMinRole, setDefaultPermissions, type WorkspaceRole } from "@/lib/workspace-auth";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["admin", "manager", "member", "viewer"]),
});

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

/** PATCH: 역할 변경 (admin+) */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id, memberId } = await context.params;

  try {
    // 요청자 권한 확인
    const [myMembership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!myMembership || !hasMinRole(myMembership.role as WorkspaceRole, "admin")) {
      return forbidden("관리자 이상만 역할을 변경할 수 있습니다.");
    }

    // 대상 멤버 확인
    const [targetMember] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.workspaceId, id)))
      .limit(1);

    if (!targetMember) return err("멤버를 찾을 수 없습니다.", 404);

    // owner의 역할은 변경 불가
    if (targetMember.role === "owner") {
      return forbidden("소유자의 역할은 변경할 수 없습니다.");
    }

    const body = await request.json();
    const result = updateRoleSchema.safeParse(body);
    if (!result.success) return err("유효하지 않은 역할입니다.");

    const newRole = result.data.role as WorkspaceRole;

    // 역할 업데이트
    await db
      .update(workspaceMembers)
      .set({ role: newRole })
      .where(eq(workspaceMembers.id, memberId));

    // 기존 권한 삭제 후 새 역할에 맞는 기본 권한 재설정
    await db
      .delete(workspacePermissions)
      .where(eq(workspacePermissions.memberId, memberId));

    await setDefaultPermissions(id, memberId, newRole);

    return NextResponse.json({ success: true, role: newRole });
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE: 멤버 제거 (admin+) 또는 자기 자신 탈퇴 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id, memberId } = await context.params;

  try {
    // 대상 멤버 확인
    const [targetMember] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.workspaceId, id)))
      .limit(1);

    if (!targetMember) return err("멤버를 찾을 수 없습니다.", 404);

    // owner는 제거 불가
    if (targetMember.role === "owner") {
      return forbidden("소유자는 워크스페이스에서 제거할 수 없습니다.");
    }

    // 자기 자신이 탈퇴하는 경우 OK
    const isSelf = targetMember.userId === auth.userId;

    if (!isSelf) {
      // 다른 사람을 제거하려면 admin+
      const [myMembership] = await db
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
        .limit(1);

      if (!myMembership || !hasMinRole(myMembership.role as WorkspaceRole, "admin")) {
        return forbidden("관리자 이상만 멤버를 제거할 수 있습니다.");
      }
    }

    // 멤버 삭제 (cascade로 권한도 삭제됨)
    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
