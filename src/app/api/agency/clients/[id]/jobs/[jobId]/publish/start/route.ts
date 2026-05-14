import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyClients } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, err, serverError } from "@/lib/api/response";
import { startNaverPublish, PublishError } from "@/lib/agency/publish";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id: clientId, jobId } = await params;

  try {
    const [client] = await db
      .select({ id: agencyClients.id })
      .from(agencyClients)
      .where(
        and(
          eq(agencyClients.id, clientId),
          eq(agencyClients.operatorWorkspaceId, auth.workspaceId),
        ),
      )
      .limit(1);
    if (!client) return notFound("클라이언트를 찾을 수 없습니다");

    const result = await startNaverPublish({ clientId, jobId });
    return ok(result);
  } catch (e) {
    if (e instanceof PublishError) return err(e.message, e.status);
    return serverError(e);
  }
}
