import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError, forbidden } from "@/lib/api/response";
import { hasMinRole, type WorkspaceRole } from "@/lib/workspace-auth";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  businessType: z.enum(["residential", "commercial", "both"]).optional(),
  businessNumber: z.string().max(20).nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/** GET: 워크스페이스 상세 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    // 멤버 확인
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!membership) return forbidden("이 워크스페이스에 접근 권한이 없습니다.");

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) return err("워크스페이스를 찾을 수 없습니다.", 404);

    // 멤버 수 조회
    const members = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, id));

    return ok({
      ...workspace,
      memberCount: members.length,
      myRole: membership.role,
    });
  } catch (error) {
    return serverError(error);
  }
}

/** PATCH: 워크스페이스 정보 수정 (admin+) */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
      return forbidden("관리자 이상만 워크스페이스를 수정할 수 있습니다.");
    }

    const body = await request.json();
    const result = updateWorkspaceSchema.safeParse(body);
    if (!result.success) return err("입력값 오류");

    const [updated] = await db
      .update(workspaces)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();

    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE: 워크스페이스 삭제 (owner only) */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!membership || membership.role !== "owner") {
      return forbidden("소유자만 워크스페이스를 삭제할 수 있습니다.");
    }

    await db.delete(workspaces).where(eq(workspaces.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
