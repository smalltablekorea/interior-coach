import { NextRequest } from "next/server";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyAlerts, agencyClients } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const onlyUnresolved = searchParams.get("unresolved") === "true";
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

    // 운영자 workspace 소속 클라이언트 ID들
    const clients = await db
      .select({ id: agencyClients.id, businessName: agencyClients.businessName })
      .from(agencyClients)
      .where(eq(agencyClients.operatorWorkspaceId, auth.workspaceId));
    const clientIds = clients.map((c) => c.id);
    const businessNameById = new Map(clients.map((c) => [c.id, c.businessName]));

    if (clientIds.length === 0) {
      return ok({ items: [], unresolvedCount: 0 });
    }

    const conditions = [inArray(agencyAlerts.clientId, clientIds)];
    if (onlyUnresolved) conditions.push(isNull(agencyAlerts.resolvedAt));

    const rows = await db
      .select()
      .from(agencyAlerts)
      .where(and(...conditions))
      .orderBy(desc(agencyAlerts.createdAt))
      .limit(limit);

    const items = rows.map((r) => ({
      ...r,
      businessName: r.clientId ? businessNameById.get(r.clientId) ?? null : null,
    }));

    const unresolvedCount = items.filter((r) => !r.resolvedAt).length;

    return ok({ items, unresolvedCount });
  } catch (error) {
    return serverError(error);
  }
}
