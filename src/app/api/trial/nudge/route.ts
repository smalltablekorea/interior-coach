import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, usageRecords, sites, customers, user as userTable } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";
import { sendTrialNudgeEmail } from "@/lib/trial-emails";
import { PLANS } from "@/lib/plans";

/**
 * POST /api/trial/nudge
 * 무료체험 → 유료 전환 넛지/알림 시스템
 * D-7, D-3, D-1 인앱 알림 + 이메일 + 사용량 기반 넛지
 * Vercel Cron에서 매일 1회 호출
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [inAppResults, emailResults, usageResults] = await Promise.all([
      processTrialDayNotifications(),
      processTrialEmailSequence(),
      processUsageBasedNudges(),
    ]);

    return NextResponse.json({
      success: true,
      processed: inAppResults.length + emailResults.length + usageResults.length,
      inApp: { count: inAppResults.length, results: inAppResults },
      email: { count: emailResults.length, results: emailResults },
      usage: { count: usageResults.length, results: usageResults },
    });
  } catch (error) {
    console.error("[Trial Nudge CRON] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * D-7, D-3, D-1 인앱 알림 처리
 */
async function processTrialDayNotifications() {
  const now = new Date();
  const results = [];

  // 트라이얼 중인 구독 조회 (활성 + 트라이얼 종료일 있음)
  const trialSubs = await db
    .select({
      subscription: subscriptions,
      user: {
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
      },
    })
    .from(subscriptions)
    .innerJoin(userTable, eq(subscriptions.userId, userTable.id))
    .where(
      and(
        eq(subscriptions.status, "trialing"),
        gte(subscriptions.trialEndsAt, now) // 아직 만료되지 않음
      )
    );

  for (const { subscription: sub, user } of trialSubs) {
    if (!sub.trialEndsAt) continue;

    const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const planConfig = PLANS[sub.plan as keyof typeof PLANS];

    if (daysLeft === 7) {
      // D-7 알림
      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "🎯 무료체험 7일 남았어요!",
        message: `${planConfig.nameKo} 플랜 체험이 일주일 후 종료됩니다. 지금 구독하고 모든 기능을 계속 이용하세요.`,
        link: "/pricing",
        metadata: { daysLeft: 7, plan: sub.plan },
      });

      results.push({ userId: sub.userId, action: "trial_7day_notice", daysLeft: 7 });

    } else if (daysLeft === 3) {
      // D-3 알림 (기존 로직 강화)
      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "⚠️ 무료체험 3일 남았어요!",
        message: `${planConfig.nameKo} 플랜 체험이 3일 후 종료됩니다. 데이터 손실 없이 계속 이용하려면 지금 구독하세요.`,
        link: "/pricing",
        metadata: { daysLeft: 3, plan: sub.plan },
      });

      results.push({ userId: sub.userId, action: "trial_3day_notice", daysLeft: 3 });

    } else if (daysLeft === 1) {
      // D-1 알림
      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "🚨 무료체험 내일 종료!",
        message: `${planConfig.nameKo} 플랜 체험이 내일 종료됩니다. 마지막 기회! 지금 구독하여 모든 데이터와 기능을 유지하세요.`,
        link: "/pricing",
        metadata: { daysLeft: 1, plan: sub.plan, urgent: true },
      });

      results.push({ userId: sub.userId, action: "trial_1day_notice", daysLeft: 1 });
    }
  }

  return results;
}

/**
 * 이메일 알림 시퀀스 처리
 */
async function processTrialEmailSequence() {
  const now = new Date();
  const results = [];

  // 트라이얼 중인 구독 + 사용자 정보
  const trialSubs = await db
    .select({
      subscription: subscriptions,
      user: {
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
      },
    })
    .from(subscriptions)
    .innerJoin(userTable, eq(subscriptions.userId, userTable.id))
    .where(
      and(
        eq(subscriptions.status, "trialing"),
        gte(subscriptions.trialEndsAt, now)
      )
    );

  for (const { subscription: sub, user } of trialSubs) {
    if (!sub.trialEndsAt || !user.email) continue;

    const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // 이메일 발송 조건 (D-7, D-3, D-1)
    if ([7, 3, 1].includes(daysLeft)) {
      const emailResult = await sendTrialNudgeEmail({
        to: user.email,
        userName: user.name,
        daysLeft,
        plan: sub.plan as keyof typeof PLANS,
        userId: sub.userId,
      });

      results.push({
        userId: sub.userId,
        email: user.email,
        daysLeft,
        action: `email_sent_${daysLeft}day`,
        success: emailResult.success,
        error: emailResult.error,
      });
    }
  }

  return results;
}

/**
 * 사용량 기반 넛지 (현장/고객 제한 근접 시)
 */
async function processUsageBasedNudges() {
  const now = new Date();
  const results = [];

  // Free 플랜 사용자들 조회
  const freePlanUsers = await db
    .select({
      subscription: subscriptions,
      user: {
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
      },
    })
    .from(subscriptions)
    .innerJoin(userTable, eq(subscriptions.userId, userTable.id))
    .where(
      and(
        eq(subscriptions.plan, "free"),
        eq(subscriptions.status, "active")
      )
    );

  for (const { subscription: sub, user } of freePlanUsers) {
    const [siteCount, customerCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sites)
        .where(and(eq(sites.userId, sub.userId), isNull(sites.deletedAt)))
        .then(rows => rows[0]?.count || 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(and(eq(customers.userId, sub.userId), isNull(customers.deletedAt)))
        .then(rows => rows[0]?.count || 0),
    ]);

    const freeLimits = PLANS.free.limits;
    const siteUsagePercent = (siteCount / freeLimits.maxSites) * 100;
    const customerUsagePercent = (customerCount / freeLimits.maxCustomers) * 100;

    // 현장 사용량 80% 이상 시 넛지
    if (siteUsagePercent >= 80 && siteCount < freeLimits.maxSites) {
      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "🏗️ 현장 관리 한계 근접",
        message: `현재 ${siteCount}/${freeLimits.maxSites}개 현장을 관리 중입니다. 무제한 현장 관리를 위해 Pro 플랜을 확인해보세요.`,
        link: "/pricing",
        metadata: {
          usageType: "sites",
          current: siteCount,
          limit: freeLimits.maxSites,
          usagePercent: siteUsagePercent
        },
      });

      results.push({
        userId: sub.userId,
        action: "usage_nudge_sites",
        usage: `${siteCount}/${freeLimits.maxSites}`,
        percent: siteUsagePercent
      });
    }

    // 고객 사용량 80% 이상 시 넛지
    if (customerUsagePercent >= 80 && customerCount < freeLimits.maxCustomers) {
      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "👥 고객 관리 한계 근접",
        message: `현재 ${customerCount}/${freeLimits.maxCustomers}명의 고객을 관리 중입니다. 무제한 고객 관리를 위해 Pro 플랜을 확인해보세요.`,
        link: "/pricing",
        metadata: {
          usageType: "customers",
          current: customerCount,
          limit: freeLimits.maxCustomers,
          usagePercent: customerUsagePercent
        },
      });

      results.push({
        userId: sub.userId,
        action: "usage_nudge_customers",
        usage: `${customerCount}/${freeLimits.maxCustomers}`,
        percent: customerUsagePercent
      });
    }

    // 한계 도달 시 업그레이드 필요 알림
    if (siteCount >= freeLimits.maxSites || customerCount >= freeLimits.maxCustomers) {
      await createNotification({
        userId: sub.userId,
        type: "system",
        title: "📈 플랜 업그레이드 필요",
        message: `Free 플랜 한계에 도달했습니다. 사업 성장에 맞는 플랜으로 업그레이드하여 계속 확장하세요!`,
        link: "/pricing",
        metadata: {
          sitesAtLimit: siteCount >= freeLimits.maxSites,
          customersAtLimit: customerCount >= freeLimits.maxCustomers,
          currentSites: siteCount,
          currentCustomers: customerCount,
        },
      });

      results.push({
        userId: sub.userId,
        action: "usage_limit_reached",
        sites: siteCount,
        customers: customerCount
      });
    }
  }

  return results;
}