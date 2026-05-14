import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { eq, desc, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyClients, agencyClientPortalTokens } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { buildPortalUploadUrl } from "@/lib/agency/portal-url";
import { sendPortalLink } from "@/lib/agency/alimtalk";

/** 약정 시작일 + 개월수 → 종료일(=토큰 만료일) */
function calcContractEnd(start: Date, months: number): Date {
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end;
}

export async function GET() {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;

  try {
    const rows = await db
      .select()
      .from(agencyClients)
      .where(
        and(
          eq(agencyClients.operatorWorkspaceId, auth.workspaceId),
          isNull(agencyClients.deletedAt),
        ),
      )
      .orderBy(desc(agencyClients.createdAt));

    return ok({ items: rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      businessName,
      contactPerson,
      contactPhone,
      contactEmail,
      contractStart, // YYYY-MM-DD
      contractMonths = 3,
      monthlyPrice = 300000,
      linkedWorkspaceId,
    } = body;

    if (!businessName || typeof businessName !== "string") {
      return err("업체명(businessName)은 필수입니다");
    }
    if (!contractStart) {
      return err("약정 시작일(contractStart)은 필수입니다");
    }
    const startDate = new Date(contractStart);
    if (isNaN(startDate.getTime())) {
      return err("약정 시작일 형식이 올바르지 않습니다 (YYYY-MM-DD)");
    }
    if (!Number.isInteger(contractMonths) || contractMonths < 1) {
      return err("약정 개월수(contractMonths)는 1 이상 정수여야 합니다");
    }

    const contractEnd = calcContractEnd(startDate, contractMonths);

    const [client] = await db
      .insert(agencyClients)
      .values({
        operatorWorkspaceId: auth.workspaceId,
        linkedWorkspaceId: linkedWorkspaceId || null,
        businessName,
        contactPerson: contactPerson || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        contractStart: contractStart,
        contractMonths,
        monthlyPrice,
      })
      .returning();

    const token = randomBytes(32).toString("hex");
    const [portalToken] = await db
      .insert(agencyClientPortalTokens)
      .values({
        clientId: client.id,
        token,
        status: "active",
        expiresAt: contractEnd,
      })
      .returning();

    const portalUrl = buildPortalUploadUrl(request.headers, token);

    const alimtalkResult = await sendPortalLink({
      businessName: client.businessName,
      contactPhone: client.contactPhone,
      portalUrl,
      contractEndDate: contractEnd,
    });

    return ok({
      client,
      portalToken,
      portalUrl,
      alimtalk: alimtalkResult,
    });
  } catch (error) {
    return serverError(error);
  }
}
