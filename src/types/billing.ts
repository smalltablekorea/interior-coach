export type BillingStatus = "pending" | "invoiced" | "paid" | "overdue" | "cancelled";

export interface Billing {
  id: string;
  siteId: string;
  siteName?: string;
  milestoneName: string;
  tradeId: string | null;
  milestoneOrder: number | null;
  amount: number;
  taxAmount: number | null;
  totalAmount: number; // computed: amount + taxAmount
  status: BillingStatus;
  dueDate: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
  invoiceNumber: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillingRequest {
  siteId: string;
  milestoneName: string;
  tradeId?: string;
  milestoneOrder?: number;
  amount: number;
  taxAmount?: number;
  status?: BillingStatus;
  dueDate?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface UpdateBillingRequest {
  milestoneName?: string;
  tradeId?: string;
  milestoneOrder?: number;
  amount?: number;
  taxAmount?: number;
  status?: BillingStatus;
  dueDate?: string;
  invoicedAt?: string;
  paidAt?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface BillingStats {
  totalAmount: number;
  totalTaxAmount: number;
  totalWithTax: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
  byStatus: Record<BillingStatus, { count: number; amount: number }>;
}
