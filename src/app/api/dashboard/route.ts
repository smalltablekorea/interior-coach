import { NextResponse } from "next/server";

export async function GET() {
  // 대시보드 집계 데이터 (데모)
  const data = {
    activeSites: 2,
    totalSites: 4,
    monthlyRevenue: 13500000, // 이번달 수금액 (강남 계약금)
    unpaidAmount: 75500000, // 미수금 (중도금+잔금 합계)
    totalExpenses: 5195000, // 이번달 지출 합계
    profitMargin: 28.5, // 예상 이익률
    thisWeekSchedule: 3, // 이번주 공정 수
    recentActivity: [
      { id: "a1", type: "payment", message: "강남 래미안 계약금 1,350만원 수금", date: "2026-03-05", icon: "wallet" },
      { id: "a2", type: "phase", message: "강남 래미안 철거 공정 완료", date: "2026-03-03", icon: "check" },
      { id: "a3", type: "expense", message: "타일 자재 구매 120만원 지출", date: "2026-03-15", icon: "receipt" },
      { id: "a4", type: "contract", message: "잠실 엘스 42평 계약 체결 (6,200만원)", date: "2026-03-01", icon: "file" },
      { id: "a5", type: "estimate", message: "반포 주방/욕실 견적서 작성중", date: "2026-03-13", icon: "edit" },
    ],
    projectProfits: [
      { name: "강남 래미안", revenue: 45000000, expense: 32000000, profit: 13000000 },
      { name: "잠실 엘스", revenue: 62000000, expense: 44000000, profit: 18000000 },
    ],
  };

  return NextResponse.json(data);
}
