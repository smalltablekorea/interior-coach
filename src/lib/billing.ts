// ─── 구독 결제 관리 유틸리티 ───

import { db } from "@/lib/db";
import { subscriptions, billingRecords } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { executeBillingPayment, generateOrderId } from "@/lib/toss";
import { type PlanId, PLANS } from "@/lib/plans";

/** 만료된 구독 자동 갱신 (CRON 용) */
export async function processRenewals() {
  const now = new Date();

  // 만료된 active 구독 조회
  const expiredSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.currentPeriodEnd, now)
      )
    );

  const results = [];

  for (const sub of expiredSubs) {
    // free 플랜이거나 빌링키 없으면 스킵
    if (sub.plan === "free" || !sub.tossBillingKey || !sub.tossCustomerKey) {
      continue;
    }

    // 해지 예약된 구독이면 free로 다운그레이드
    if (sub.canceledAt) {
      await db
        .update(subscriptions)
        .set({
          plan: "free",
          status: "active",
          canceledAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      results.push({ userId: sub.userId, action: "downgraded_to_free" });
      continue;
    }

    // 자동 결제 실행
    const planConfig = PLANS[sub.plan as PlanId];
    const amount =
      sub.billingCycle === "yearly"
        ? planConfig.yearlyMonthlyPrice * 12
        : planConfig.monthlyPrice;

    const orderId = generateOrderId(sub.userId);
    const orderName = `인테리어코치 ${planConfig.nameKo} 자동갱신`;

    // pending 레코드 생성
    const [record] = await db
      .insert(billingRecords)
      .values({
        userId: sub.userId,
        subscriptionId: sub.id,
        orderId,
        plan: sub.plan,
        billingCycle: sub.billingCycle || "monthly",
        amount,
        status: "pending",
      })
      .returning();

    const result = await executeBillingPayment({
      billingKey: sub.tossBillingKey,
      customerKey: sub.tossCustomerKey,
      orderId,
      orderName,
      amount,
    });

    if (result.ok) {
      const periodEnd = new Date(now);
      if (sub.billingCycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await db
        .update(billingRecords)
        .set({
          status: "paid",
          paymentKey: result.data.paymentKey,
          tossResponse: result.data,
          paidAt: new Date(result.data.approvedAt),
        })
        .where(eq(billingRecords.id, record.id));

      await db
        .update(subscriptions)
        .set({
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      results.push({ userId: sub.userId, action: "renewed", amount });
    } else {
      await db
        .update(billingRecords)
        .set({
          status: "failed",
          failReason: result.error.message,
          tossResponse: result.error,
        })
        .where(eq(billingRecords.id, record.id));

      // 첫 실패 시 past_due, 이후 재시도는 CRON에서 처리
      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: now })
        .where(eq(subscriptions.id, sub.id));

      results.push({ userId: sub.userId, action: "failed", error: result.error.message });
    }
  }

  return results;
}
