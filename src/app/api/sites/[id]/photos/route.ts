import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sitePhotos, photoComments } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { put } from "@vercel/blob";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: siteId } = await params;
  const { searchParams } = new URL(request.url);
  const phaseFilter = searchParams.get("phase");

  const query = db
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

  const photos = await query;

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

      return {
        ...p,
        thumbnail: p.thumbnailUrl || p.url,
        comments,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: siteId } = await params;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const caption = formData.get("caption") as string | null;
  const category = formData.get("category") as string | null;
  const phase = (formData.get("phase") as string) || "during";
  const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
  const uploadedBy = (formData.get("uploadedBy") as string) || "나";

  if (!file) {
    return NextResponse.json({ error: "파일이 필요합니다" }, { status: 400 });
  }

  const blob = await put(`sites/${siteId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const [row] = await db
    .insert(sitePhotos)
    .values({
      siteId,
      userId: "system",
      url: blob.url,
      thumbnailUrl: blob.url,
      date,
      category: category || null,
      phase,
      caption: caption || file.name,
      uploadedBy,
    })
    .returning();

  return NextResponse.json({ ...row, thumbnail: row.thumbnailUrl || row.url, comments: [] }, { status: 201 });
}
