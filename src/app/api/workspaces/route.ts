import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { generateInviteCode, generateSlug, setDefaultPermissions } from "@/lib/workspace-auth";
import { z } from "zod";
import { validateBody } from "@/lib/api/validate";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "워크스페이스 이름은 필수입니다").max(100),
  businessType: z.enum(["residential", "commercial", "both"]).optional().default("residential"),
  businessNumber: z.string().max(20).nullable().optional(),
});

/** GET: 내가 속한 워크스페이스 목록 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        businessType: workspaces.businessType,
        plan: workspaces.plan,
        maxMembers: workspaces.maxMembers,
        role: workspaceMembers.role,
        createdAt: workspaces.createdAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, auth.userId));

    // activeWorkspaceId 조회
    const [u] = await db
      .select({ activeWorkspaceId: user.activeWorkspaceId })
      .from(user)
      .where(eq(user.id, auth.userId))
      .limit(1);

    return ok({
      workspaces: rows,
      activeWorkspaceId: u?.activeWorkspaceId ?? rows[0]?.id ?? null,
    });
  } catch (error) {
    return serverError(error);
  }
}

/** POST: 워크스페이스 생성 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const validation = await validateBody(request, createWorkspaceSchema);
  if (!validation.ok) return validation.response;

  try {
    const { name, businessType, businessNumber } = validation.data;

    // 같은 이름 워크스페이스 중복 방지
    const [duplicateName] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.name, name.trim()))
      .limit(1);

    if (duplicateName) {
      return err(`"${name}" 이름의 워크스페이스가 이미 존재합니다.`);
    }

    // slug 생성 (중복 시 숫자 suffix)
    let slug = generateSlug(name);
    const existing = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 워크스페이스 생성
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name,
        slug,
        businessType: businessType ?? "residential",
        businessNumber: businessNumber ?? null,
        ownerId: auth.userId,
        inviteCode: generateInviteCode(),
        plan: "free",
        maxMembers: 5,
      })
      .returning();

    // 생성자를 owner로 멤버 추가
    const [member] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId: workspace.id,
        userId: auth.userId,
        role: "owner",
      })
      .returning();

    // 기본 권한 설정
    await setDefaultPermissions(workspace.id, member.id, "owner");

    // activeWorkspaceId 설정
    await db
      .update(user)
      .set({ activeWorkspaceId: workspace.id })
      .where(eq(user.id, auth.userId));

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
