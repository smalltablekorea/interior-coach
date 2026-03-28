import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  user as userTable,
  workspaces,
  workspaceMembers,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET: 현재 활성 워크스페이스 정보
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const [userData] = await db
      .select({ activeWorkspaceId: userTable.activeWorkspaceId })
      .from(userTable)
      .where(eq(userTable.id, auth.userId))
      .limit(1);

    if (!userData?.activeWorkspaceId) {
      return NextResponse.json({ workspace: null });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, userData.activeWorkspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ workspace: null });
    }

    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(workspaceMembers.userId, auth.userId),
        ),
      )
      .limit(1);

    const memberCount = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.id));

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        inviteCode: workspace.inviteCode,
        maxMembers: workspace.maxMembers,
        memberCount: memberCount.length,
        myRole: membership?.role || null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "워크스페이스 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: 활성 워크스페이스 전환
export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { workspaceId } = await request.json();

    // 멤버인지 확인
    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, auth.userId),
        ),
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "워크스페이스 멤버가 아닙니다." }, { status: 403 });
    }

    await db
      .update(userTable)
      .set({ activeWorkspaceId: workspaceId })
      .where(eq(userTable.id, auth.userId));

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "워크스페이스 전환 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
