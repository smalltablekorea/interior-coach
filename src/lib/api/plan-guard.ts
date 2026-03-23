import { getUserSubscription, checkUsageLimit } from "@/lib/subscription";
import type { PlanId, FeatureKey } from "@/lib/plans";
import { isPlanAtLeast, FEATURE_REQUIRED_PLAN, PLANS } from "@/lib/plans";
import { err } from "./response";

/**
 * 기능 접근 가능 여부 체크 미들웨어
 * 플랜 기반으로 기능 사용 가능 여부 확인
 */
export async function requireFeature(userId: string, feature: FeatureKey) {
  const sub = await getUserSubscription(userId);

  if (!isPlanAtLeast(sub.plan, FEATURE_REQUIRED_PLAN[feature])) {
    const requiredPlan = FEATURE_REQUIRED_PLAN[feature];
    const planName = PLANS[requiredPlan].nameKo;
    return {
      ok: false as const,
      response: err(
        `이 기능은 ${planName} 플랜 이상에서 사용 가능합니다. 현재 플랜: ${PLANS[sub.plan].nameKo}`,
        403
      ),
    };
  }

  return { ok: true as const, plan: sub.plan };
}

/**
 * 사용량 제한 체크 (sites, customers 등 수량 제한 기능)
 */
export async function requireUsageLimit(userId: string, feature: FeatureKey) {
  const sub = await getUserSubscription(userId);
  const check = await checkUsageLimit(userId, feature, sub.plan);

  if (!check.allowed) {
    const limit = check.limit;
    const planName = PLANS[sub.plan].nameKo;

    if (limit === 0) {
      return {
        ok: false as const,
        response: err(
          `이 기능은 현재 플랜(${planName})에서 사용할 수 없습니다. 업그레이드가 필요합니다.`,
          403
        ),
      };
    }

    return {
      ok: false as const,
      response: err(
        `${planName} 플랜의 월간 사용 한도(${limit}회)를 초과했습니다. 현재 사용량: ${check.current}회`,
        403
      ),
    };
  }

  return { ok: true as const, plan: sub.plan, usage: check };
}
