import { NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { workspaceMembers, user as userTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isRoleAtLeast, type WorkspaceRole } from "@/lib/workspace/permissions";

// GET: 워크스페이스 멤버 목록
export async function GET() {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const members = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
      })
      .from(workspaceMembers)
      .innerJoin(userTable, eq(workspaceMembers.userId, userTable.id))
      .where(eq(workspaceMembers.workspaceId, auth.workspaceId));

    return NextResponse.json({ members });
  } catch (err) {
    const message = err instanceof Error ? err.message : "멤버 목록 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: 멤버 역할 변경
export async function PATCH(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "admin");
  if (!auth.ok) return auth.response;

  try {
    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return NextResponse.json({ error: "멤버 ID와 역할을 지정해주세요." }, { status: 400 });
    }

    const validRoles: WorkspaceRole[] = ["admin", "manager", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
    }

    // 대상 멤버 조회
    const [target] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, memberId),
          eq(workspaceMembers.workspaceId, auth.workspaceId),
        ),
      )
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
    }

    // Owner 역할은 변경 불가
    if (target.role === "owner") {
      return NextResponse.json({ error: "Owner 역할은 변경할 수 없습니다." }, { status: 403 });
    }

    // 자신보다 높은 역할로 변경 불가
    if (!isRoleAtLeast(auth.workspaceRole, role as WorkspaceRole)) {
      return NextResponse.json({ error: "자신보다 높은 역할을 부여할 수 없습니다." }, { status: 403 });
    }

    await db
      .update(workspaceMembers)
      .set({ role })
      .where(eq(workspaceMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "역할 변경 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: 멤버 제거
export async function DELETE(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "admin");
  if (!auth.ok) return auth.response;

  try {
    const { memberId } = await request.json();

    const [target] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, memberId),
          eq(workspaceMembers.workspaceId, auth.workspaceId),
        ),
      )
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
    }

    if (target.role === "owner") {
      return NextResponse.json({ error: "Owner는 제거할 수 없습니다." }, { status: 403 });
    }

    // 자신보다 높은 역할의 멤버는 제거 불가
    if (!isRoleAtLeast(auth.workspaceRole, target.role as WorkspaceRole)) {
      return NextResponse.json({ error: "자신보다 높은 역할의 멤버를 제거할 수 없습니다." }, { status: 403 });
    }

    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId));

    // 대상의 activeWorkspaceId를 null로
    await db
      .update(userTable)
      .set({ activeWorkspaceId: null })
      .where(eq(userTable.id, target.userId));

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "멤버 제거 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
