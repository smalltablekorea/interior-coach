import { NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { workspaceInvitations, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

// POST: 이메일 초대 생성
export async function POST(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "admin");
  if (!auth.ok) return auth.response;

  try {
    const { email, role } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    }

    const validRoles = ["admin", "manager", "member", "viewer"];
    const assignRole = validRoles.includes(role) ? role : "member";

    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 86400000); // 7 days

    await db.insert(workspaceInvitations).values({
      workspaceId: auth.workspaceId,
      email: email.trim().toLowerCase(),
      role: assignRole,
      invitedBy: auth.userId,
      token,
      expiresAt,
    });

    return NextResponse.json({
      invitation: {
        email,
        role: assignRole,
        token,
        expiresAt: expiresAt.toISOString(),
        link: `/workspace/invite/${token}`,
      },
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
