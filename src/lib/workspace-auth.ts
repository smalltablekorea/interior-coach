import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, workspaces, workspaceMembers, workspacePermissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "viewer";
export type PermissionCategory = "site_management" | "estimates" | "marketing" | "accounting" | "customers" | "settings";
export type AccessLevel = "none" | "read" | "write" | "admin";

interface WorkspaceAuthResult {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  userName: string;
  userEmail: string;
}

/**
 * API 라우트에서 워크스페이스 컨텍스트 인증.
 * 유저의 activeWorkspaceId 또는 요청 헤더의 x-workspace-id를 사용.
 */
export async function requireWorkspaceAuth(): Promise<
  | { ok: true } & WorkspaceAuthResult
  | { ok: false; response: NextResponse }
> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user?.id) {
      return {
        ok: false,
        response: NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 }),
      };
    }

    const userId = session.user.id;

    // 워크스페이스 ID: 헤더 > 유저의 activeWorkspaceId
    const headerWorkspaceId = reqHeaders.get("x-workspace-id");

    let workspaceId: string | null = headerWorkspaceId;

    if (!workspaceId) {
      // 유저의 activeWorkspaceId 조회
      const [u] = await db
        .select({ activeWorkspaceId: user.activeWorkspaceId })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      workspaceId = u?.activeWorkspaceId ?? null;
    }

    if (!workspaceId) {
      // 워크스페이스가 없으면 유저의 첫 번째 워크스페이스 자동 선택
      const [firstMembership] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, userId))
        .limit(1);

      if (firstMembership) {
        workspaceId = firstMembership.workspaceId;
        // activeWorkspaceId 업데이트
        await db.update(user).set({ activeWorkspaceId: workspaceId }).where(eq(user.id, userId));
      }
    }

    if (!workspaceId) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "워크스페이스가 없습니다. 워크스페이스를 생성해주세요.", code: "NO_WORKSPACE" },
          { status: 403 },
        ),
      };
    }

    // 멤버십 확인
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "이 워크스페이스에 접근 권한이 없습니다." },
          { status: 403 },
        ),
      };
    }

    return {
      ok: true,
      userId,
      workspaceId,
      role: membership.role as WorkspaceRole,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "세션 확인 실패" }, { status: 401 }),
    };
  }
}

/**
 * 특정 카테고리에 대한 권한 확인
 */
export async function checkPermission(
  workspaceId: string,
  userId: string,
  category: PermissionCategory,
  requiredLevel: AccessLevel,
): Promise<boolean> {
  // 멤버십 확인
  const [membership] = await db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!membership) return false;

  const role = membership.role as WorkspaceRole;

  // owner/admin은 모든 권한
  if (role === "owner" || role === "admin") return true;

  // 커스텀 권한 확인
  const [permission] = await db
    .select({ accessLevel: workspacePermissions.accessLevel })
    .from(workspacePermissions)
    .where(
      and(
        eq(workspacePermissions.memberId, membership.id),
        eq(workspacePermissions.category, category),
      ),
    )
    .limit(1);

  if (!permission) {
    // 기본 역할별 권한
    return getDefaultAccess(role, requiredLevel);
  }

  return meetsAccessLevel(permission.accessLevel as AccessLevel, requiredLevel);
}

/**
 * 역할별 기본 접근 수준 확인
 */
function getDefaultAccess(role: WorkspaceRole, requiredLevel: AccessLevel): boolean {
  const defaultLevels: Record<WorkspaceRole, AccessLevel> = {
    owner: "admin",
    admin: "admin",
    manager: "write",
    member: "write",
    viewer: "read",
  };
  return meetsAccessLevel(defaultLevels[role], requiredLevel);
}

/**
 * 접근 수준 비교 (admin > write > read > none)
 */
function meetsAccessLevel(actual: AccessLevel, required: AccessLevel): boolean {
  const levels: Record<AccessLevel, number> = { none: 0, read: 1, write: 2, admin: 3 };
  return levels[actual] >= levels[required];
}

/**
 * 역할이 최소 요구 역할 이상인지 확인
 */
export function hasMinRole(userRole: WorkspaceRole, minRole: WorkspaceRole): boolean {
  const roleHierarchy: Record<WorkspaceRole, number> = {
    viewer: 0,
    member: 1,
    manager: 2,
    admin: 3,
    owner: 4,
  };
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}

/**
 * 랜덤 초대 코드 생성 (8자리 영숫자)
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * URL-safe slug 생성 (한글 → 로마자, 공백 → 하이픈)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || `ws-${Date.now()}`;
}

/**
 * 새 멤버에게 역할별 기본 권한 설정
 */
export async function setDefaultPermissions(
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole,
): Promise<void> {
  const categories: PermissionCategory[] = [
    "site_management",
    "estimates",
    "marketing",
    "accounting",
    "customers",
    "settings",
  ];

  const defaultLevel: Record<WorkspaceRole, AccessLevel> = {
    owner: "admin",
    admin: "admin",
    manager: "write",
    member: "write",
    viewer: "read",
  };

  const level = defaultLevel[role];

  const values = categories.map((category) => ({
    workspaceId,
    memberId,
    category,
    accessLevel: category === "settings" && role !== "owner" && role !== "admin" ? "read" : level,
  }));

  await db.insert(workspacePermissions).values(values);
}
