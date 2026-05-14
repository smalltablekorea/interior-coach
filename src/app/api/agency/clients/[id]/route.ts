import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyClients,
  agencyClientPortalTokens,
  agencyBrandAssets,
} from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, err, serverError } from "@/lib/api/response";
import { buildPortalUploadUrl } from "@/lib/agency/portal-url";

const PATCH_FIELDS = [
  "businessName",
  "contactPerson",
  "contactPhone",
  "contactEmail",
  "brandTone",
  "targetAudience",
  "categories",
  "region",
  "naverBlogUrl",
  "threadsHandle",
  "instagramBusinessId",
  "monthlyPrice",
  "linkedWorkspaceId",
  "status",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const [client] = await db
      .select()
      .from(agencyClients)
      .where(
        and(
          eq(agencyClients.id, id),
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
          eq(agencyClientPortalTokens.clientId, id),
          eq(agencyClientPortalTokens.status, "active"),
        ),
      )
      .orderBy(desc(agencyClientPortalTokens.createdAt))
      .limit(1);

    const brandAssets = await db
      .select()
      .from(agencyBrandAssets)
      .where(eq(agencyBrandAssets.clientId, id))
      .orderBy(desc(agencyBrandAssets.uploadedAt));

    const portalUrl = activeToken
      ? buildPortalUploadUrl(request.headers, activeToken.token)
      : null;

    return ok({ client, activeToken, portalUrl, brandAssets });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = await request.json();

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of PATCH_FIELDS) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 1) {
      return err("수정할 필드가 없습니다");
    }

    const [updated] = await db
      .update(agencyClients)
      .set(updates)
      .where(
        and(
          eq(agencyClients.id, id),
          eq(agencyClients.operatorWorkspaceId, auth.workspaceId),
        ),
      )
      .returning();

    if (!updated) return notFound("클라이언트를 찾을 수 없습니다");
    return ok({ client: updated });
  } catch (error) {
    return serverError(error);
  }
}
