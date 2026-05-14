import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/agency/portal-token";
import { completeNaverPublish, PublishError } from "@/lib/agency/publish";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; jobId: string }> },
) {
  const { token, jobId } = await params;
  const verified = await verifyPortalToken(token);
  if (!verified.ok) {
    const statusCode = verified.status === "not_found" ? 404 : verified.status === "expired" ? 410 : 403;
    return NextResponse.json({ ok: false, status: verified.status }, { status: statusCode });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const publicationId = body.publicationId as string | undefined;
    const externalPostUrl = (body.externalPostUrl as string | undefined) || null;
    if (!publicationId) {
      return NextResponse.json({ ok: false, error: "publicationId가 필요합니다" }, { status: 400 });
    }

    const result = await completeNaverPublish({
      clientId: verified.client.id,
      jobId,
      publicationId,
      externalPostUrl,
      businessName: verified.client.businessName,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof PublishError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
