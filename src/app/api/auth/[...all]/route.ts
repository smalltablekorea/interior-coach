import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
  try {
    return await auth.handler(req);
  } catch (e) {
    console.error("[Auth Error]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export { handler as GET, handler as POST };
