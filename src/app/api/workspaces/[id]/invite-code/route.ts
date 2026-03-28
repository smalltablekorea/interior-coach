import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { serverError, forbidden } from "@/lib/api/response";
import { hasMinRole, generateInviteCode, type WorkspaceRole } from "@/lib/workspace-auth";

type RouteContext = { params: Promise<{ id: string }> };

/** POST: 초대코드 재생성 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!membership || !hasMinRole(membership.role as WorkspaceRole, "admin")) {
      return forbidden("관리자 이상만 초대코드를 재생성할 수 있습니다.");
    }

    const newCode = generateInviteCode();

    const [updated] = await db
      .update(workspaces)
      .set({
        inviteCode: newCode,
        inviteExpiresAt: new Date(Date.now() + 30 * 86400000), // 30일 후 만료
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, id))
      .returning({ inviteCode: workspaces.inviteCode, inviteExpiresAt: workspaces.inviteExpiresAt });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}
