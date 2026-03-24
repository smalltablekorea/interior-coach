import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sitePhotos, photoComments, sites } from "@/lib/db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, notFound, serverError } from "@/lib/api/response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id: siteId } = await params;

  // 현장 소유권 확인
  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, auth.userId), isNull(sites.deletedAt)));

  if (!site) return notFound("현장을 찾을 수 없습니다");

  const { searchParams } = new URL(request.url);
  const phaseFilter = searchParams.get("phase");

  try {
    const photos = await db
      .select({
        id: sitePhotos.id,
        url: sitePhotos.url,
        thumbnailUrl: sitePhotos.thumbnailUrl,
        date: sitePhotos.date,
        category: sitePhotos.category,
        phase: sitePhotos.phase,
        caption: sitePhotos.caption,
        uploadedBy: sitePhotos.uploadedBy,
        createdAt: sitePhotos.createdAt,
      })
      .from(sitePhotos)
      .where(
        phaseFilter
          ? sql`${sitePhotos.siteId} = ${siteId} AND ${sitePhotos.phase} = ${phaseFilter}`
          : eq(sitePhotos.siteId, siteId)
      )
      .orderBy(desc(sitePhotos.date), desc(sitePhotos.createdAt));

    const result = await Promise.all(
      photos.map(async (p) => {
        const comments = await db
          .select({
            id: photoComments.id,
            author: photoComments.authorName,
            text: photoComments.text,
            createdAt: photoComments.createdAt,
          })
          .from(photoComments)
          .where(eq(photoComments.photoId, p.id))
          .orderBy(photoComments.createdAt);

        return { ...p, thumbnail: p.thumbnailUrl || p.url, comments };
      })
    );

    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id: siteId } = await params;

  // 현장 소유권 확인
  const [site] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, auth.userId), isNull(sites.deletedAt)));

  if (!site) return notFound("현장을 찾을 수 없습니다");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;
    const category = formData.get("category") as string | null;
    const phase = (formData.get("phase") as string) || "during";
    const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
    const uploadedBy = (formData.get("uploadedBy") as string) || "나";

    if (!file) return err("파일이 필요합니다");

    const blob = await put(`sites/${siteId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const [row] = await db
      .insert(sitePhotos)
      .values({
        siteId,
        userId: auth.userId,
        url: blob.url,
        thumbnailUrl: blob.url,
        date,
        category: category || null,
        phase,
        caption: caption || file.name,
        uploadedBy,
      })
      .returning();

    return ok({ ...row, thumbnail: row.thumbnailUrl || row.url, comments: [] });
  } catch (error) {
    return serverError(error);
  }
}
