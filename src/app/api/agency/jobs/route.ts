import { NextRequest } from "next/server";
import { eq, and, desc, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyClients,
  agencyContentJobs,
  agencyContentDrafts,
} from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, serverError } from "@/lib/api/response";

/** 운영자 workspace 전체 클라이언트의 잡 목록 — 필터: status, channel, clientId */
export async function GET(request: NextRequest) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const clientIdFilter = searchParams.get("clientId");
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

    const clients = await db
      .select({ id: agencyClients.id, businessName: agencyClients.businessName })
      .from(agencyClients)
      .where(eq(agencyClients.operatorWorkspaceId, auth.workspaceId));
    const clientIds = clients.map((c) => c.id);
    const businessNameById = new Map(clients.map((c) => [c.id, c.businessName]));

    if (clientIds.length === 0) {
      return ok({ items: [], clients: [] });
    }

    const conditions = [inArray(agencyContentJobs.clientId, clientIds)];
    if (status) conditions.push(eq(agencyContentJobs.status, status));
    if (channel) conditions.push(eq(agencyContentJobs.channel, channel));
    if (clientIdFilter && clientIds.includes(clientIdFilter)) {
      conditions.push(eq(agencyContentJobs.clientId, clientIdFilter));
    }

    const rows = await db
      .select({
        id: agencyContentJobs.id,
        clientId: agencyContentJobs.clientId,
        channel: agencyContentJobs.channel,
        status: agencyContentJobs.status,
        generationAttempts: agencyContentJobs.generationAttempts,
        generatedAt: agencyContentJobs.generatedAt,
        createdAt: agencyContentJobs.createdAt,
        qcScore: agencyContentDrafts.qcScore,
      })
      .from(agencyContentJobs)
      .leftJoin(agencyContentDrafts, eq(agencyContentDrafts.jobId, agencyContentJobs.id))
      .where(and(...conditions))
      .orderBy(desc(agencyContentJobs.createdAt))
      .limit(limit);

    const items = rows.map((r) => ({
      ...r,
      businessName: businessNameById.get(r.clientId) ?? null,
    }));

    return ok({
      items,
      clients: clients.map((c) => ({ id: c.id, businessName: c.businessName })),
    });
  } catch (error) {
    return serverError(error);
  }
}
