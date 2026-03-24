import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

type NotificationType = "payment_overdue" | "phase_delayed" | "material_needed" | "contract_signed" | "site_completed" | "system";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message ?? null,
      link: params.link ?? null,
      metadata: params.metadata ?? null,
    })
    .returning();

  return row;
}

export async function createBulkNotifications(items: CreateNotificationParams[]) {
  if (items.length === 0) return [];

  return db
    .insert(notifications)
    .values(
      items.map((p) => ({
        userId: p.userId,
        type: p.type,
        title: p.title,
        message: p.message ?? null,
        link: p.link ?? null,
        metadata: p.metadata ?? null,
      }))
    )
    .returning();
}
