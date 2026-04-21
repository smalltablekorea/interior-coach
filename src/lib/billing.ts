// ─── 구독 결제 관리 유틸리티 ───

import { db } from "@/lib/db";
import { subscriptions, billingRecords } from "@/lib/db/schema";
import { eq, and, lte, desc, sql } from "drizzle-orm";
import { executeBillingPayment, generateOrderId } from "@/lib/toss";
import { type PlanId, PLANS } from "@/lib/plans";
import { createNotification } from "@/lib/notifications";

/** 결제 재시도 간격 (일) — 1일, 3일, 5일 후 재시도 */
const RETRY_INTERVALS_DAYS = [1, 3, 5];
const MAX_RETRY_COUNT = RETRY_INTERVALS_DAYS.length;

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

/** 결제 실패 재시도 (past_due 구독 대상, 1/3/5일 간격) */
export async function processRetries() {
  const now = new Date();

  // past_due 구독 조회
  const pastDueSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "past_due"));

  const results = [];

  for (const sub of pastDueSubs) {
    if (!sub.tossBillingKey || !sub.tossCustomerKey || sub.plan === "free") {
      continue;
    }

    // 해당 구독의 실패 기록 조회 (최근 순)
    const failedRecords = await db
      .select()
      .from(billingRecords)
      .where(
        and(
          eq(billingRecords.subscriptionId, sub.id),
          eq(billingRecords.status, "failed")
        )
      )
      .orderBy(desc(billingRecords.createdAt));

    const retryCount = failedRecords.length;

    // 최대 재시도 횟수 초과 시 → 구독 해지
    if (retryCount >= MAX_RETRY_COUNT) {
      await db
        .update(subscriptions)
        .set({
          plan: "free",
          status: "active",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      await createNotification({
        userId: sub.userId,
        type: "payment_overdue",
        title: "구독 해지 — 결제 실패",
        message: `${MAX_RETRY_COUNT}회 결제 재시도 후에도 결제가 실패하여 무료 플랜으로 전환되었습니다. 카드를 변경한 후 다시 구독해주세요.`,
        link: "/pricing",
      });

      results.push({ userId: sub.userId, action: "downgraded_max_retry", retryCount });
      continue;
    }

    // 재시도 간격 확인 — 마지막 실패로부터 N일 경과했는지
    const lastFailed = failedRecords[0];
    if (!lastFailed) continue;

    const intervalDays = RETRY_INTERVALS_DAYS[retryCount - 1] ?? RETRY_INTERVALS_DAYS[RETRY_INTERVALS_DAYS.length - 1];
    const retryAfter = new Date(lastFailed.createdAt);
    retryAfter.setDate(retryAfter.getDate() + intervalDays);

    if (now < retryAfter) {
      // 아직 재시도 시간이 안 됨
      results.push({ userId: sub.userId, action: "waiting_retry", nextRetry: retryAfter.toISOString() });
      continue;
    }

    // 재시도 실행
    const planConfig = PLANS[sub.plan as PlanId];
    const amount =
      sub.billingCycle === "yearly"
        ? planConfig.yearlyMonthlyPrice * 12
        : planConfig.monthlyPrice;

    const orderId = generateOrderId(sub.userId);
    const orderName = `인테리어코치 ${planConfig.nameKo} 재결제 (${retryCount + 1}차)`;

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
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "결제 성공",
        message: `재결제가 완료되었습니다 (₩${amount.toLocaleString()}). 서비스가 정상 복구됩니다.`,
        link: "/settings",
      });

      results.push({ userId: sub.userId, action: "retry_success", retryCount: retryCount + 1, amount });
    } else {
      await db
        .update(billingRecords)
        .set({
          status: "failed",
          failReason: result.error.message,
          tossResponse: result.error,
        })
        .where(eq(billingRecords.id, record.id));

      const remaining = MAX_RETRY_COUNT - (retryCount + 1);
      await createNotification({
        userId: sub.userId,
        type: "payment_overdue",
        title: `결제 재시도 실패 (${retryCount + 1}/${MAX_RETRY_COUNT}차)`,
        message: remaining > 0
          ? `결제가 다시 실패했습니다. ${remaining}회 더 재시도 후 무료 플랜으로 전환됩니다. 카드를 확인해주세요.`
          : `마지막 결제 재시도가 실패했습니다. 다음 CRON에서 무료 플랜으로 전환됩니다.`,
        link: "/settings",
      });

      results.push({ userId: sub.userId, action: "retry_failed", retryCount: retryCount + 1 });
    }
  }

  return results;
}

/** 트라이얼 만료 체크 + 알림 */
export async function processTrialExpirations() {
  const now = new Date();
  const results = [];

  // 트라이얼 중인 구독 조회
  const trialSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "trialing"));

  for (const sub of trialSubs) {
    if (!sub.trialEndsAt) continue;

    const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // 3일 전 알림
    if (daysLeft === 3) {
      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "무료 체험 종료 3일 전",
        message: "무료 체험이 3일 후 종료됩니다. 유료 플랜으로 전환하시면 데이터가 유지됩니다.",
        link: "/pricing",
      });
      results.push({ userId: sub.userId, action: "trial_3day_notice" });
    }

    // 만료됨
    if (daysLeft <= 0) {
      if (sub.tossBillingKey) {
        // 카드 등록됨 → 유료 전환 시도
        const planConfig = PLANS[sub.plan as PlanId];
        const amount =
          sub.billingCycle === "yearly"
            ? planConfig.yearlyMonthlyPrice * 12
            : planConfig.monthlyPrice;

        const orderId = generateOrderId(sub.userId);
        const orderName = `인테리어코치 ${planConfig.nameKo} 첫 결제`;

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

        const payResult = await executeBillingPayment({
          billingKey: sub.tossBillingKey,
          customerKey: sub.tossCustomerKey!,
          orderId,
          orderName,
          amount,
        });

        if (payResult.ok) {
          const periodEnd = new Date(now);
          if (sub.billingCycle === "yearly") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          await db.update(billingRecords).set({
            status: "paid",
            paymentKey: payResult.data.paymentKey,
            tossResponse: payResult.data,
            paidAt: new Date(payResult.data.approvedAt),
          }).where(eq(billingRecords.id, record.id));

          await db.update(subscriptions).set({
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            trialEndsAt: null,
            updatedAt: now,
          }).where(eq(subscriptions.id, sub.id));

          results.push({ userId: sub.userId, action: "trial_converted", amount });
        } else {
          await db.update(billingRecords).set({
            status: "failed",
            failReason: payResult.error.message,
            tossResponse: payResult.error,
          }).where(eq(billingRecords.id, record.id));

          await db.update(subscriptions).set({
            status: "past_due",
            updatedAt: now,
          }).where(eq(subscriptions.id, sub.id));

          results.push({ userId: sub.userId, action: "trial_payment_failed" });
        }
      } else {
        // 카드 미등록 → 무료 전환
        await db
          .update(subscriptions)
          .set({
            plan: "free",
            status: "active",
            trialEndsAt: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, sub.id));

        await createNotification({
          userId: sub.userId,
          type: "system",
          title: "무료 체험 종료",
          message: "무료 체험이 종료되어 Free 플랜으로 전환되었습니다. 데이터는 보존되며 유료 플랜 구독 시 다시 이용할 수 있습니다.",
          link: "/pricing",
        });

        results.push({ userId: sub.userId, action: "trial_expired_to_free" });
      }
    }
  }

  return results;
}
