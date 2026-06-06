import { auth } from "@/lib/auth";
import { makeSignature } from "better-auth/crypto";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { startTrialForNewUser } from "@/lib/subscription/trial";

function getPath(url: string) {
  return new URL(url).pathname.replace("/api/auth", "");
}

function getSecret(): string {
  const v = process.env.BETTER_AUTH_SECRET;
  if (v && v.length >= 16) return v;
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("[auth] BETTER_AUTH_SECRET 미설정. 세션 서명 불가.");
  }
  return "development-secret-key-change-in-production";
}

async function signToken(token: string): Promise<string> {
  const sig = await makeSignature(token, getSecret());
  return `${token}.${sig}`;
}

async function setSessionCookie(
  response: NextResponse,
  token: string,
  maxAge = 604800,
) {
  const isSecure =
    process.env.BETTER_AUTH_URL?.startsWith("https") ?? false;
  const cookieName = isSecure
    ? "__Secure-better-auth.session_token"
    : "better-auth.session_token";

  const signedToken = await signToken(token);

  response.cookies.set(cookieName, signedToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function GET(req: NextRequest) {
  const path = getPath(req.url);

  try {
    if (path === "/get-session") {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session) {
        return NextResponse.json(null);
      }
      return NextResponse.json(session);
    }

    // OAuth 콜백(/callback/google, /callback/kakao 등)과 그 외 GET 경로는
    // better-auth 기본 핸들러에 위임. 콜백은 redirect + Set-Cookie 응답을
    // 반환하므로 커스텀 쿠키 서명 로직 우회 가능.
    const res = await auth.handler(req);
    // 디버그: 콜백 처리 결과 로깅
    if (path.startsWith("/callback/")) {
      const setCookie = res.headers.get("set-cookie");
      const location = res.headers.get("location");
      const url = new URL(req.url);
      console.log("[Auth Callback]", path, {
        status: res.status,
        hasSetCookie: !!setCookie,
        setCookiePreview: setCookie?.slice(0, 80),
        location,
        hasCode: url.searchParams.has("code"),
        hasError: url.searchParams.get("error"),
        errorDesc: url.searchParams.get("error_description"),
      });
    }
    return res;
  } catch (e) {
    console.error("[Auth GET]", path, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auth error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const path = getPath(req.url);

  try {
    if (path === "/sign-in/email") {
      const rawBody = await req.text();
      let email: string, password: string;
      try {
        const parsed = JSON.parse(rawBody);
        email = parsed.email;
        password = parsed.password;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }
      const result = await auth.api.signInEmail({
        body: { email, password },
      });
      const response = NextResponse.json({
        redirect: result.redirect,
        token: result.token,
        user: result.user,
      });
      if (result.token) {
        await setSessionCookie(response, result.token);
      }
      return response;
    }

    if (path === "/sign-up/email") {
      const rawBody = await req.text();
      let email: string, password: string, name: string | undefined;
      try {
        const parsed = JSON.parse(rawBody);
        email = parsed.email;
        password = parsed.password;
        name = parsed.name;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }
      const result = await auth.api.signUpEmail({
        body: { email, password, name: name || email.split("@")[0] },
      });

      // databaseHooks.user.create.after가 백그라운드에서 자동 발동되지만,
      // better-auth Next.js 16 호환성 이슈 대비 보험으로 명시적 호출.
      // startTrialForNewUser는 멱등이므로 중복 실행해도 안전.
      if (result.user?.id) {
        try {
          const grant = await startTrialForNewUser(result.user.id);
          console.log("[Auth] Signup grant (explicit)", {
            userId: result.user.id,
            email: result.user.email,
            ...grant,
          });
        } catch (e) {
          console.error("[Auth] Explicit signup grant failed", result.user.id, e);
        }
      }

      const response = NextResponse.json({
        token: result.token,
        user: result.user,
      });
      if (result.token) {
        await setSessionCookie(response, result.token);
      }
      return response;
    }

    if (path === "/sign-out") {
      try {
        await auth.api.signOut({ headers: await headers() });
      } catch {
        // Session might already be invalid
      }
      const response = NextResponse.json({ success: true });
      const isSecure =
        process.env.BETTER_AUTH_URL?.startsWith("https") ?? false;
      const cookieName = isSecure
        ? "__Secure-better-auth.session_token"
        : "better-auth.session_token";
      response.cookies.delete(cookieName);
      response.cookies.delete("has_workspace");
      return response;
    }

    // sign-in/social, sign-up/social 등 OAuth 시작 경로는 better-auth 기본 핸들러에 위임.
    // 응답 JSON에 redirect URL이 들어있어 클라이언트가 그쪽으로 이동.
    return auth.handler(req);
  } catch (e) {
    console.error("[Auth POST]", path, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auth error" },
      { status: 500 },
    );
  }
}
