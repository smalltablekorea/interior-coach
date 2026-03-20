import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Admin 이메일 목록 (환경변수 또는 하드코딩)
// 프로덕션에서는 DB 기반 role 테이블로 전환 권장
function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(",").map((e) => e.trim().toLowerCase());
  }
  // 기본 개발 환경: 모든 로그인 사용자를 admin 취급
  // 프로덕션 배포 전 반드시 ADMIN_EMAILS 환경변수 설정 필요
  return [];
}

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
}

/**
 * 서버 측 admin 권한 검증.
 * 인증 실패 또는 admin 아닌 경우 null 반환.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return null;

    const adminEmails = getAdminEmails();

    // ADMIN_EMAILS 미설정 시 (개발 환경): 모든 로그인 사용자 허용
    // ADMIN_EMAILS 설정 시 (프로덕션): 화이트리스트만 허용
    if (adminEmails.length > 0) {
      const userEmail = session.user.email?.toLowerCase();
      if (!userEmail || !adminEmails.includes(userEmail)) {
        return null;
      }
    }

    return {
      userId: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Admin 권한 검증 래퍼.
 * admin이 아니면 403 반환, admin이면 세션 반환.
 */
export async function requireAdmin(): Promise<
  | { ok: true; session: AdminSession }
  | { ok: false; response: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, session };
}
