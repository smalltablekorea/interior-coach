import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingInquiries } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let rows;
    if (status) {
      rows = await db
        .select()
        .from(marketingInquiries)
        .where(eq(marketingInquiries.status, status))
        .orderBy(desc(marketingInquiries.createdAt));
    } else {
      rows = await db
        .select()
        .from(marketingInquiries)
        .orderBy(desc(marketingInquiries.createdAt));
    }

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "문의 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, phone, email, channel, content, status } = body;

    const [row] = await db
      .insert(marketingInquiries)
      .values({
        userId: "system",
        customerName,
        phone: phone || null,
        email: email || null,
        channel,
        content: content || null,
        status: status || "신규",
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "문의 등록에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
