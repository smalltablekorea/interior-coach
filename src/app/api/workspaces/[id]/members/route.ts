import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { workspaceMembers, workspacePermissions, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, serverError, forbidden } from "@/lib/api/response";

type RouteContext = { params: Promise<{ id: string }> };

/** GET: 멤버 목록 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    // 요청자의 멤버십 확인
    const [myMembership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, auth.userId)))
      .limit(1);

    if (!myMembership) return forbidden();

    // 전체 멤버 목록 (유저 정보 JOIN)
    const members = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(eq(workspaceMembers.workspaceId, id));

    // 각 멤버의 권한 조회
    const memberIds = members.map((m) => m.id);
    const allPermissions = memberIds.length > 0
      ? await db
          .select()
          .from(workspacePermissions)
          .where(eq(workspacePermissions.workspaceId, id))
      : [];

    const membersWithPermissions = members.map((m) => ({
      ...m,
      permissions: allPermissions
        .filter((p) => p.memberId === m.id)
        .reduce(
          (acc, p) => {
            acc[p.category] = p.accessLevel;
            return acc;
          },
          {} as Record<string, string>,
        ),
    }));

    return ok(membersWithPermissions);
  } catch (error) {
    return serverError(error);
  }
}
