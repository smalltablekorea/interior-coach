import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { billingRecords, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/billing/webhook
 * Toss Payments 웹훅 처리
 * 결제 상태 변경 시 호출됨
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    // Toss 웹훅 시크릿 검증 (선택적)
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("toss-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      // TODO: HMAC 검증 구현 (프로덕션에서 필수)
    }

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
        // 자동결제 실패
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Toss Webhook] Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
