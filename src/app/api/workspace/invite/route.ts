import { NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { workspaceInvitations, workspaces, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendInviteEmail } from "@/lib/email";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

// POST: 이메일 초대 생성
export async function POST(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "admin");
  if (!auth.ok) return auth.response;

  // 초대 이메일 남용 방지 (AI-21): 유저당 분당 10회
  const gate = enforceApiRateLimit(auth.userId, { bucket: "workspace-invite", max: 10 });
  if (!gate.ok) return gate.response;

  try {
    const { email, role } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    }

    const validRoles = ["admin", "manager", "member", "viewer"];
    const assignRole = validRoles.includes(role) ? role : "member";

    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 86400000); // 7 days

    const normalizedEmail = email.trim().toLowerCase();

    await db.insert(workspaceInvitations).values({
      workspaceId: auth.workspaceId,
      email: normalizedEmail,
      role: assignRole,
      invitedBy: auth.userId,
      token,
      expiresAt,
    });

    // 워크스페이스 이름 조회
    const [ws] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, auth.workspaceId))
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
      to: normalizedEmail,
      workspaceName: ws?.name || "워크스페이스",
      inviterName: inviter?.name || "팀원",
      role: assignRole,
      inviteUrl,
    });

    return NextResponse.json({
      invitation: {
        email: normalizedEmail,
        role: assignRole,
        expiresAt: expiresAt.toISOString(),
        link: inviteUrl,
      },
      emailSent: emailResult.success,
      ...(emailResult.error && { emailError: emailResult.error }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "초대 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: 초대 목록 조회
export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const invitations = await db
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, auth.workspaceId),
          eq(workspaceInvitations.status, "pending"),
        ),
      );

    return NextResponse.json({ invitations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "초대 목록 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: 초대 취소
export async function DELETE(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "admin");
  if (!auth.ok) return auth.response;

  try {
    const { invitationId } = await request.json();

    await db
      .update(workspaceInvitations)
      .set({ status: "revoked" })
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.workspaceId, auth.workspaceId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "초대 취소 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
