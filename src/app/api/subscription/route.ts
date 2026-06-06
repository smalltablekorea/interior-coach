import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, usageRecords, sites, customers } from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { type PlanId, PLANS } from "@/lib/plans";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { isUnlimitedAccount } from "@/lib/subscription";
import { isPromoEligibleUser, startTrialForNewUser } from "@/lib/subscription/trial";

export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const wid = auth.workspaceId;
    const uid = auth.userId;
    let subRows = await db
      .select()
      .from(subscriptions)
      .where(workspaceFilter(subscriptions.workspaceId, subscriptions.userId, wid, uid))
      .limit(1);

    // 안전망: 가입 시 databaseHooks와 명시적 호출이 모두 실패한 프로모 대상자도
    // 첫 대시보드 진입 시 trial을 자동 부여하여 복구한다. (멱등)
    // 가입 시각이 프로모 윈도우 안에 있는 사용자만 대상 — 기존 가입자 보호.
    if (subRows.length === 0 && !isUnlimitedAccount(auth.session.user.email)) {
      try {
        if (await isPromoEligibleUser(uid)) {
          const grant = await startTrialForNewUser(uid);
          if (grant.subscriptionCreated) {
            console.log("[Subscription] Lazy trial grant", { userId: uid, ...grant });
            subRows = await db
              .select()
              .from(subscriptions)
              .where(workspaceFilter(subscriptions.workspaceId, subscriptions.userId, wid, uid))
              .limit(1);
          }
        }
      } catch (e) {
        console.error("[Subscription] Lazy trial grant failed", uid, e);
      }
    }

    const subscription = subRows[0] || null;
    const unlimited = isUnlimitedAccount(auth.session.user.email);
    const plan = (unlimited ? "pro" : (subscription?.plan || "free")) as PlanId;
    const planConfig = PLANS[plan];

    const period = new Date().toISOString().slice(0, 7);
    const [[siteCount], [customerCount], usageRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sites)
        .where(and(workspaceFilter(sites.workspaceId, sites.userId, wid, uid), isNull(sites.deletedAt))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(and(workspaceFilter(customers.workspaceId, customers.userId, wid, uid), isNull(customers.deletedAt))),
      db
        .select()
        .from(usageRecords)
        .where(
          and(
            workspaceFilter(usageRecords.workspaceId, usageRecords.userId, wid, uid),
            eq(usageRecords.period, period)
          )
        ),
    ]);

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
            tossBillingKey: !!subscription.tossBillingKey, // boolean only — don't expose the key
            userId: uid,
          }
        : { plan: "free", status: "active", billingCycle: "monthly", tossBillingKey: false, userId: uid },
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
  const auth = await requireWorkspaceAuth("settings", "write");
  if (!auth.ok) return auth.response;

  try {
    const wid = auth.workspaceId;
    const uid = auth.userId;
    const { plan: newPlan } = await req.json();

    if (!["free", "starter", "pro"].includes(newPlan)) {
      return err("유효하지 않은 플랜입니다");
    }

    const existing = await db
      .select()
      .from(subscriptions)
      .where(workspaceFilter(subscriptions.workspaceId, subscriptions.userId, wid, uid))
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
        userId: uid,
        workspaceId: wid,
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
