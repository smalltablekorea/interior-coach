import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingCampaigns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    let rows;
    if (channel) {
      rows = await db
        .select()
        .from(marketingCampaigns)
        .where(eq(marketingCampaigns.channel, channel))
        .orderBy(desc(marketingCampaigns.createdAt));
    } else {
      rows = await db
        .select()
        .from(marketingCampaigns)
        .orderBy(desc(marketingCampaigns.createdAt));
    }

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "캠페인 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      channel,
      name,
      startDate,
      endDate,
      budget,
      spent,
      inquiries,
      contracts,
      contractAmount,
    } = body;

    const [row] = await db
      .insert(marketingCampaigns)
      .values({
        userId: "system",
        channel,
        name,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: budget || 0,
        spent: spent || 0,
        inquiries: inquiries || 0,
        contracts: contracts || 0,
        contractAmount: contractAmount || 0,
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "캠페인 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
