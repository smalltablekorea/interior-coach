import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyClients } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, serverError } from "@/lib/api/response";
import { runGenerationPipeline } from "@/lib/agency/generate-pipeline";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id: clientId } = await params;

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

    const results = await runGenerationPipeline(clientId);
    return ok({ results });
  } catch (error) {
    return serverError(error);
  }
}
