// ─── 결제 실패 재시도 로직 ───

import { db } from "@/lib/db";
import { billingRecords, subscriptions } from "@/lib/db/schema";
import { eq, and, lte, lt } from "drizzle-orm";
import { executeBillingPayment } from "@/lib/toss";
import { createNotification } from "@/lib/notifications";

/** 재시도 가능한 Toss 에러 코드 (transient errors) */
const RETRYABLE_ERROR_CODES = [
  "COMMON_INVALID_REQUEST_BODY", // Network/temporary issues
  "COMMON_SYSTEM_ERROR", // Toss system error
  "PAYMENT_PROVIDER_ERROR", // Payment provider temporary error
  "CARD_TEMPORARILY_UNAVAILABLE", // Card temporarily unavailable
  "UNKNOWN_PAYMENT_ERROR", // Unknown temporary errors
];

/** 재시도 불가능한 Toss 에러 코드 (permanent errors) */
const NON_RETRYABLE_ERROR_CODES = [
  "INVALID_CARD_EXPIRATION", // Card expired
  "INVALID_CARD_NUMBER", // Invalid card
  "INVALID_CARD_CVC", // Invalid CVC
  "CARD_COMPANY_NOT_SUPPORTED", // Card company not supported
  "BILLING_KEY_NOT_FOUND", // Billing key deleted/invalid
  "INVALID_BILLING_KEY", // Billing key invalid
  "CANCELED_PAYMENT", // Payment canceled
  "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING", // Internal system failure
  "EXCEEDED_DAILY_PAYMENT_LIMIT", // Daily limit exceeded (unlikely to change soon)
];

/** 재시도 스케줄 계산 (시간 단위) — 3일 간격 3회 */
export function getRetryDelayHours(attempt: number): number {
  if (attempt >= 1 && attempt <= 3) return 72; // 3일(72시간) 간격
  return 0; // 재시도 횟수 초과
}

/** 다음 재시도 시간 계산 */
export function calculateNextRetryTime(attempt: number): Date | null {
  const delayHours = getRetryDelayHours(attempt);
  if (delayHours === 0) return null; // 재시도 불가

  const nextRetry = new Date();
  nextRetry.setHours(nextRetry.getHours() + delayHours);
  return nextRetry;
}

/** Toss 에러가 재시도 가능한지 판단 */
export function isRetryableError(errorCode: string, errorMessage: string): boolean {
  // 명시적으로 재시도 불가능한 에러
  if (NON_RETRYABLE_ERROR_CODES.includes(errorCode)) {
    return false;
  }

  // 명시적으로 재시도 가능한 에러
  if (RETRYABLE_ERROR_CODES.includes(errorCode)) {
    return true;
  }

  // 메시지 기반 판단 (fallback)
  const message = errorMessage.toLowerCase();
  if (message.includes('network') ||
      message.includes('timeout') ||
      message.includes('temporary') ||
      message.includes('서버 오류')) {
    return true;
  }

  if (message.includes('invalid') ||
      message.includes('expired') ||
      message.includes('canceled') ||
      message.includes('잘못된') ||
      message.includes('만료된')) {
    return false;
  }

  // 알 수 없는 에러는 기본적으로 재시도 가능
  return true;
}

/** 재시도 대상 레코드 조회 */
export async function getRetryableRecords() {
  const now = new Date();

  return db
    .select()
    .from(billingRecords)
    .where(
      and(
        eq(billingRecords.status, "failed"),
        lt(billingRecords.retryCount, billingRecords.maxRetries),
        lte(billingRecords.nextRetryAt, now)
      )
    );
}

/** 결제 재시도 실행 */
export async function retryFailedPayment(recordId: string) {
  const [record] = await db
    .select()
    .from(billingRecords)
    .where(eq(billingRecords.id, recordId))
    .limit(1);

  if (!record) {
    throw new Error(`Billing record not found: ${recordId}`);
  }

  // 재시도 횟수 확인
  if (record.retryCount >= record.maxRetries) {
    throw new Error(`Max retries exceeded for record: ${recordId}`);
  }

  // 에러 타입 확인 (재시도 가능한 에러인지)
  if (record.failReason) {
    const errorCode = record.failReason.split(':')[0] || '';
    const errorMessage = record.failReason;

    if (!isRetryableError(errorCode, errorMessage)) {
      // 재시도 불가능한 에러면 maxRetries를 0으로 설정하여 더 이상 재시도하지 않음
      await db
        .update(billingRecords)
        .set({
          maxRetries: 0,
          nextRetryAt: null,
        })
        .where(eq(billingRecords.id, recordId));

      throw new Error(`Non-retryable error: ${record.failReason}`);
    }
  }

  // 구독 정보 가져오기 (빌링키 필요)
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, record.subscriptionId!))
    .limit(1);

  if (!subscription || !subscription.tossBillingKey || !subscription.tossCustomerKey) {
    throw new Error(`Invalid subscription or billing key for record: ${recordId}`);
  }

  const newRetryCount = record.retryCount + 1;
  const nextRetryTime = calculateNextRetryTime(newRetryCount);

  // 재시도 실행
  const result = await executeBillingPayment({
    billingKey: subscription.tossBillingKey,
    customerKey: subscription.tossCustomerKey,
    orderId: record.orderId,
    orderName: `인테리어코치 ${record.plan} 재시도 결제`,
    amount: record.amount,
  });

  const now = new Date();

  if (result.ok) {
    // 재시도 성공
    const periodEnd = new Date(now);
    if (record.billingCycle === "yearly") {
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
        retryCount: newRetryCount,
        lastRetryAt: now,
        nextRetryAt: null,
      })
      .where(eq(billingRecords.id, recordId));

    // 구독 상태 복구
    await db
      .update(subscriptions)
      .set({
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, record.subscriptionId!));

    // 성공 알림
    await createNotification({
      userId: record.userId,
      type: "system",
      title: "결제 복구 성공",
      message: `${newRetryCount}회 재시도 후 결제가 성공했습니다 (₩${record.amount.toLocaleString()})`,
      link: "/settings/billing",
    });

    return { success: true, retryCount: newRetryCount };
  } else {
    // 재시도 실패
    await db
      .update(billingRecords)
      .set({
        failReason: result.error.message,
        tossResponse: result.error,
        retryCount: newRetryCount,
        lastRetryAt: now,
        nextRetryAt: nextRetryTime,
      })
      .where(eq(billingRecords.id, recordId));

    // 최대 재시도 횟수 도달 시 최종 실패 알림
    if (newRetryCount >= record.maxRetries) {
      await createNotification({
        userId: record.userId,
        type: "payment_overdue",
        title: "결제 최종 실패",
        message: `${record.maxRetries}회 재시도 후에도 결제가 실패했습니다. 결제 수단을 확인해주세요.`,
        link: "/settings/billing",
      });
    }

    return {
      success: false,
      error: result.error.message,
      retryCount: newRetryCount,
      nextRetryAt: nextRetryTime
    };
  }
}

/** 모든 재시도 대상 처리 (CRON 용) */
export async function processFailedPaymentRetries() {
  const retryableRecords = await getRetryableRecords();
  const results = [];

  for (const record of retryableRecords) {
    try {
      const result = await retryFailedPayment(record.id);
      results.push({
        recordId: record.id,
        userId: record.userId,
        orderId: record.orderId,
        ...result,
      });
    } catch (error) {
      console.error(`[Billing Retry] Error processing record ${record.id}:`, error);
      results.push({
        recordId: record.id,
        userId: record.userId,
        orderId: record.orderId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    totalProcessed: retryableRecords.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}