import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communicationLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await params;

  const logs = await db
    .select({
      id: communicationLogs.id,
      date: communicationLogs.date,
      type: communicationLogs.type,
      content: communicationLogs.content,
      staffName: communicationLogs.staffName,
      createdAt: communicationLogs.createdAt,
    })
    .from(communicationLogs)
    .where(eq(communicationLogs.customerId, customerId))
    .orderBy(desc(communicationLogs.date));

  return NextResponse.json(logs);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await params;
  const body = await request.json();
  const { date, type, content, staffName } = body;

  if (!type || !date) {
    return NextResponse.json({ error: "날짜와 유형은 필수입니다" }, { status: 400 });
  }

  const [row] = await db
    .insert(communicationLogs)
    .values({
      customerId,
      userId: "system",
      date,
      type,
      content: content || null,
      staffName: staffName || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
