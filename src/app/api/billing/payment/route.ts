import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, billingRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { executeBillingPayment, generateOrderId } from "@/lib/toss";
import { type PlanId, PLANS } from "@/lib/plans";

/**
 * POST /api/billing/payment
 * 플랜 변경 + 즉시 결제 실행
 * body: { plan: "starter" | "pro" | "enterprise", billingCycle?: "monthly" | "yearly" }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { plan: newPlan, billingCycle = "monthly" } = await request.json();

    // 플랜 유효성 검사
    if (!["starter", "pro", "enterprise"].includes(newPlan)) {
      return err("유효하지 않은 플랜입니다 (starter, pro, enterprise)");
    }
    if (!["monthly", "yearly"].includes(billingCycle)) {
      return err("유효하지 않은 결제 주기입니다");
    }

    // 구독 + 빌링키 확인
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId))
      .limit(1);

    if (!sub || !sub.tossBillingKey || !sub.tossCustomerKey) {
      return err("결제 수단을 먼저 등록해주세요");
    }

    // 금액 계산
    const planConfig = PLANS[newPlan as PlanId];
    const amount =
      billingCycle === "yearly"
        ? planConfig.yearlyMonthlyPrice * 12
        : planConfig.monthlyPrice;

    if (amount <= 0) {
      return err("무료 플랜은 결제가 필요하지 않습니다");
    }

    // 주문번호 생성
    const orderId = generateOrderId(auth.userId);
    const orderName = `인테리어코치 ${planConfig.nameKo} (${billingCycle === "yearly" ? "연간" : "월간"})`;

    // 빌링 레코드 생성 (pending)
    const [record] = await db
      .insert(billingRecords)
      .values({
        userId: auth.userId,
        subscriptionId: sub.id,
        orderId,
        plan: newPlan,
        billingCycle,
        amount,
        status: "pending",
      })
      .returning();

    // Toss 결제 실행
    const result = await executeBillingPayment({
      billingKey: sub.tossBillingKey,
      customerKey: sub.tossCustomerKey,
      orderId,
      orderName,
      amount,
    });

    if (!result.ok) {
      // 결제 실패 기록
      await db
        .update(billingRecords)
        .set({
          status: "failed",
          failReason: result.error.message,
          tossResponse: result.error,
        })
        .where(eq(billingRecords.id, record.id));

      return err(`결제 실패: ${result.error.message}`);
    }

    const payment = result.data;
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // 결제 성공 기록
    await db
      .update(billingRecords)
      .set({
        status: "paid",
        paymentKey: payment.paymentKey,
        tossResponse: payment,
        paidAt: new Date(payment.approvedAt),
      })
      .where(eq(billingRecords.id, record.id));

    // 구독 업데이트
    await db
      .update(subscriptions)
      .set({
        plan: newPlan,
        billingCycle,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, sub.id));

    return ok({
      plan: newPlan,
      billingCycle,
      amount,
      orderId,
      paymentKey: payment.paymentKey,
      receipt: payment.receipt?.url,
      currentPeriodEnd: periodEnd.toISOString(),
    });
  } catch (error) {
    return serverError(error);
  }
}
