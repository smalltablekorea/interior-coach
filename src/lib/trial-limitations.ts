import { db } from "@/lib/db";
import { subscriptions, user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { type PlanId, PLANS, isPlanAtLeast } from "@/lib/plans";
import { getUserSubscription } from "@/lib/subscription";

export interface TrialLimitationStatus {
  isTrialExpired: boolean;
  isReadOnly: boolean;
  canWrite: boolean;
  plan: PlanId;
  trialEndsAt: Date | null;
  daysUntilExpiry: number | null;
  limitationReason?: string;
}

/**
 * 사용자의 트라이얼 제한 상태를 확인합니다.
 */
export async function getTrialLimitationStatus(userId: string): Promise<TrialLimitationStatus> {
  const subscription = await getUserSubscription(userId);
  const now = new Date();

  // 기본값
  let status: TrialLimitationStatus = {
    isTrialExpired: false,
    isReadOnly: false,
    canWrite: true,
    plan: subscription.plan,
    trialEndsAt: subscription.trialEndsAt,
    daysUntilExpiry: null,
    limitationReason: undefined,
  };

  // 트라이얼 종료일 계산
  if (subscription.trialEndsAt) {
    const daysLeft = Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    status.daysUntilExpiry = daysLeft;

    // 트라이얼 만료 체크
    if (daysLeft <= 0) {
      status.isTrialExpired = true;
    }
  }

  // Free 플랜이고 트라이얼이 만료된 경우 → Read-only
  if (subscription.plan === "free" && status.isTrialExpired) {
    status.isReadOnly = true;
    status.canWrite = false;
    status.limitationReason = "trial_expired";
  }

  // past_due 상태 → Read-only
  if (subscription.status === "past_due") {
    status.isReadOnly = true;
    status.canWrite = false;
    status.limitationReason = "payment_overdue";
  }

  return status;
}

/**
 * 특정 기능에 대한 권한을 확인합니다.
 * 트라이얼 만료 시에도 읽기 권한은 유지하되, 쓰기 권한을 제한합니다.
 */
export async function checkFeatureAccess(
  userId: string,
  action: "read" | "write" | "delete",
  feature?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  trialStatus?: TrialLimitationStatus;
}> {
  const trialStatus = await getTrialLimitationStatus(userId);

  // 읽기 권한은 항상 허용 (데이터 확인 가능)
  if (action === "read") {
    return {
      allowed: true,
      trialStatus
    };
  }

  // 쓰기/삭제 권한 체크
  if (action === "write" || action === "delete") {
    if (!trialStatus.canWrite) {
      return {
        allowed: false,
        reason: trialStatus.limitationReason || "access_limited",
        upgradeRequired: true,
        trialStatus,
      };
    }
  }

  return {
    allowed: true,
    trialStatus
  };
}

/**
 * API 라우트에서 사용할 권한 체크 미들웨어
 */
export async function enforceWriteAccess(userId: string): Promise<{
  canWrite: boolean;
  error?: {
    code: string;
    message: string;
    upgradeUrl?: string;
  };
}> {
  const access = await checkFeatureAccess(userId, "write");

  if (!access.allowed) {
    const upgradeUrl = "/pricing?utm_source=limitation&utm_medium=write_block";

    if (access.trialStatus?.limitationReason === "trial_expired") {
      return {
        canWrite: false,
        error: {
          code: "TRIAL_EXPIRED",
          message: "무료체험이 종료되어 편집이 제한됩니다. 구독하시면 모든 기능을 계속 이용할 수 있습니다.",
          upgradeUrl,
        },
      };
    }

    if (access.trialStatus?.limitationReason === "payment_overdue") {
      return {
        canWrite: false,
        error: {
          code: "PAYMENT_OVERDUE",
          message: "결제가 연체되어 편집이 제한됩니다. 결제를 완료하시면 정상 이용이 가능합니다.",
          upgradeUrl,
        },
      };
    }

    return {
      canWrite: false,
      error: {
        code: "ACCESS_LIMITED",
        message: "현재 플랜에서는 이 기능을 이용할 수 없습니다.",
        upgradeUrl,
      },
    };
  }

  return { canWrite: true };
}

/**
 * 사용량 제한 체크 (Free 플랜 한계)
 * 트라이얼 만료 후에는 새로운 데이터 생성을 제한하되, 기존 데이터 조회는 허용
 */
export async function checkUsageLimitWithTrial(
  userId: string,
  action: "create" | "view",
  resourceType: "sites" | "customers" | "estimates",
  currentCount: number
): Promise<{
  allowed: boolean;
  reason?: string;
  message?: string;
  upgradeRequired?: boolean;
}> {
  const subscription = await getUserSubscription(userId);
  const trialStatus = await getTrialLimitationStatus(userId);

  // 읽기는 항상 허용
  if (action === "view") {
    return { allowed: true };
  }

  // 트라이얼 만료 시 생성 작업 제한
  if (action === "create" && trialStatus.isReadOnly) {
    return {
      allowed: false,
      reason: "trial_expired_create_blocked",
      message: "무료체험 종료로 새 데이터 생성이 제한됩니다. 구독하시면 무제한으로 이용할 수 있습니다.",
      upgradeRequired: true,
    };
  }

  // 플랜별 사용량 제한 체크
  const planLimits = PLANS[subscription.plan].limits;
  let limit: number;

  switch (resourceType) {
    case "sites":
      limit = planLimits.maxSites;
      break;
    case "customers":
      limit = planLimits.maxCustomers;
      break;
    case "estimates":
      limit = planLimits.maxEstimateTemplates;
      break;
    default:
      return { allowed: true };
  }

  // 무제한 플랜 (-1)
  if (limit === -1) {
    return { allowed: true };
  }

  // 한계 도달 체크
  if (currentCount >= limit) {
    const resourceNames = {
      sites: "현장",
      customers: "고객",
      estimates: "견적 템플릿"
    };

    return {
      allowed: false,
      reason: "usage_limit_reached",
      message: `${resourceNames[resourceType]} ${limit}개 한계에 도달했습니다. 더 많은 ${resourceNames[resourceType]}을 관리하려면 상위 플랜으로 업그레이드하세요.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * UI에서 표시할 트라이얼 상태 메시지 생성
 */
export function getTrialStatusMessage(status: TrialLimitationStatus): {
  type: "warning" | "error" | "info" | "success" | null;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
} | null {
  if (!status.isTrialExpired && !status.isReadOnly) {
    return null;
  }

  if (status.limitationReason === "trial_expired") {
    return {
      type: "error",
      title: "무료체험 종료",
      message: "체험 기간이 종료되어 편집이 제한됩니다. 기존 데이터는 언제든 확인하실 수 있습니다.",
      actionText: "구독하고 모든 기능 이용하기",
      actionUrl: "/pricing?utm_source=trial_expired_banner",
    };
  }

  if (status.limitationReason === "payment_overdue") {
    return {
      type: "warning",
      title: "결제 연체",
      message: "결제가 연체되어 일시적으로 편집이 제한됩니다. 결제 완료 시 즉시 정상 이용됩니다.",
      actionText: "결제하기",
      actionUrl: "/billing",
    };
  }

  return null;
}

/**
 * 트라이얼 카운트다운 정보 (UI용)
 */
export function getTrialCountdown(status: TrialLimitationStatus): {
  show: boolean;
  daysLeft: number;
  urgency: "high" | "medium" | "low";
  message: string;
  ctaText: string;
} | null {
  if (!status.trialEndsAt || status.daysUntilExpiry === null || status.daysUntilExpiry <= 0) {
    return null;
  }

  const daysLeft = status.daysUntilExpiry;

  let urgency: "high" | "medium" | "low";
  if (daysLeft <= 1) urgency = "high";
  else if (daysLeft <= 3) urgency = "medium";
  else urgency = "low";

  let message: string;
  let ctaText: string;

  if (daysLeft === 1) {
    message = "체험이 내일 종료됩니다! 지금 구독하고 모든 기능을 계속 이용하세요.";
    ctaText = "지금 즉시 구독";
  } else if (daysLeft <= 3) {
    message = `체험이 ${daysLeft}일 후 종료됩니다. 데이터 손실 없이 계속 이용하세요.`;
    ctaText = "구독하고 데이터 보존";
  } else {
    message = `체험 ${daysLeft}일 남음. 지금 구독하고 모든 혜택을 누리세요.`;
    ctaText = "구독하기";
  }

  return {
    show: true,
    daysLeft,
    urgency,
    message,
    ctaText,
  };
}