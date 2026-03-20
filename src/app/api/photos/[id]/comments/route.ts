import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photoComments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: photoId } = await params;
  const body = await request.json();
  const { authorName, text } = body;

  if (!text) {
    return NextResponse.json({ error: "댓글 내용이 필요합니다" }, { status: 400 });
  }

  const [row] = await db
    .insert(photoComments)
    .values({
      photoId,
      userId: "system",
      authorName: authorName || "나",
      text,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
