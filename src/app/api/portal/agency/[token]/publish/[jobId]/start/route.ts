import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/agency/portal-token";
import { startNaverPublish, PublishError } from "@/lib/agency/publish";

/**
 * 클라이언트 포털 — 네이버 발행 시작 (토큰 인증).
 *
 * 운영자 API와 동일 헬퍼(startNaverPublish) 호출.
 * 단 jobId가 토큰의 clientId에 속하는지 검증.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; jobId: string }> },
) {
  const { token, jobId } = await params;
  const verified = await verifyPortalToken(token);
  if (!verified.ok) {
    const statusCode = verified.status === "not_found" ? 404 : verified.status === "expired" ? 410 : 403;
    return NextResponse.json({ ok: false, status: verified.status }, { status: statusCode });
  }

  try {
    const result = await startNaverPublish({ clientId: verified.client.id, jobId });
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
