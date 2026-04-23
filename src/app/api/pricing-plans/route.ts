import { PLANS, type PlanConfig } from "@/lib/plans";
import { ok } from "@/lib/api/response";

interface PricingPlan {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  recommended: boolean;
  ctaLabel: string;
  contactOnly: boolean;
}

function ctaLabelFor(id: string): string {
  if (id === "free") return "무료로 시작하기";
  if (id === "enterprise") return "영업팀 문의";
  return "14일 무료 체험";
}

function toPricingPlan(plan: PlanConfig): PricingPlan {
  return {
    id: plan.id,
    name: plan.name,
    nameKo: plan.nameKo,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    // 연간 결제 시 총액(월 단가 × 12) — 프론트에서 월 환산/할인율 계산에 사용
    yearlyPrice: plan.yearlyMonthlyPrice * 12,
    features: plan.highlights,
    recommended: Boolean(plan.popular),
    ctaLabel: ctaLabelFor(plan.id),
    contactOnly: false,
  };
}

/**
 * GET /api/pricing-plans — 랜딩 가격 섹션에 렌더링할 플랜 목록
 * Free / Starter / Pro (PLANS 상수 기반) + Enterprise (문의형) 4개 티어.
 * 프론트는 하드코딩 없이 이 응답을 그대로 렌더링.
 */
export async function GET() {
  const core = (["free", "starter", "pro"] as const).map((id) =>
    toPricingPlan(PLANS[id]),
  );

  const enterprise: PricingPlan = {
    id: "enterprise",
    name: "Enterprise",
    nameKo: "엔터프라이즈",
    description: "5명 이상 팀·프랜차이즈·대형 업체",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "사용자 무제한",
      "전용 도입 컨설팅",
      "SLA 및 우선 지원",
      "커스텀 통합 (ERP/회계/세무)",
      "온프레미스/전용 인스턴스 옵션",
    ],
    recommended: false,
    ctaLabel: ctaLabelFor("enterprise"),
    contactOnly: true,
  };

  return ok({ plans: [...core, enterprise] });
}
