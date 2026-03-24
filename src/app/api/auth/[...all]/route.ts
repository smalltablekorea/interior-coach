import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
  try {
    // Better Auth expects a standard Request, not NextRequest
    // NextRequest in Next.js 16 may have incompatible properties
    const standardReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error duplex needed for streaming body
      duplex: "half",
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
