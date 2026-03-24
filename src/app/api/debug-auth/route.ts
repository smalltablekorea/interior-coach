import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};
  checks.DATABASE_URL = process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.length} chars)` : "MISSING";
  checks.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ? `set (${process.env.BETTER_AUTH_SECRET.length} chars)` : "MISSING";
  checks.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "MISSING";

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT count(*) as cnt FROM "user"`;
    checks.db_connection = `OK (${result[0].cnt} users)`;
  } catch (e) {
    checks.db_connection = `ERROR: ${String(e)}`;
  }

  try {
    const { auth } = await import("@/lib/auth");
    checks.auth_import = "OK";
    try {
      const result = await auth.api.signInEmail({
        body: { email: "smalltablekorea@gmail.com", password: "Dusaocnf100djr!@" },
      });
      checks.sign_in = `OK (user: ${result.user?.email})`;
    } catch (e) {
      checks.sign_in = `ERROR: ${String(e)}`;
    }
  } catch (e) {
    checks.auth_import = `ERROR: ${String(e)}`;
  }

  return NextResponse.json(checks, { status: 200 });
}

// Test auth.handler with a real Request object
export async function POST(req: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth");

    // Create a proper request to the sign-in endpoint
    const url = new URL("/api/auth/sign-in/email", req.url);
    const body = await req.text();

    const testReq = new Request(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const response = await auth.handler(testReq);
    const responseBody = await response.text();
    return NextResponse.json({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody.substring(0, 500),
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.substring(0, 500) : undefined,
    }, { status: 500 });
  }
}
