export type Weather = "sunny" | "cloudy" | "rainy" | "snowy" | "hot" | "cold";

export interface DailyLog {
  id: string;
  siteId: string;
  siteName?: string;
  authorName: string;
  logDate: string;
  tradesWorked: string[] | null;
  tradesWorkedNames: string[] | null;
  summary: string;
  detail: string | null;
  photoUrls: string[] | null;
  issues: string | null;
  nextDayPlan: string | null;
  weather: Weather | null;
  workerCount: number | null;
  sharedToCustomer: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyLogRequest {
  siteId: string;
  logDate: string;
  tradesWorked?: string[];
  tradesWorkedNames?: string[];
  summary: string;
  detail?: string;
  photoUrls?: string[];
  issues?: string;
  nextDayPlan?: string;
  weather?: Weather;
  workerCount?: number;
}

export interface UpdateDailyLogRequest {
  tradesWorked?: string[];
  tradesWorkedNames?: string[];
  summary?: string;
  detail?: string;
  photoUrls?: string[];
  issues?: string;
  nextDayPlan?: string;
  weather?: Weather;
  workerCount?: number;
  sharedToCustomer?: boolean;
}
