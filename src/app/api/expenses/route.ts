import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses, sites } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");

  const query = db
    .select({
      id: expenses.id,
      date: expenses.date,
      category: expenses.category,
      description: expenses.description,
      amount: expenses.amount,
      siteId: expenses.siteId,
      siteName: sites.name,
      paymentMethod: expenses.paymentMethod,
      vendor: expenses.vendor,
      receiptUrl: expenses.receiptUrl,
    })
    .from(expenses)
    .leftJoin(sites, eq(expenses.siteId, sites.id))
    .orderBy(desc(expenses.date));

  const rows = siteId
    ? await query.where(eq(expenses.siteId, siteId))
    : await query;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siteId, category, description, amount, date, paymentMethod, vendor, receiptUrl } = body;
    if (!category || !amount) {
      return NextResponse.json({ error: "category, amount 필수" }, { status: 400 });
    }
    const [row] = await db
      .insert(expenses)
      .values({
        userId: "demo",
        siteId: siteId || null,
        category,
        description: description || null,
        amount,
        date: date || null,
        paymentMethod: paymentMethod || null,
        vendor: vendor || null,
        receiptUrl: receiptUrl || null,
      })
      .returning();
    return NextResponse.json(row);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
