import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { billingRecords, subscriptions, webhookDeliveries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/billing/webhook
 * Toss Payments 웹훅 처리
 * 결제 상태 변경 시 호출됨
 */
export async function POST(request: NextRequest) {
  let webhookDeliveryId: string | null = null;

  try {
    const rawBody = await request.text();

    // Toss 웹훅 시크릿 HMAC-SHA256 검증
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Toss Webhook] TOSS_WEBHOOK_SECRET 환경변수가 설정되지 않았습니다.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const signature = request.headers.get("toss-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { eventType, data } = body;

    // Toss Event ID 추출 (idempotency를 위해)
    const tossEventId = data.id || data.paymentKey || data.orderId || null;

    // 이미 처리된 webhook인지 확인 (idempotency)
    if (tossEventId) {
      const [existingWebhook] = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.tossEventId, tossEventId))
        .limit(1);

      if (existingWebhook && existingWebhook.status === "processed") {
        console.log(`[Toss Webhook] Duplicate webhook ignored: ${tossEventId}`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }
    }

    // webhook delivery 레코드 생성 (audit trail)
    const [deliveryRecord] = await db
      .insert(webhookDeliveries)
      .values({
        tossEventId,
        webhookName: "toss_payment",
        eventType,
        status: "pending",
        receiptSignature: signature,
        payload: body,
        processAttempt: 1,
      })
      .returning({ id: webhookDeliveries.id });

    webhookDeliveryId = deliveryRecord.id;

    // 이벤트 처리
    try {
      switch (eventType) {
        case "BILLING.PAYMENT.DONE": {
          // 자동결제 성공
          const { orderId, paymentKey, approvedAt } = data;

          await db
            .update(billingRecords)
            .set({
              status: "paid",
              paymentKey,
              tossResponse: data,
              paidAt: new Date(approvedAt),
              nextRetryAt: null, // 성공시 재시도 스케줄 제거
            })
            .where(eq(billingRecords.orderId, orderId));

          // 해당 레코드에서 userId 가져와서 알림 생성
          const [record] = await db
            .select({ userId: billingRecords.userId, amount: billingRecords.amount, plan: billingRecords.plan })
            .from(billingRecords)
            .where(eq(billingRecords.orderId, orderId))
            .limit(1);

          if (record) {
            await createNotification({
              userId: record.userId,
              type: "system",
              title: "결제 완료",
              message: `${record.plan} 플랜 결제가 완료되었습니다 (₩${record.amount.toLocaleString()})`,
              link: "/settings/billing",
            });
          }
          break;
        }

        case "BILLING.PAYMENT.FAILED": {
          // 자동결제 실패 (webhook에서는 재시도 스케줄링 하지 않음, 이미 billing.ts에서 처리됨)
          const { orderId, code, message } = data;

          await db
            .update(billingRecords)
            .set({
              status: "failed",
              failReason: `${code}: ${message}`,
              tossResponse: data,
            })
            .where(eq(billingRecords.orderId, orderId));

          const [record] = await db
            .select({ userId: billingRecords.userId, subscriptionId: billingRecords.subscriptionId })
            .from(billingRecords)
            .where(eq(billingRecords.orderId, orderId))
            .limit(1);

          if (record) {
            await createNotification({
              userId: record.userId,
              type: "payment_overdue",
              title: "결제 실패",
              message: `자동 결제가 실패했습니다. 결제 수단을 확인해주세요. (${message})`,
              link: "/settings/billing",
            });

            // 구독 상태를 past_due로 변경
            if (record.subscriptionId) {
              await db
                .update(subscriptions)
                .set({ status: "past_due", updatedAt: new Date() })
                .where(eq(subscriptions.id, record.subscriptionId));
            }
          }
          break;
        }

        case "PAYMENT.CANCELED": {
          // 결제 취소/환불
          const { orderId, paymentKey } = data;

          await db
            .update(billingRecords)
            .set({
              status: "refunded",
              tossResponse: data,
              nextRetryAt: null, // 환불시 재시도 스케줄 제거
            })
            .where(eq(billingRecords.orderId, orderId));

          const [record] = await db
            .select({ userId: billingRecords.userId })
            .from(billingRecords)
            .where(eq(billingRecords.orderId, orderId))
            .limit(1);

          if (record) {
            await createNotification({
              userId: record.userId,
              type: "system",
              title: "결제 취소",
              message: `결제가 취소되었습니다 (결제키: ${paymentKey})`,
              link: "/settings/billing",
            });
          }
          break;
        }

        default:
          console.log(`[Toss Webhook] Unhandled event: ${eventType}`);
      }

      // 웹훅 처리 성공
      if (webhookDeliveryId) {
        await db
          .update(webhookDeliveries)
          .set({
            status: "processed",
            processedAt: new Date(),
          })
          .where(eq(webhookDeliveries.id, webhookDeliveryId));
      }

      return NextResponse.json({ success: true });
    } catch (processingError) {
      // 웹훅 처리 실패
      if (webhookDeliveryId) {
        await db
          .update(webhookDeliveries)
          .set({
            status: "failed",
            errorMessage: processingError instanceof Error ? processingError.message : "Unknown processing error",
          })
          .where(eq(webhookDeliveries.id, webhookDeliveryId));
      }
      throw processingError; // 상위 catch로 전달
    }
  } catch (error) {
    console.error("[Toss Webhook] Error:", error);

    // 최상위 에러인 경우 (시그니처 검증 실패 등)
    if (webhookDeliveryId) {
      try {
        await db
          .update(webhookDeliveries)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(webhookDeliveries.id, webhookDeliveryId));
      } catch (updateError) {
        console.error("[Toss Webhook] Failed to update webhook delivery status:", updateError);
      }
    }

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
