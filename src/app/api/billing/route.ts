import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, billingRecords } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { cancelPayment } from "@/lib/toss";

/**
 * GET /api/billing
 * 결제 내역 조회
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const records = await db
      .select({
        id: billingRecords.id,
        orderId: billingRecords.orderId,
        plan: billingRecords.plan,
        billingCycle: billingRecords.billingCycle,
        amount: billingRecords.amount,
        status: billingRecords.status,
        failReason: billingRecords.failReason,
        paidAt: billingRecords.paidAt,
        createdAt: billingRecords.createdAt,
      })
      .from(billingRecords)
      .where(eq(billingRecords.userId, auth.userId))
      .orderBy(desc(billingRecords.createdAt))
      .limit(50);

    // 현재 구독 + 카드 정보
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId))
      .limit(1);

    return ok({
      subscription: sub
        ? {
            plan: sub.plan,
            billingCycle: sub.billingCycle,
            status: sub.status,
            hasCard: !!sub.tossBillingKey,
            currentPeriodEnd: sub.currentPeriodEnd,
            canceledAt: sub.canceledAt,
          }
        : null,
      records,
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * PUT /api/billing
 * 구독 해지 (기간 만료 시 free 다운그레이드 예약)
 */
export async function PUT() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId))
      .limit(1);

    if (!sub) return err("구독 정보를 찾을 수 없습니다");

    if (sub.plan === "free") {
      return err("이미 무료 플랜입니다");
    }

    if (sub.canceledAt) {
      return err("이미 해지가 예약되어 있습니다");
    }

    // 해지 예약 (즉시 해지가 아닌 기간 만료 시 다운그레이드)
    await db
      .update(subscriptions)
      .set({
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    return ok({
      message: "구독 해지가 예약되었습니다",
      canceledAt: new Date().toISOString(),
      activeUntil: sub.currentPeriodEnd?.toISOString(),
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * DELETE /api/billing
 * 특정 결제 환불 요청
 * body: { recordId: string, reason?: string }
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { recordId, reason } = await request.json();

    if (!recordId) return err("recordId가 필요합니다");

    const [record] = await db
      .select()
      .from(billingRecords)
      .where(eq(billingRecords.id, recordId))
      .limit(1);

    if (!record || record.userId !== auth.userId) {
      return err("결제 내역을 찾을 수 없습니다", 404);
    }

    if (record.status !== "paid") {
      return err("환불 가능한 결제가 아닙니다");
    }

    if (!record.paymentKey) {
      return err("결제 키가 없어 환불할 수 없습니다");
    }

    // Toss 환불 요청
    const result = await cancelPayment({
      paymentKey: record.paymentKey,
      cancelReason: reason || "고객 요청에 의한 환불",
    });

    if (!result.ok) {
      return err(`환불 실패: ${result.error.message}`);
    }

    // 결제 기록 업데이트
    await db
      .update(billingRecords)
      .set({
        status: "refunded",
        tossResponse: result.data,
      })
      .where(eq(billingRecords.id, record.id));

    // 구독을 free로 다운그레이드
    if (record.subscriptionId) {
      await db
        .update(subscriptions)
        .set({
          plan: "free",
          status: "active",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          canceledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, record.subscriptionId));
    }

    return ok({ message: "환불이 완료되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}
