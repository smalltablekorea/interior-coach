import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyClients, agencyMonthlyReports } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, err, serverError } from "@/lib/api/response";
import { generateAndStoreReport } from "@/lib/agency/reports";

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

    const rows = await db
      .select()
      .from(agencyMonthlyReports)
      .where(eq(agencyMonthlyReports.clientId, clientId))
      .orderBy(desc(agencyMonthlyReports.yearMonth));

    return ok({ items: rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id: clientId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const yearMonth = body.yearMonth as string | undefined;
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return err("yearMonth가 YYYY-MM 형식으로 필요합니다");
    }

    const [client] = await db
      .select()
      .from(agencyClients)
      .where(
        and(
          eq(agencyClients.id, clientId),
          eq(agencyClients.operatorWorkspaceId, auth.workspaceId),
        ),
      )
      .limit(1);
    if (!client) return notFound("클라이언트를 찾을 수 없습니다");

    const { report, stats } = await generateAndStoreReport(client, yearMonth);
    return ok({ report, stats });
  } catch (error) {
    return serverError(error);
  }
}
