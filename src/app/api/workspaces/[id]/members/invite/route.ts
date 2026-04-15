import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaceMembers, workspaceInvitations, workspaces, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { err, serverError, forbidden } from "@/lib/api/response";
import { hasMinRole, type WorkspaceRole } from "@/lib/workspace-auth";
import { sendInviteEmail } from "@/lib/email";
import { z } from "zod";
import * as crypto from "crypto";

const inviteSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  role: z.enum(["admin", "manager", "member", "viewer"]).default("member"),
});

type RouteContext = { params: Promise<{ id: string }> };

/** POST: 이메일 초대 발송 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    // 관리자 이상만 초대 가능
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!membership || !hasMinRole(membership.role as WorkspaceRole, "admin")) {
      return forbidden("관리자 이상만 멤버를 초대할 수 있습니다.");
    }

    const body = await request.json();
    const result = inviteSchema.safeParse(body);
    if (!result.success) return err("입력값 오류");

    const { email, role } = result.data;

    // 이미 멤버인지 확인 (이메일로 유저 조회 → 멤버십 확인)
    const existingMembers = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, id));

    // 워크스페이스 멤버 수 확인
    const [workspace] = await db
      .select({ maxMembers: workspaces.maxMembers })
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (workspace && existingMembers.length >= workspace.maxMembers) {
      return err("워크스페이스 최대 멤버 수를 초과했습니다.", 403);
    }

    // 기존 pending 초대 확인
    const [existingInvite] = await db
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, id),
          eq(workspaceInvitations.email, email),
          eq(workspaceInvitations.status, "pending"),
        ),
      )
      .limit(1);

    if (existingInvite) {
      return err("이미 초대가 발송된 이메일입니다.");
    }

    // 초대 토큰 생성
    const token = crypto.randomBytes(32).toString("hex");

    const [invitation] = await db
      .insert(workspaceInvitations)
      .values({
        workspaceId: id,
        email,
        role,
        invitedBy: auth.userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 86400000), // 7일 후 만료
      })
      .returning();

    // 워크스페이스 이름 조회
    const [ws] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    // 초대한 사람 이름 조회
    const [inviter] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, auth.userId))
      .limit(1);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://interiorcoach.kr";
    const inviteUrl = `${baseUrl}/auth/invite?token=${token}`;

    // 이메일 발송
    const emailResult = await sendInviteEmail({
      to: email,
      workspaceName: ws?.name || "워크스페이스",
      inviterName: inviter?.name || "팀원",
      role,
      inviteUrl,
    });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
        inviteUrl,
        emailSent: emailResult.success,
        ...(emailResult.error && { emailError: emailResult.error }),
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error);
  }
}
