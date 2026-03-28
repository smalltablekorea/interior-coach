import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaceMembers, workspacePermissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError, forbidden } from "@/lib/api/response";
import { hasMinRole, type WorkspaceRole, type PermissionCategory, type AccessLevel } from "@/lib/workspace-auth";
import { z } from "zod";

const permissionUpdateSchema = z.object({
  permissions: z.array(
    z.object({
      memberId: z.string().uuid(),
      category: z.enum(["site_management", "estimates", "marketing", "accounting", "customers", "settings"]),
      accessLevel: z.enum(["none", "read", "write", "admin"]),
    }),
  ),
});

type RouteContext = { params: Promise<{ id: string }> };

/** GET: 전체 권한 매트릭스 조회 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    // 멤버 확인
    const [myMembership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!myMembership) return forbidden();

    const permissions = await db
      .select({
        id: workspacePermissions.id,
        memberId: workspacePermissions.memberId,
        category: workspacePermissions.category,
        accessLevel: workspacePermissions.accessLevel,
      })
      .from(workspacePermissions)
      .where(eq(workspacePermissions.workspaceId, id));

    return ok(permissions);
  } catch (error) {
    return serverError(error);
  }
}

/** PUT: 권한 일괄 업데이트 (admin+) */
export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    // admin+ 확인
    const [myMembership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!myMembership || !hasMinRole(myMembership.role as WorkspaceRole, "admin")) {
      return forbidden("관리자 이상만 권한을 수정할 수 있습니다.");
    }

    const body = await request.json();
    const result = permissionUpdateSchema.safeParse(body);
    if (!result.success) return err("입력값 오류");

    // 각 권한 업데이트 (upsert)
    for (const perm of result.data.permissions) {
      // 해당 멤버가 이 워크스페이스의 멤버인지 확인
      const [member] = await db
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
          and(eq(workspaceMembers.id, perm.memberId), eq(workspaceMembers.workspaceId, id)),
        )
        .limit(1);

      if (!member) continue;

      // owner의 권한은 변경 불가
      if (member.role === "owner") continue;

      const [existing] = await db
        .select({ id: workspacePermissions.id })
        .from(workspacePermissions)
        .where(
          and(
            eq(workspacePermissions.memberId, perm.memberId),
            eq(workspacePermissions.category, perm.category as PermissionCategory),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(workspacePermissions)
          .set({ accessLevel: perm.accessLevel as AccessLevel })
          .where(eq(workspacePermissions.id, existing.id));
      } else {
        await db.insert(workspacePermissions).values({
          workspaceId: id,
          memberId: perm.memberId,
          category: perm.category as PermissionCategory,
          accessLevel: perm.accessLevel as AccessLevel,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
