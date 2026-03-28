import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, user as userTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST: 초대코드로 워크스페이스 참여
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { inviteCode } = await request.json();

    if (!inviteCode?.trim()) {
      return NextResponse.json({ error: "초대코드를 입력해주세요." }, { status: 400 });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.inviteCode, inviteCode.trim().toUpperCase()))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "유효하지 않은 초대코드입니다." }, { status: 404 });
    }

    // 이미 멤버인지 확인
    const [existing] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(workspaceMembers.userId, auth.userId),
        ),
      )
      .limit(1);

    if (existing) {
      // 이미 멤버이면 활성 워크스페이스만 전환
      await db
        .update(userTable)
        .set({ activeWorkspaceId: workspace.id })
        .where(eq(userTable.id, auth.userId));

      return NextResponse.json({
        workspace: { id: workspace.id, name: workspace.name },
        message: "이미 멤버입니다. 워크스페이스로 전환했습니다.",
      });
    }

    // 멤버 수 제한 확인
    const members = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.id));

    if (members.length >= workspace.maxMembers) {
      return NextResponse.json(
        { error: `멤버 수 제한(${workspace.maxMembers}명)에 도달했습니다.` },
        { status: 403 },
      );
    }

    // 멤버 추가 + 활성 워크스페이스 설정
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: auth.userId,
      role: "member",
    });

    await db
      .update(userTable)
      .set({ activeWorkspaceId: workspace.id })
      .where(eq(userTable.id, auth.userId));

    return NextResponse.json({
      workspace: { id: workspace.id, name: workspace.name },
      message: "워크스페이스에 참여했습니다!",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "워크스페이스 참여 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
