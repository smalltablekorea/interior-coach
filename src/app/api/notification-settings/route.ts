import { db } from "@/lib/db";
import { notificationSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

const EVENT_TYPES = [
  "stage_change",
  "photo_upload",
  "defect_report",
  "payment_due",
  "schedule_change",
] as const;

export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const rows = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.workspaceId, auth.workspaceId));

    const settings: Record<string, { inAppEnabled: boolean; smsEnabled: boolean; smsRecipientPhone: string | null }> = {};
    for (const et of EVENT_TYPES) {
      const row = rows.find((r) => r.eventType === et);
      settings[et] = {
        inAppEnabled: row?.inAppEnabled ?? true,
        smsEnabled: row?.smsEnabled ?? false,
        smsRecipientPhone: row?.smsRecipientPhone ?? null,
      };
    }

    return ok(settings);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireWorkspaceAuth("settings", "write");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { eventType, inAppEnabled, smsEnabled, smsRecipientPhone } = body;

    if (!EVENT_TYPES.includes(eventType)) {
      return err("유효하지 않은 이벤트 타입입니다.");
    }

    const existing = await db
      .select()
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.workspaceId, auth.workspaceId),
          eq(notificationSettings.eventType, eventType),
        ),
      );

    if (existing.length > 0) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (inAppEnabled !== undefined) updates.inAppEnabled = inAppEnabled;
      if (smsEnabled !== undefined) updates.smsEnabled = smsEnabled;
      if (smsRecipientPhone !== undefined) updates.smsRecipientPhone = smsRecipientPhone;

      await db
        .update(notificationSettings)
        .set(updates)
        .where(eq(notificationSettings.id, existing[0].id));
    } else {
      await db.insert(notificationSettings).values({
        workspaceId: auth.workspaceId,
        eventType,
        inAppEnabled: inAppEnabled ?? true,
        smsEnabled: smsEnabled ?? false,
        smsRecipientPhone: smsRecipientPhone ?? null,
      });
    }

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
