// ─── 공통 API 응답 타입 ───

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  offset: number;
}

// ─── 공통 쿼리 파라미터 ───

export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: string;
}

// ─── 엔티티 타입 (프론트엔드 공유용) ───

export interface Company {
  id: string;
  name: string;
  ceoName: string | null;
  businessNumber: string | null;
  phone: string | null;
  address: string | null;
  plan: "free" | "starter" | "pro";
  planExpiresAt: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string | null;
  status: string;
  memo: string | null;
  createdAt: string;
}

export interface Site {
  id: string;
  customerId: string | null;
  customerName?: string | null;
  name: string;
  address: string | null;
  areaPyeong: number | null;
  buildingType: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface Estimate {
  id: string;
  siteId: string | null;
  siteName?: string | null;
  version: number;
  totalAmount: number;
  profitRate: number;
  overheadRate: number;
  vatEnabled: boolean;
  grade: string | null;
  status: string;
  memo: string | null;
  items?: EstimateItem[];
  createdAt: string;
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  category: string;
  itemName: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  memo: string | null;
}

export interface Contract {
  id: string;
  siteId: string | null;
  siteName?: string | null;
  estimateId: string | null;
  contractAmount: number;
  deposit: number;
  status: string;
  contractDate: string | null;
  memo: string | null;
  payments?: ContractPayment[];
  createdAt: string;
}

export interface ContractPayment {
  id: string;
  contractId: string;
  type: string;
  amount: number;
  dueDate: string | null;
  paidDate: string | null;
  status: string;
  memo: string | null;
}

export interface Worker {
  id: string;
  name: string;
  phone: string | null;
  trade: string;
  dailyWage: number | null;
  memo: string | null;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  grade: string | null;
  unit: string | null;
  unitPrice: number | null;
  supplier: string | null;
  memo: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  siteId: string | null;
  siteName?: string | null;
  category: string;
  description: string | null;
  amount: number;
  date: string | null;
  paymentMethod: string | null;
  vendor: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface Schedule {
  id: string;
  siteId: string | null;
  siteName?: string | null;
  title: string;
  date: string;
  type: string | null;
  assigneeId: string | null;
  assigneeName?: string | null;
  status: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}
