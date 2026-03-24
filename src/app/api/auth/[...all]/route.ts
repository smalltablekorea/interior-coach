import { auth } from "@/lib/auth";
import { makeSignature } from "better-auth/crypto";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

function getPath(url: string) {
  return new URL(url).pathname.replace("/api/auth", "");
}

const SECRET = process.env.BETTER_AUTH_SECRET || "";

async function signToken(token: string): Promise<string> {
  const sig = await makeSignature(token, SECRET);
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

    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      return response;
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (e) {
    console.error("[Auth POST]", path, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auth error" },
      { status: 500 },
    );
  }
}
