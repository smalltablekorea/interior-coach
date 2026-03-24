import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, notFound, serverError } from "@/lib/api/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { siteId, category, description, amount, date, paymentMethod, vendor, receiptUrl } = body;

  try {
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
      .where(and(eq(expenses.id, id), eq(expenses.userId, auth.userId), isNull(expenses.deletedAt)))
      .returning();

    if (!row) return notFound("지출을 찾을 수 없습니다");
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [row] = await db
    .update(expenses)
    .set({ deletedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.userId, auth.userId), isNull(expenses.deletedAt)))
    .returning({ id: expenses.id });

  if (!row) return notFound("지출을 찾을 수 없습니다");
  return ok({ id: row.id });
}
