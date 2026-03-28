import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase(); // 8-char code
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

// POST: 새 워크스페이스 생성
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, ceoName, businessNumber, phone, businessType } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "업체명을 입력해주세요." }, { status: 400 });
    }

    const slug = generateSlug(name);
    const inviteCode = generateInviteCode();

    // 트랜잭션: workspace 생성 → member 추가 → user 업데이트
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: name.trim(),
        slug,
        businessType: businessType || "residential",
        businessNumber: businessNumber || null,
        ownerId: auth.userId,
        inviteCode,
        plan: "free",
        maxMembers: 5,
      })
      .returning();

    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: auth.userId,
      role: "owner",
    });

    await db
      .update(userTable)
      .set({ activeWorkspaceId: workspace.id })
      .where(eq(userTable.id, auth.userId));

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        inviteCode: workspace.inviteCode,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "워크스페이스 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: 내가 속한 워크스페이스 목록
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const memberships = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        name: workspaces.name,
        slug: workspaces.slug,
        plan: workspaces.plan,
        inviteCode: workspaces.inviteCode,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, auth.userId));

    // 현재 활성 워크스페이스 ID
    const [userData] = await db
      .select({ activeWorkspaceId: userTable.activeWorkspaceId })
      .from(userTable)
      .where(eq(userTable.id, auth.userId))
      .limit(1);

    return NextResponse.json({
      workspaces: memberships.map((m) => ({
        id: m.workspaceId,
        name: m.name,
        slug: m.slug,
        role: m.role,
        plan: m.plan,
        inviteCode: m.inviteCode,
        joinedAt: m.joinedAt,
        isActive: m.workspaceId === userData?.activeWorkspaceId,
      })),
      activeWorkspaceId: userData?.activeWorkspaceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "워크스페이스 목록 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
