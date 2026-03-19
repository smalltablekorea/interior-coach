import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      memo: customers.memo,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .orderBy(sql`${customers.createdAt} DESC`);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, email, address, memo } = body;

  const [row] = await db
    .insert(customers)
    .values({
      userId: "system", // TODO: get from session
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      memo: memo || null,
    })
    .returning();

  return NextResponse.json(row);
}
