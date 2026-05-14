import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyClients, agencyClientPortalTokens } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, err, notFound, serverError } from "@/lib/api/response";
import { buildPortalUploadUrl } from "@/lib/agency/portal-url";
import { sendWeeklyReminder, sendMissingResend } from "@/lib/agency/alimtalk";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id: clientId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const kind = body.kind === "missing" ? "missing" : "weekly"; // weekly | missing

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

    const [activeToken] = await db
      .select()
      .from(agencyClientPortalTokens)
      .where(
        and(
          eq(agencyClientPortalTokens.clientId, clientId),
          eq(agencyClientPortalTokens.status, "active"),
        ),
      )
      .orderBy(desc(agencyClientPortalTokens.createdAt))
      .limit(1);

    if (!activeToken) return err("유효한 포털 토큰이 없습니다");

    const portalUrl = buildPortalUploadUrl(request.headers, activeToken.token);

    const args = {
      businessName: client.businessName,
      contactPhone: client.contactPhone,
      portalUrl,
    };

    const result =
      kind === "missing" ? await sendMissingResend(args) : await sendWeeklyReminder(args);

    return ok({ alimtalk: result });
  } catch (error) {
    return serverError(error);
  }
}
