import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyClients, agencyContentJobs } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, serverError } from "@/lib/api/response";

export async function GET(
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

    const jobs = await db
      .select()
      .from(agencyContentJobs)
      .where(eq(agencyContentJobs.clientId, clientId))
      .orderBy(desc(agencyContentJobs.createdAt));

    return ok({ items: jobs });
  } catch (error) {
    return serverError(error);
  }
}
