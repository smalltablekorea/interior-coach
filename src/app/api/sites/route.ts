import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, customers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: sites.id,
      name: sites.name,
      address: sites.address,
      buildingType: sites.buildingType,
      areaPyeong: sites.areaPyeong,
      status: sites.status,
      startDate: sites.startDate,
      endDate: sites.endDate,
      customerName: customers.name,
      customerId: sites.customerId,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .leftJoin(customers, eq(sites.customerId, customers.id))
    .orderBy(sql`${sites.createdAt} DESC`);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, customerId, address, buildingType, areaPyeong, status, startDate, endDate, memo } = body;

    const [row] = await db
      .insert(sites)
      .values({
        userId: "system",
        name,
        customerId: customerId || null,
        address: address || null,
        buildingType: buildingType || null,
        areaPyeong: areaPyeong || null,
        status: status || "상담중",
        startDate: startDate || null,
        endDate: endDate || null,
        memo: memo || null,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
