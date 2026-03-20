import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  const query = db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      memo: customers.memo,
      status: customers.status,
      referredBy: customers.referredBy,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .orderBy(sql`${customers.createdAt} DESC`);

  const rows = statusFilter
    ? await query.where(eq(customers.status, statusFilter))
    : await query;

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, email, address, memo, status } = body;

  const [row] = await db
    .insert(customers)
    .values({
      userId: "system",
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      memo: memo || null,
      status: status || "상담중",
    })
    .returning();

  return NextResponse.json(row);
}
