import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validatePortalToken } from "@/lib/portal-auth";
import { sitePhotos } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validatePortalToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 토큰입니다." },
      { status: 401 }
    );
  }

  const photos = await db
    .select({
      id: sitePhotos.id,
      url: sitePhotos.url,
      thumbnailUrl: sitePhotos.thumbnailUrl,
      date: sitePhotos.date,
      category: sitePhotos.category,
      phase: sitePhotos.phase,
      caption: sitePhotos.caption,
    })
    .from(sitePhotos)
    .where(eq(sitePhotos.siteId, result.site.id))
    .orderBy(desc(sitePhotos.date));

  // Group by phase
  const grouped = {
    before: photos.filter((p) => p.phase === "before"),
    during: photos.filter((p) => p.phase === "during"),
    after: photos.filter((p) => p.phase === "after"),
  };

  return NextResponse.json({ photos: grouped });
}
