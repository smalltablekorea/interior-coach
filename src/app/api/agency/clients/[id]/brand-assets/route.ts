import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencyClients, agencyBrandAssets } from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, err, notFound, serverError } from "@/lib/api/response";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const ALLOWED_ASSET_TYPES = new Set(["past_work", "style_ref", "logo", "other"]);

export async function POST(
  request: NextRequest,
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string) || null;
    const assetType = (formData.get("type") as string) || "past_work";

    if (!file) return err("파일이 필요합니다");
    if (!ALLOWED_ASSET_TYPES.has(assetType)) return err(`type은 ${[...ALLOWED_ASSET_TYPES].join("/")} 중 하나여야 합니다`);
    if (file.size > MAX_SIZE) return err("파일은 10MB 이하만 가능합니다");
    if (!ALLOWED_TYPES.has(file.type)) return err("지원하지 않는 이미지 형식입니다");

    const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
    const path = `agency/${clientId}/brand-assets/${Date.now()}-${safeName}`;
    const blob = await put(path, file, { access: "public" });

    const [asset] = await db
      .insert(agencyBrandAssets)
      .values({
        clientId,
        type: assetType,
        imageUrl: blob.url,
        caption,
      })
      .returning();

    return ok({ asset });
  } catch (error) {
    return serverError(error);
  }
}
