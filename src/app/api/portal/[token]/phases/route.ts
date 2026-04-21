import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validatePortalToken } from "@/lib/portal-auth";
import { constructionPhases } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

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

  const phases = await db
    .select({
      id: constructionPhases.id,
      category: constructionPhases.category,
      plannedStart: constructionPhases.plannedStart,
      plannedEnd: constructionPhases.plannedEnd,
      actualStart: constructionPhases.actualStart,
      actualEnd: constructionPhases.actualEnd,
      progress: constructionPhases.progress,
      status: constructionPhases.status,
      sortOrder: constructionPhases.sortOrder,
      memo: constructionPhases.memo,
    })
    .from(constructionPhases)
    .where(eq(constructionPhases.siteId, result.site.id))
    .orderBy(asc(constructionPhases.sortOrder));

  return NextResponse.json({ phases });
}
