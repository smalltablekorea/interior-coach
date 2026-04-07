import { db } from "@/lib/db";
import { subscriptions, usageRecords, user as userTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { type PlanId, PLANS, isPlanAtLeast, FEATURE_REQUIRED_PLAN, type FeatureKey } from "@/lib/plans";

/** 관리자 / 테스트 계정 — 모든 패키지 무제한 이용 */
const UNLIMITED_EMAILS = [
  "smalltablekorea@gmail.com",
  "test@interior-coach.com",
];

export function isUnlimitedAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return UNLIMITED_EMAILS.includes(email.toLowerCase());
}

export interface UserSubscription {
  plan: PlanId;
  status: string;
  billingCycle: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  // 관리자/테스트 계정은 pro 플랜으로 처리 (전체 기능 해제)
  const userRows = await db
    .select({ email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (userRows.length > 0 && isUnlimitedAccount(userRows[0].email)) {
    return {
      plan: "pro",
      status: "active",
      billingCycle: "monthly",
      trialEndsAt: null,
      currentPeriodEnd: null,
    };
  }

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    return {
      plan: "free",
      status: "active",
      billingCycle: "monthly",
      trialEndsAt: null,
      currentPeriodEnd: null,
    };
  }

  const sub = rows[0];
  return {
    plan: sub.plan as PlanId,
    status: sub.status,
    billingCycle: sub.billingCycle || "monthly",
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
  };
}

export function isFeatureAvailable(planId: PlanId, featureKey: FeatureKey): boolean {
  const requiredPlan = FEATURE_REQUIRED_PLAN[featureKey];
  return isPlanAtLeast(planId, requiredPlan);
}

export function getFeatureLimit(planId: PlanId, featureKey: FeatureKey): number {
  const limits = PLANS[planId].limits;
  const limitMap: Record<string, number> = {
    sites: limits.maxSites,
    photos: limits.maxPhotosPerSite,
    customers: limits.maxCustomers,
    estimateTemplates: limits.maxEstimateTemplates,
    aiTaxAdvisor: limits.maxAiTaxAdvisorPerMonth,
  };
  return limitMap[featureKey] ?? -1;
}

export async function getUsageCount(userId: string, feature: string, period?: string): Promise<number> {
  const currentPeriod = period || new Date().toISOString().slice(0, 7); // "2026-03"
  const rows = await db
    .select()
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        eq(usageRecords.feature, feature),
        eq(usageRecords.period, currentPeriod)
      )
    )
    .limit(1);

  return rows.length > 0 ? rows[0].count : 0;
}

export async function incrementUsage(userId: string, feature: string): Promise<void> {
  const period = new Date().toISOString().slice(0, 7);
  const existing = await db
    .select()
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        eq(usageRecords.feature, feature),
        eq(usageRecords.period, period)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(usageRecords)
      .set({ count: existing[0].count + 1, updatedAt: new Date() })
      .where(eq(usageRecords.id, existing[0].id));
  } else {
    await db.insert(usageRecords).values({
      userId,
      feature,
      period,
      count: 1,
    });
  }
}

export interface UsageLimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  requiredPlan: PlanId;
}

export async function checkUsageLimit(
  userId: string,
  feature: FeatureKey,
  planId: PlanId
): Promise<UsageLimitCheck> {
  const requiredPlan = FEATURE_REQUIRED_PLAN[feature];

  // Boolean feature check
  if (!isPlanAtLeast(planId, requiredPlan)) {
    return { allowed: false, current: 0, limit: 0, requiredPlan };
  }

  const limit = getFeatureLimit(planId, feature);
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, requiredPlan };
  }

  const current = await getUsageCount(userId, feature);
  return {
    allowed: current < limit,
    current,
    limit,
    requiredPlan: isPlanAtLeast("starter", requiredPlan) ? "starter" : "pro",
  };
}
