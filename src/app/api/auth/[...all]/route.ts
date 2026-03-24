import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
  try {
    // Read the body first so it's not consumed by Next.js streaming
    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.text();
    }

    // Create a clean Request for better-auth
    const standardReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body,
    });

    const response = await auth.handler(standardReq);
    return response;
  } catch (e) {
    console.error("[Auth Error]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export { handler as GET, handler as POST };
