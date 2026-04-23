import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions, user as userTable } from "@/lib/db/schema";
import { sendSms } from "@/lib/solapi";

export const TRIAL_DAYS = 14;
export const TRIAL_PLAN = "pro" as const;
export const TRIAL_STATUS = "trialing" as const;

/**
 * 신규 유저에게 14일 Pro 체험을 부여한다.
 * - 이미 subscriptions 행이 있으면 건드리지 않는다 (멱등)
 */
export async function startTrialForNewUser(userId: string): Promise<boolean> {
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (existing.length > 0) return false;

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(subscriptions).values({
    userId,
    plan: TRIAL_PLAN,
    status: TRIAL_STATUS,
    billingCycle: "monthly",
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd,
    trialEndsAt: trialEnd,
  });
  return true;
}

export interface TrialSweepResult {
  remindersSent: number;
  expiredDowngraded: number;
  smsFailures: number;
}

/**
 * 매일 실행되는 체험 관리 배치.
 * 1. 체험 종료 3일 전(±12h 윈도우) 유저 → Solapi SMS 리마인드 + 플래그
 * 2. 체험 종료 당일 이후 → status="free"로 전환 + 종료 안내 SMS
 */
export async function runTrialSweep(): Promise<TrialSweepResult> {
  const now = new Date();
  const in3dStart = new Date(now.getTime() + (3 * 24 - 12) * 60 * 60 * 1000);
  const in3dEnd = new Date(now.getTime() + (3 * 24 + 12) * 60 * 60 * 1000);

  const result: TrialSweepResult = {
    remindersSent: 0,
    expiredDowngraded: 0,
    smsFailures: 0,
  };

  // ─── 1) 3일 전 리마인드 ───
  // meta 컬럼이 없어서 canceledAt=NULL + status=trialing + trial_ends_at in window로 조건 제한.
  // 중복 발송 방지를 위해 current_period_start로 잠금 기록 (reminder 발송 후 current_period_start를 trial_ends_at - 1s로 당겨 창 바깥으로 보냄)
  // 단순화를 위해 billing_cycle에 'trial-reminded' 플래그를 임시 저장.
  const toRemind = await db
    .select({
      userId: subscriptions.userId,
      trialEndsAt: subscriptions.trialEndsAt,
      billingCycle: subscriptions.billingCycle,
      email: userTable.email,
      phone: userTable.phone,
      name: userTable.name,
    })
    .from(subscriptions)
    .innerJoin(userTable, eq(userTable.id, subscriptions.userId))
    .where(
      and(
        eq(subscriptions.status, TRIAL_STATUS),
        gte(subscriptions.trialEndsAt, in3dStart),
        lt(subscriptions.trialEndsAt, in3dEnd),
        sql`coalesce(${subscriptions.billingCycle}, '') <> 'trial-reminded'`,
      ),
    );

  for (const row of toRemind) {
    if (row.phone) {
      const msg = `[인테리어코치] ${row.name || ""}님의 14일 무료 체험이 3일 후 종료됩니다. 계속 이용하시려면 앱에서 결제 수단을 등록해주세요.`;
      const sms = await sendSms(row.phone, msg, false);
      if (!sms.success) result.smsFailures++;
    }
    await db
      .update(subscriptions)
      .set({ billingCycle: "trial-reminded", updatedAt: new Date() })
      .where(eq(subscriptions.userId, row.userId));
    result.remindersSent++;
  }

  // ─── 2) 체험 종료 당일 이후 → free 로 전환 ───
  const expired = await db
    .select({
      userId: subscriptions.userId,
      phone: userTable.phone,
      name: userTable.name,
    })
    .from(subscriptions)
    .innerJoin(userTable, eq(userTable.id, subscriptions.userId))
    .where(
      and(
        eq(subscriptions.status, TRIAL_STATUS),
        lt(subscriptions.trialEndsAt, now),
      ),
    );

  for (const row of expired) {
    await db
      .update(subscriptions)
      .set({
        plan: "free",
        status: "active",
        billingCycle: "monthly",
        canceledAt: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.userId, row.userId));

    if (row.phone) {
      const msg = `[인테리어코치] ${row.name || ""}님의 무료 체험이 종료되었습니다. 계속 Pro 기능을 이용하시려면 앱에서 업그레이드해주세요.`;
      const sms = await sendSms(row.phone, msg, false);
      if (!sms.success) result.smsFailures++;
    }
    result.expiredDowngraded++;
  }

  return result;
}
