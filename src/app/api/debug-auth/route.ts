import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.length} chars)` : "MISSING";
  checks.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ? `set (${process.env.BETTER_AUTH_SECRET.length} chars)` : "MISSING";
  checks.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "MISSING";

  // Check DB connection
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT count(*) as cnt FROM "user"`;
    checks.db_connection = `OK (${result[0].cnt} users)`;
  } catch (e) {
    checks.db_connection = `ERROR: ${String(e)}`;
  }

  // Check auth import
  try {
    const { auth } = await import("@/lib/auth");
    checks.auth_import = "OK";

    // Try sign-in
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
