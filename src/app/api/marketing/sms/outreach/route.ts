import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { smsOutreachLog, smsLeads } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const leadId = request.nextUrl.searchParams.get("leadId");
    const campaignId = request.nextUrl.searchParams.get("campaignId");
    const status = request.nextUrl.searchParams.get("status");

    const conditions = [];
    if (leadId) conditions.push(eq(smsOutreachLog.leadId, leadId));
    if (campaignId) conditions.push(eq(smsOutreachLog.campaignId, campaignId));
    if (status) conditions.push(eq(smsOutreachLog.status, status));

    const rows = await db
      .select()
      .from(smsOutreachLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(smsOutreachLog.createdAt))
      .limit(100);

    // Delivery stats
    const stats = await db
      .select({
        status: smsOutreachLog.status,
        count: sql<number>`count(*)::int`,
      })
      .from(smsOutreachLog)
      .groupBy(smsOutreachLog.status);

    return NextResponse.json({
      logs: rows,
      stats: Object.fromEntries(stats.map((s) => [s.status, s.count])),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "발송 기록 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, campaignId, channel, templateType, content, recipientPhone, stepIndex } = body;

    if (!content || !recipientPhone) {
      return NextResponse.json(
        { error: "내용과 수신 번호는 필수입니다." },
        { status: 400 }
      );
    }

    // TODO: Solapi API integration
    // For now, simulate sending by marking as "sent"
    const [row] = await db
      .insert(smsOutreachLog)
      .values({
        userId: "system",
        leadId,
        campaignId,
        channel: channel || "sms",
        templateType,
        content,
        recipientPhone,
        status: "sent",
        sentAt: new Date(),
        stepIndex,
      })
      .returning();

    // Update lead's last contacted timestamp
    if (leadId) {
      await db
        .update(smsLeads)
        .set({
          lastContactedAt: new Date(),
          status: "contacted",
          updatedAt: new Date(),
        })
        .where(eq(smsLeads.id, leadId));
    }

    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "메시지 발송 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
