import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { photoComments, sitePhotos, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const { id: photoId } = await params;
    const body = await request.json();
    const { authorName, text } = body;

    if (!text) return err("댓글 내용이 필요합니다");

    // 사진 → 현장 소유권 확인
    const [photo] = await db
      .select({ siteId: sitePhotos.siteId })
      .from(sitePhotos)
      .where(eq(sitePhotos.id, photoId))
      .limit(1);

    if (!photo) return err("사진을 찾을 수 없습니다", 404);

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, photo.siteId), workspaceFilter(sites.workspaceId, sites.userId, wid, uid)))
      .limit(1);

    if (!site) return err("권한이 없습니다", 403);

    const [row] = await db
      .insert(photoComments)
      .values({
        photoId,
        userId: uid,
        authorName: authorName || "나",
        text,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
