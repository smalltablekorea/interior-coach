import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, usageRecords, sites, customers } from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { type PlanId, PLANS } from "@/lib/plans";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const subRows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId))
      .limit(1);

    const subscription = subRows[0] || null;
    const plan = (subscription?.plan || "free") as PlanId;
    const planConfig = PLANS[plan];

    const [siteCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(and(eq(sites.userId, auth.userId), isNull(sites.deletedAt)));

    const [customerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(and(eq(customers.userId, auth.userId), isNull(customers.deletedAt)));

    const period = new Date().toISOString().slice(0, 7);
    const usageRows = await db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.userId, auth.userId),
          eq(usageRecords.period, period)
        )
      );

    const usageMap: Record<string, number> = {};
    for (const row of usageRows) {
      usageMap[row.feature] = row.count;
    }

    return ok({
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
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { plan: newPlan } = await req.json();

    if (!["free", "starter", "pro", "enterprise"].includes(newPlan)) {
      return err("유효하지 않은 플랜입니다");
    }

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId))
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
        userId: auth.userId,
        plan: newPlan,
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }

    return ok({ plan: newPlan });
  } catch (error) {
    return serverError(error);
  }
}
