import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/agency/portal-token";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await verifyPortalToken(token);

  if (!result.ok) {
    const statusCode =
      result.status === "not_found" ? 404 : result.status === "expired" ? 410 : 403;
    return NextResponse.json(
      { ok: false, status: result.status },
      { status: statusCode },
    );
  }

  return NextResponse.json({
    ok: true,
    status: "valid",
    client: {
      id: result.client.id,
      businessName: result.client.businessName,
      contactPerson: result.client.contactPerson,
    },
    token: {
      expiresAt: result.token.expiresAt,
    },
  });
}
