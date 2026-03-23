import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { siteId, category, description, amount, date, paymentMethod, vendor, receiptUrl } = body;

  const [row] = await db
    .update(expenses)
    .set({
      siteId: siteId || null,
      category,
      description: description || null,
      amount,
      date: date || null,
      paymentMethod: paymentMethod || null,
      vendor: vendor || null,
      receiptUrl: receiptUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "지출을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await db.delete(expenses).where(eq(expenses.id, id));
  return NextResponse.json({ success: true });
}
