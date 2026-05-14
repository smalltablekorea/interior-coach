import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyContentJobs, agencyContentDrafts } from "@/lib/db/schema";
import { verifyPortalToken } from "@/lib/agency/portal-token";

/**
 * 클라이언트 포털 — 본인 클라이언트에 속한 잡 + draft 조회 (토큰 인증).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; jobId: string }> },
) {
  const { token, jobId } = await params;
  const verified = await verifyPortalToken(token);
  if (!verified.ok) {
    const statusCode = verified.status === "not_found" ? 404 : verified.status === "expired" ? 410 : 403;
    return NextResponse.json({ ok: false, status: verified.status }, { status: statusCode });
  }

  const [job] = await db
    .select()
    .from(agencyContentJobs)
    .where(
      and(
        eq(agencyContentJobs.id, jobId),
        eq(agencyContentJobs.clientId, verified.client.id),
      ),
    )
    .limit(1);
  if (!job) return NextResponse.json({ ok: false, error: "잡을 찾을 수 없습니다" }, { status: 404 });

  const [draft] = await db
    .select()
    .from(agencyContentDrafts)
    .where(eq(agencyContentDrafts.jobId, jobId))
    .limit(1);

  return NextResponse.json({
    ok: true,
    job,
    draft: draft ?? null,
    client: {
      id: verified.client.id,
      businessName: verified.client.businessName,
    },
  });
}
