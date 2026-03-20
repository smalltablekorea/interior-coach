// ─── 요금제 설정 ───

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export interface FeatureLimits {
  maxSites: number; // -1 = unlimited
  maxPhotosPerSite: number;
  maxCustomers: number;
  maxUsers: number;
  maxEstimateTemplates: number;
  maxAiTaxAdvisorPerMonth: number;
  hasMarketingAutomation: boolean;
  hasTaxBasic: boolean;
  hasTaxFull: boolean;
  hasElectronicContracts: boolean;
  hasWorkersManagement: boolean;
  hasMaterialsManagement: boolean;
  hasExcelExport: boolean;
  hasCustomerPortal: boolean;
  hasOcrReceiptScan: boolean;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  nameKo: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  description: string;
  limits: FeatureLimits;
  highlights: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    nameKo: "무료",
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    description: "인테리어 사업을 시작하는 분에게",
    limits: {
      maxSites: 3,
      maxPhotosPerSite: 20,
      maxCustomers: 20,
      maxUsers: 1,
      maxEstimateTemplates: 0,
      maxAiTaxAdvisorPerMonth: 0,
      hasMarketingAutomation: false,
      hasTaxBasic: false,
      hasTaxFull: false,
      hasElectronicContracts: false,
      hasWorkersManagement: false,
      hasMaterialsManagement: false,
      hasExcelExport: false,
      hasCustomerPortal: false,
      hasOcrReceiptScan: false,
    },
    highlights: [
      "현장 3개 관리",
      "고객 20명",
      "기본 공정 관리",
      "견적 코치 AI 분석 (무료)",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    nameKo: "스타터",
    monthlyPrice: 149000,
    yearlyMonthlyPrice: 119000,
    description: "체계적으로 관리하고 싶은 사장님",
    limits: {
      maxSites: 15,
      maxPhotosPerSite: 200,
      maxCustomers: 100,
      maxUsers: 1,
      maxEstimateTemplates: 3,
      maxAiTaxAdvisorPerMonth: 10,
      hasMarketingAutomation: false,
      hasTaxBasic: true,
      hasTaxFull: false,
      hasElectronicContracts: false,
      hasWorkersManagement: false,
      hasMaterialsManagement: false,
      hasExcelExport: true,
      hasCustomerPortal: false,
      hasOcrReceiptScan: false,
    },
    highlights: [
      "현장 15개 관리",
      "고객 100명",
      "공종별 정산",
      "견적서 템플릿 3개",
      "세무 기본 (캘린더, 장부)",
      "AI 세무 상담 10회/월",
      "Excel 내보내기",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    nameKo: "프로",
    monthlyPrice: 299000,
    yearlyMonthlyPrice: 239000,
    description: "중소 인테리어 업체의 올인원 솔루션",
    popular: true,
    limits: {
      maxSites: -1,
      maxPhotosPerSite: -1,
      maxCustomers: -1,
      maxUsers: 5,
      maxEstimateTemplates: -1,
      maxAiTaxAdvisorPerMonth: -1,
      hasMarketingAutomation: true,
      hasTaxBasic: true,
      hasTaxFull: true,
      hasElectronicContracts: true,
      hasWorkersManagement: true,
      hasMaterialsManagement: true,
      hasExcelExport: true,
      hasCustomerPortal: true,
      hasOcrReceiptScan: true,
    },
    highlights: [
      "현장/고객 무제한",
      "마케팅 자동화 (5채널)",
      "전자 계약",
      "인력/자재 관리",
      "세무/회계 전체",
      "AI 세무 상담 무제한",
      "고객 포털",
      "OCR 영수증 스캔",
      "사용자 5명",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    nameKo: "엔터프라이즈",
    monthlyPrice: 599000,
    yearlyMonthlyPrice: 479000,
    description: "대형 업체 & 프랜차이즈 통합 운영",
    limits: {
      maxSites: -1,
      maxPhotosPerSite: -1,
      maxCustomers: -1,
      maxUsers: -1,
      maxEstimateTemplates: -1,
      maxAiTaxAdvisorPerMonth: -1,
      hasMarketingAutomation: true,
      hasTaxBasic: true,
      hasTaxFull: true,
      hasElectronicContracts: true,
      hasWorkersManagement: true,
      hasMaterialsManagement: true,
      hasExcelExport: true,
      hasCustomerPortal: true,
      hasOcrReceiptScan: true,
    },
    highlights: [
      "Pro 전체 기능",
      "마케팅 무제한",
      "사용자 무제한",
      "다지점 관리",
      "API 제공",
      "전담 매니저",
      "우선 기술 지원",
    ],
  },
};

export type FeatureKey =
  | "sites"
  | "photos"
  | "customers"
  | "estimateTemplates"
  | "aiTaxAdvisor"
  | "marketingAutomation"
  | "taxBasic"
  | "taxFull"
  | "electronicContracts"
  | "workersManagement"
  | "materialsManagement"
  | "excelExport"
  | "customerPortal"
  | "ocrReceiptScan";

// 기능별 최소 필요 플랜
export const FEATURE_REQUIRED_PLAN: Record<FeatureKey, PlanId> = {
  sites: "free",
  photos: "free",
  customers: "free",
  estimateTemplates: "starter",
  aiTaxAdvisor: "starter",
  marketingAutomation: "pro",
  taxBasic: "starter",
  taxFull: "pro",
  electronicContracts: "pro",
  workersManagement: "pro",
  materialsManagement: "pro",
  excelExport: "starter",
  customerPortal: "pro",
  ocrReceiptScan: "pro",
};

const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "enterprise"];

export function getPlanLevel(plan: PlanId): number {
  return PLAN_ORDER.indexOf(plan);
}

export function isPlanAtLeast(current: PlanId, required: PlanId): boolean {
  return getPlanLevel(current) >= getPlanLevel(required);
}

// 가격 포맷
export function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return `₩${price.toLocaleString("ko-KR")}`;
}

// 제한값 표시
export function formatLimit(value: number): string {
  if (value === -1) return "무제한";
  return String(value);
}
