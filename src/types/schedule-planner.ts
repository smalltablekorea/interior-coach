// ─── AI 공정매니저 타입 ───

export interface Trade {
  id: string;
  name: string;
  icon: string;
  group: string;
  phase: number;
  baseDays: number;
  costMin: number;
  costMax: number;
  unit: string;
  deps: string[];
  parallel: string[];
  requires: string[];
  skipRisk: "critical" | "high" | "medium" | "low";
  desc: string;
  notes: string;
  savingTip: string;
  qualityCheck: string[];
  prework: Prework[];
  materials: MaterialSpec[];
}

export interface Prework {
  task: string;
  leadDays: number;
  category: string;
  trigger?: string;
  critical?: boolean;
}

export interface MaterialSpec {
  name: string;
  spec: string;
  leadDays: number;
  costRange: string;
  category: string;
  critical?: boolean;
}

export interface DepWarning {
  if: string;
  needs: string;
  msg: string;
  severity: "critical" | "warn";
}

export interface SizeOption {
  id: string;
  label: string;
  pyung: number;
  mult: number;
}

export interface SeasonOption {
  label: string;
  mult: number;
}

// buildSchedule 결과
export interface ScheduledTrade {
  id: string;
  name: string;
  icon: string;
  group: string;
  phase: number;
  startDay: number;
  endDay: number;
  days: number;
  costLow: number;
  costHigh: number;
  costPct: number;
  isParallel: boolean;
  parallelWith: string[];
  desc: string;
  notes: string;
  savingTip: string;
  qualityCheck: string[];
  prework: Prework[];
  materials: MaterialSpec[];
}

export interface ProcurementItem {
  type: "prework" | "material";
  trade: string;
  icon: string;
  task?: string;
  name?: string;
  spec?: string;
  leadDays: number;
  dueByDay: number;
  orderDay: number;
  costRange?: string;
  category: string;
  critical?: boolean;
  phase: number;
}

export interface ScheduleResult {
  scheduled: ScheduledTrade[];
  totalDays: number;
  totalCostLow: number;
  totalCostHigh: number;
  totalCostMid: number;
  procurement: ProcurementItem[];
  pre: ProcurementItem[];
  during: ProcurementItem[];
  risk: number;
  py: number;
  critMats: ProcurementItem[];
  totalChecks: number;
}

// trade_progress JSON
export type TradeStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface TradeProgressEntry {
  status: TradeStatus;
  completedAt?: string; // ISO date
}

export type TradeProgress = Record<string, TradeProgressEntry>;

// API request/response
export interface CreateSchedulePlanRequest {
  siteName: string;
  siteAddress?: string;
  startDate: string;
  memo?: string;
  sizeId: string;
  selectedTrades: string[];
  season: string;
}

export interface UpdateTradeProgressRequest {
  tradeId: string;
  status: TradeStatus;
}

export interface SchedulePlanResponse {
  id: string;
  siteName: string;
  siteAddress: string | null;
  startDate: string;
  memo: string | null;
  sizeId: string;
  selectedTrades: string[];
  season: string;
  resultJson: ScheduleResult | null;
  status: string;
  tradeProgress: TradeProgress | null;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

// Plan limits
export const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  light: 3,
  standard: 10,
  premium: Infinity,
  starter: 5,
  pro: Infinity,
};
