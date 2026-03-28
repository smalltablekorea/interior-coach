import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, workspaceInvitations, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { err, serverError } from "@/lib/api/response";
import { setDefaultPermissions, type WorkspaceRole } from "@/lib/workspace-auth";
import { z } from "zod";

const joinSchema = z.object({
  // 초대코드 또는 초대토큰 중 하나
  inviteCode: z.string().optional(),
  inviteToken: z.string().optional(),
}).refine(
  (data) => data.inviteCode || data.inviteToken,
  { message: "초대코드 또는 초대토큰이 필요합니다" },
);

type RouteContext = { params: Promise<{ id: string }> };

/** POST: 초대코드/토큰으로 참가 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const result = joinSchema.safeParse(body);
    if (!result.success) return err("초대코드 또는 초대토큰이 필요합니다");

    const { inviteCode, inviteToken } = result.data;

    // 이미 멤버인지 확인
    const [existing] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)),
      )
      .limit(1);

    if (existing) return err("이미 이 워크스페이스의 멤버입니다.");

    let role: WorkspaceRole = "member";

    if (inviteToken) {
      // 토큰 기반 참가 (이메일 초대)
      const [invitation] = await db
        .select()
        .from(workspaceInvitations)
        .where(
          and(
            eq(workspaceInvitations.workspaceId, id),
            eq(workspaceInvitations.token, inviteToken),
            eq(workspaceInvitations.status, "pending"),
          ),
        )
        .limit(1);

      if (!invitation) return err("유효하지 않은 초대입니다.", 404);
      if (new Date() > invitation.expiresAt) {
        await db
          .update(workspaceInvitations)
          .set({ status: "expired" })
          .where(eq(workspaceInvitations.id, invitation.id));
        return err("만료된 초대입니다.");
      }

      // 이메일 확인
      const [u] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, auth.userId))
        .limit(1);

      if (u?.email !== invitation.email) {
        return err("초대된 이메일과 현재 계정의 이메일이 다릅니다.", 403);
      }

      role = invitation.role as WorkspaceRole;

      // 초대 상태 업데이트
      await db
        .update(workspaceInvitations)
        .set({ status: "accepted" })
        .where(eq(workspaceInvitations.id, invitation.id));
    } else if (inviteCode) {
      // 초대코드 기반 참가
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(and(eq(workspaces.id, id), eq(workspaces.inviteCode, inviteCode)))
        .limit(1);

      if (!workspace) return err("유효하지 않은 초대코드입니다.", 404);

      if (workspace.inviteExpiresAt && new Date() > workspace.inviteExpiresAt) {
        return err("만료된 초대코드입니다.");
      }

      // 멤버 수 확인
      const members = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, id));

      if (members.length >= workspace.maxMembers) {
        return err("워크스페이스 최대 멤버 수를 초과했습니다.", 403);
      }

      role = "member"; // 초대코드로 참가하면 기본 member
    }

    // 멤버 추가
    const [member] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId: id,
        userId: auth.userId,
        role,
      })
      .returning();

    // 기본 권한 설정
    await setDefaultPermissions(id, member.id, role);

    // activeWorkspaceId 설정 (첫 워크스페이스인 경우)
    const [u] = await db
      .select({ activeWorkspaceId: user.activeWorkspaceId })
      .from(user)
      .where(eq(user.id, auth.userId))
      .limit(1);

    if (!u?.activeWorkspaceId) {
      await db.update(user).set({ activeWorkspaceId: id }).where(eq(user.id, auth.userId));
    }

    return NextResponse.json({ success: true, role, memberId: member.id }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
