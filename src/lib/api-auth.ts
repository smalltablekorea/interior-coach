import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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
