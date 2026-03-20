import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { smsContent } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const templateType = request.nextUrl.searchParams.get("templateType");

    const rows = templateType
      ? await db
          .select()
          .from(smsContent)
          .where(eq(smsContent.templateType, templateType))
          .orderBy(desc(smsContent.createdAt))
      : await db
          .select()
          .from(smsContent)
          .orderBy(desc(smsContent.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "템플릿 목록 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, channel, templateType, subject, body: msgBody, variables } = body;

    if (!name || !templateType || !msgBody) {
      return NextResponse.json(
        { error: "이름, 유형, 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(smsContent)
      .values({
        userId: "system",
        name,
        channel: channel || "sms",
        templateType,
        subject,
        body: msgBody,
        variables,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "템플릿 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const [row] = await db
      .update(smsContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsContent.id, id))
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "템플릿 수정 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await db.delete(smsContent).where(eq(smsContent.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "템플릿 삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
