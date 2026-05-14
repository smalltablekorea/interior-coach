import { NextRequest } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyAlerts, agencyClients } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, serverError } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { alertId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string | undefined;

    // 운영자 workspace 소속 클라이언트 ID 화이트리스트
    const clients = await db
      .select({ id: agencyClients.id })
      .from(agencyClients)
      .where(eq(agencyClients.operatorWorkspaceId, auth.workspaceId));
    const clientIds = clients.map((c) => c.id);

    const [alert] = await db
      .select()
      .from(agencyAlerts)
      .where(
        and(
          eq(agencyAlerts.id, alertId),
          clientIds.length > 0 ? inArray(agencyAlerts.clientId, clientIds) : undefined,
        ),
      )
      .limit(1);
    if (!alert) return notFound("알림을 찾을 수 없습니다");

    let updated;
    if (action === "reopen") {
      [updated] = await db
        .update(agencyAlerts)
        .set({ resolvedAt: null, resolvedBy: null })
        .where(eq(agencyAlerts.id, alertId))
        .returning();
    } else {
      // default = resolve
      [updated] = await db
        .update(agencyAlerts)
        .set({ resolvedAt: new Date(), resolvedBy: auth.userId })
        .where(eq(agencyAlerts.id, alertId))
        .returning();
    }

    return ok({ alert: updated });
  } catch (error) {
    return serverError(error);
  }
}
