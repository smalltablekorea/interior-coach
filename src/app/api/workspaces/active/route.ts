import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, workspaceMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { err, serverError } from "@/lib/api/response";
import { z } from "zod";

const switchSchema = z.object({
  workspaceId: z.string().uuid(),
});

/** PUT: 활성 워크스페이스 전환 */
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const result = switchSchema.safeParse(body);
    if (!result.success) return err("워크스페이스 ID가 필요합니다.");

    const { workspaceId } = result.data;

    // 멤버십 확인
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, auth.userId)),
      )
      .limit(1);

    if (!membership) return err("이 워크스페이스에 접근 권한이 없습니다.", 403);

    // activeWorkspaceId 업데이트
    await db
      .update(user)
      .set({ activeWorkspaceId: workspaceId })
      .where(eq(user.id, auth.userId));

    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    return serverError(error);
  }
}
