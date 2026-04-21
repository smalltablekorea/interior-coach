"use client";

import { CheckCircle, Clock, AlertCircle, FileText, Ban } from "lucide-react";

interface Payment {
  id: string;
  milestoneName: string;
  milestoneOrder: number | null;
  amount: number;
  taxAmount: number | null;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
}

interface PaymentTimelineProps {
  payments: Payment[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  paid: { label: "완납", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  invoiced: { label: "청구됨", color: "text-blue-600", bg: "bg-blue-50", icon: FileText },
  pending: { label: "예정", color: "text-gray-500", bg: "bg-gray-50", icon: Clock },
  overdue: { label: "연체", color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
  cancelled: { label: "취소", color: "text-gray-400", bg: "bg-gray-50", icon: Ban },
};

function formatWon(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function PaymentTimeline({ payments }: PaymentTimelineProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        등록된 수금 일정이 없습니다.
      </div>
    );
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount + (p.taxAmount || 0), 0);
  const paidAmount = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount + (p.taxAmount || 0), 0);

  return (
    <div>
      {/* Summary */}
      <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500">총 계약금액</p>
          <p className="font-bold text-gray-900">{formatWon(totalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">납부 완료</p>
          <p className="font-bold text-green-600">{formatWon(paidAmount)}</p>
        </div>
      </div>

      {/* Payment list */}
      <div className="space-y-3">
        {payments.map((payment) => {
          const config = statusConfig[payment.status] || statusConfig.pending;
          const Icon = config.icon;
          const total = payment.amount + (payment.taxAmount || 0);

          return (
            <div
              key={payment.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                payment.status === "overdue"
                  ? "border-red-200 bg-red-50/50"
                  : "border-gray-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}
              >
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {payment.milestoneName}
                </p>
                <p className="text-xs text-gray-500">
                  {payment.status === "paid"
                    ? `납부일: ${formatDate(payment.paidAt as string)}`
                    : `납부기한: ${formatDate(payment.dueDate)}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-gray-900">{formatWon(total)}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}
                >
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
