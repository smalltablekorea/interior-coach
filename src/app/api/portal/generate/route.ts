import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerPortalTokens } from "@/lib/db/schema";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const { customerId } = await request.json();

  if (!customerId) {
    return NextResponse.json({ error: "customerId가 필요합니다" }, { status: 400 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30일 유효

  const [row] = await db
    .insert(customerPortalTokens)
    .values({
      customerId,
      token,
      expiresAt,
    })
    .returning();

  return NextResponse.json({
    token: row.token,
    expiresAt: row.expiresAt,
    url: `/portal/${row.token}`,
  });
}
