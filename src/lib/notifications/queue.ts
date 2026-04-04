import { db } from "@/lib/db";
import {
  notificationQueue, notificationSettings, notificationLogs,
  notifications, workspaceMembers,
} from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { renderTemplate, renderSmsMessage, type NotificationEventType } from "@/lib/notifications/templates";
import { sendSms, rateLimitDelay } from "@/lib/solapi";

const MAX_RETRY = 3;
const BATCH_SIZE = 50;

/** 알림 큐에 이벤트 추가 */
export async function enqueueNotification(
  workspaceId: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  await db.insert(notificationQueue).values({
    workspaceId,
    eventType,
    eventPayload: payload,
  });
}

/** 미처리 큐 아이템을 처리 */
export async function processQueue(): Promise<{
  processed: number;
  failed: number;
  skipped: number;
}> {
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  // 미처리 + 재시도 3회 미만 + 최대 50건
  const items = await db
    .select()
    .from(notificationQueue)
    .where(and(eq(notificationQueue.processed, false), lte(notificationQueue.retryCount, MAX_RETRY - 1)))
    .orderBy(notificationQueue.createdAt)
    .limit(BATCH_SIZE);

  for (const item of items) {
    try {
      // 피처 플래그 체크
      const enabled = await isFeatureEnabled("notification_auto", item.workspaceId);
      if (!enabled) {
        await markProcessed(item.id, "feature_flag_disabled");
        skipped++;
        continue;
      }

      const payload = (item.eventPayload as Record<string, unknown>) || {};
      const eventType = item.eventType as NotificationEventType;
      const template = renderTemplate(eventType, payload);

      // 워크스페이스 알림 설정 조회
      const [settings] = await db
        .select()
        .from(notificationSettings)
        .where(and(
          eq(notificationSettings.workspaceId, item.workspaceId),
          eq(notificationSettings.eventType, item.eventType),
        ));

      const inAppEnabled = settings?.inAppEnabled ?? true;
      const smsEnabled = settings?.smsEnabled ?? false;
      const smsPhone = settings?.smsRecipientPhone;

      // 인앱 알림: 워크스페이스 전체 멤버에게
      if (inAppEnabled) {
        const members = await db
          .select({ userId: workspaceMembers.userId })
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, item.workspaceId));

        if (members.length > 0) {
          await db.insert(notifications).values(
            members.map((m) => ({
              userId: m.userId,
              workspaceId: item.workspaceId,
              type: eventType,
              title: template.title,
              message: template.message,
              link: template.link,
              metadata: payload,
            })),
          );

          await logDelivery(item, "in_app", members[0].userId, template, "sent");
        }
      }

      // SMS 발송
      if (smsEnabled && smsPhone) {
        const sms = renderSmsMessage(eventType, payload);
        const result = await sendSms(smsPhone, sms.text, sms.isLms);
        await rateLimitDelay(); // 10건/초 제한

        await logDelivery(item, "sms", smsPhone, template,
          result.success ? "sent" : "failed",
          result.error, result.messageId);

        if (!result.success) {
          // SMS 실패 시 재시도
          await db.update(notificationQueue)
            .set({ retryCount: item.retryCount + 1, errorMessage: result.error })
            .where(eq(notificationQueue.id, item.id));

          if (item.retryCount + 1 >= MAX_RETRY) {
            await markProcessed(item.id, `max_retry_reached: ${result.error}`);
          }
          failed++;
          continue;
        }
      }

      await markProcessed(item.id);
      processed++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await db.update(notificationQueue)
        .set({ retryCount: item.retryCount + 1, errorMessage: msg })
        .where(eq(notificationQueue.id, item.id));

      if (item.retryCount + 1 >= MAX_RETRY) {
        await markProcessed(item.id, `exception: ${msg}`);
      }
      failed++;
    }
  }

  return { processed, failed, skipped };
}

async function markProcessed(queueId: string, errorMessage?: string) {
  await db.update(notificationQueue)
    .set({ processed: true, processedAt: new Date(), errorMessage: errorMessage ?? null })
    .where(eq(notificationQueue.id, queueId));
}

async function logDelivery(
  item: { id: string; workspaceId: string; eventType: string },
  channel: string,
  recipient: string,
  template: { title: string; message: string },
  status: string,
  errorMessage?: string,
  solapiMessageId?: string,
) {
  await db.insert(notificationLogs).values({
    workspaceId: item.workspaceId,
    queueId: item.id,
    channel,
    recipient,
    eventType: item.eventType,
    title: template.title,
    message: template.message,
    status,
    errorMessage: errorMessage ?? null,
    solapiMessageId: solapiMessageId ?? null,
  });
}
