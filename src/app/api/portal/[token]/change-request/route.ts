import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validatePortalToken } from "@/lib/portal-auth";
import { changeRequests } from "@/lib/db/schema";

export async function POST(
  request: Request,
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

  const body = await request.json();
  const { category, title, description } = body;

  if (!category || !title) {
    return NextResponse.json(
      { error: "카테고리와 제목은 필수입니다." },
      { status: 400 }
    );
  }

  const validCategories = [
    "design_change",
    "material_change",
    "schedule_change",
    "defect_report",
    "other",
  ];

  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: "유효하지 않은 카테고리입니다." },
      { status: 400 }
    );
  }

  const [newRequest] = await db
    .insert(changeRequests)
    .values({
      siteId: result.site.id,
      workspaceId: result.workspaceId,
      tokenId: result.tokenId,
      customerName: result.customer.name,
      category,
      title,
      description: description || null,
      status: "pending",
    })
    .returning();

  return NextResponse.json({ changeRequest: newRequest });
}
