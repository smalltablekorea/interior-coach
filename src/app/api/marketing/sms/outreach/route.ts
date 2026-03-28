import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsOutreachLog, smsLeads } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const leadId = request.nextUrl.searchParams.get("leadId");
    const campaignId = request.nextUrl.searchParams.get("campaignId");
    const status = request.nextUrl.searchParams.get("status");

    const conditions = [eq(smsOutreachLog.userId, auth.userId)];
    if (leadId) conditions.push(eq(smsOutreachLog.leadId, leadId));
    if (campaignId) conditions.push(eq(smsOutreachLog.campaignId, campaignId));
    if (status) conditions.push(eq(smsOutreachLog.status, status));

    const rows = await db
      .select()
      .from(smsOutreachLog)
      .where(and(...conditions))
      .orderBy(desc(smsOutreachLog.createdAt))
      .limit(100);

    // Delivery stats (scoped to user)
    const stats = await db
      .select({
        status: smsOutreachLog.status,
        count: sql<number>`count(*)::int`,
      })
      .from(smsOutreachLog)
      .where(eq(smsOutreachLog.userId, auth.userId))
      .groupBy(smsOutreachLog.status);

    return ok({
      logs: rows,
      stats: Object.fromEntries(stats.map((s) => [s.status, s.count])),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { leadId, campaignId, channel, templateType, content, recipientPhone, stepIndex } = body;

    if (!content || !recipientPhone) {
      return err("내용과 수신 번호는 필수입니다.");
    }

    // TODO: Solapi API integration
    // For now, simulate sending by marking as "sent"
    const [row] = await db
      .insert(smsOutreachLog)
      .values({
        userId: auth.userId,
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
        .where(and(eq(smsLeads.id, leadId), eq(smsLeads.userId, auth.userId)));
    }

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
