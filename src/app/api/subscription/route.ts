import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, usageRecords, sites, customers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { type PlanId, PLANS } from "@/lib/plans";

const USER_ID = "demo";

// GET: 현재 구독 정보 + 사용량
export async function GET() {
  try {
    // 구독 정보
    const subRows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, USER_ID))
      .limit(1);

    const subscription = subRows[0] || null;
    const plan = (subscription?.plan || "free") as PlanId;
    const planConfig = PLANS[plan];

    // 사용량 집계
    const [siteCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.userId, USER_ID));

    const [customerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.userId, USER_ID));

    const period = new Date().toISOString().slice(0, 7);
    const usageRows = await db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.userId, USER_ID),
          eq(usageRecords.period, period)
        )
      );

    const usageMap: Record<string, number> = {};
    for (const row of usageRows) {
      usageMap[row.feature] = row.count;
    }

    return NextResponse.json({
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            billingCycle: subscription.billingCycle,
            trialEndsAt: subscription.trialEndsAt,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            canceledAt: subscription.canceledAt,
          }
        : { plan: "free", status: "active", billingCycle: "monthly" },
      planConfig: {
        name: planConfig.name,
        nameKo: planConfig.nameKo,
        monthlyPrice: planConfig.monthlyPrice,
      },
      usage: {
        sites: siteCount.count,
        customers: customerCount.count,
        aiTaxAdvisor: usageMap["aiTaxAdvisor"] || 0,
      },
      limits: planConfig.limits,
    });
  } catch (error) {
    console.error("Subscription GET error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST: 플랜 변경 (MVP: 즉시 적용, 결제 없음)
export async function POST(req: NextRequest) {
  try {
    const { plan: newPlan } = await req.json();

    if (!["free", "starter", "pro", "enterprise"].includes(newPlan)) {
      return NextResponse.json({ error: "유효하지 않은 플랜" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, USER_ID))
      .limit(1);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (existing.length > 0) {
      await db
        .update(subscriptions)
        .set({
          plan: newPlan,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, existing[0].id));
    } else {
      await db.insert(subscriptions).values({
        userId: USER_ID,
        plan: newPlan,
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error) {
    console.error("Subscription POST error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
