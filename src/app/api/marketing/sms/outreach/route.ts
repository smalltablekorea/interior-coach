import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsOutreachLog, smsLeads } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  try {
    const leadId = request.nextUrl.searchParams.get("leadId");
    const campaignId = request.nextUrl.searchParams.get("campaignId");
    const status = request.nextUrl.searchParams.get("status");

    const conditions = [workspaceFilter(smsOutreachLog.workspaceId, smsOutreachLog.userId, auth.workspaceId, auth.userId)];
    if (leadId) conditions.push(eq(smsOutreachLog.leadId, leadId));
    if (campaignId) conditions.push(eq(smsOutreachLog.campaignId, campaignId));
    if (status) conditions.push(eq(smsOutreachLog.status, status));

    const rows = await db
      .select()
      .from(smsOutreachLog)
      .where(and(...conditions))
      .orderBy(desc(smsOutreachLog.createdAt))
      .limit(100);

    // Delivery stats (scoped to workspace)
    const stats = await db
      .select({
        status: smsOutreachLog.status,
        count: sql<number>`count(*)::int`,
      })
      .from(smsOutreachLog)
      .where(workspaceFilter(smsOutreachLog.workspaceId, smsOutreachLog.userId, auth.workspaceId, auth.userId))
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
  const auth = await requireWorkspaceAuth("marketing", "write");
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
        workspaceId: auth.workspaceId,
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
        .where(and(eq(smsLeads.id, leadId), workspaceFilter(smsLeads.workspaceId, smsLeads.userId, auth.workspaceId, auth.userId)));
    }

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}
