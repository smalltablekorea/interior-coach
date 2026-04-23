import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable, workspaceMembers, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkPermission, type Category, type Action, type WorkspaceRole } from "@/lib/workspace/permissions";

interface AuthResult {
  userId: string;
  session: {
    user: { id: string; name: string; email: string };
  };
}

/**
 * API 라우트에서 인증된 사용자를 확인합니다.
 * 인증 실패 시 401 NextResponse를 반환합니다.
 */
export async function requireAuth(): Promise<
  | { ok: true; userId: string; session: AuthResult["session"] }
  | { ok: false; response: NextResponse }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "인증이 필요합니다" },
          { status: 401 },
        ),
      };
    }

    return {
      ok: true,
      userId: session.user.id,
      session: { user: session.user as AuthResult["session"]["user"] },
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "세션 확인 실패" },
        { status: 401 },
      ),
    };
  }
}

interface WorkspaceAuthSuccess {
  ok: true;
  userId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  session: AuthResult["session"];
}

interface WorkspaceAuthFailure {
  ok: false;
  response: NextResponse;
}

/**
 * 워크스페이스 인증 + 권한 확인.
 * category/action을 지정하면 해당 카테고리에 대한 권한도 체크합니다.
 */
export async function requireWorkspaceAuth(
  category?: Category,
  action?: Action,
): Promise<WorkspaceAuthSuccess | WorkspaceAuthFailure> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;

  try {
    // user의 activeWorkspaceId 조회
    const [userData] = await db
      .select({ activeWorkspaceId: userTable.activeWorkspaceId })
      .from(userTable)
      .where(eq(userTable.id, authResult.userId))
      .limit(1);

    if (!userData?.activeWorkspaceId) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "워크스페이스를 선택해주세요.", code: "NO_WORKSPACE" },
          { status: 403 },
        ),
      };
    }

    // workspace_members에서 role 조회
    const [member] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, userData.activeWorkspaceId),
          eq(workspaceMembers.userId, authResult.userId),
        ),
      )
      .limit(1);

    if (!member) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "워크스페이스 멤버가 아닙니다.", code: "NOT_MEMBER" },
          { status: 403 },
        ),
      };
    }

    const role = member.role as WorkspaceRole;

    // 카테고리 권한 체크
    if (category && action) {
      if (!checkPermission(role, category, action)) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "접근 권한이 없습니다.", code: "FORBIDDEN" },
            { status: 403 },
          ),
        };
      }
    }

    return {
      ok: true,
      userId: authResult.userId,
      workspaceId: userData.activeWorkspaceId,
      workspaceRole: role,
      session: authResult.session,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "워크스페이스 인증 실패" },
        { status: 500 },
      ),
    };
  }
}

/**
 * 워크스페이스의 모든 멤버 userId 목록을 반환합니다.
 * API 라우트에서 데이터 조회 시 IN 조건으로 사용.
 */
export async function getWorkspaceMemberIds(workspaceId: string): Promise<string[]> {
  const members = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
  return members.map((m) => m.userId);
}

/** 시스템 관리자 이메일 — 랜딩/운영 지표, 데모 신청 등 글로벌 콘솔 접근용 */
const SYSTEM_ADMIN_EMAILS = new Set(
  (process.env.SYSTEM_ADMIN_EMAILS || "smalltablekorea@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

/**
 * 시스템 관리자 여부를 확인한다.
 * - Better Auth 세션 + SYSTEM_ADMIN_EMAILS 환경변수(쉼표 구분)로 검증
 * - 워크스페이스 RBAC와 별개: 플랫폼 운영자만 접근하는 라우트(/api/admin/*)에 사용
 */
export async function requireSystemAdmin(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;

  try {
    const [row] = await db
      .select({ email: userTable.email, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, authResult.userId))
      .limit(1);

    const email = (row?.email || "").toLowerCase();
    const isAdmin =
      SYSTEM_ADMIN_EMAILS.has(email) || row?.role === "admin";

    if (!isAdmin) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "시스템 관리자 권한이 필요합니다." },
          { status: 403 },
        ),
      };
    }

    return { ok: true, userId: authResult.userId, email };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "관리자 확인 실패" },
        { status: 500 },
      ),
    };
  }
}
