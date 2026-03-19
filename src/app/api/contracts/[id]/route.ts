import { NextResponse } from "next/server";

const DEMO_CONTRACTS: Record<string, object> = {
  ct1: {
    id: "ct1",
    contractAmount: 45000000,
    contractDate: "2026-03-05",
    siteName: "강남 래미안 32평 리모델링",
    siteId: "s1",
    customerName: "김민수",
    customerPhone: "010-1234-5678",
    memo: "전체 리모델링 계약",
    createdAt: "2026-03-05T09:00:00Z",
    estimateId: "e1",
    estimateAmount: 45000000,
    payments: [
      { id: "p1", type: "계약금", amount: 13500000, dueDate: "2026-03-05", paidDate: "2026-03-05", status: "완납", method: "계좌이체" },
      { id: "p2", type: "중도금", amount: 18000000, dueDate: "2026-03-25", paidDate: null, status: "미수", method: null },
      { id: "p3", type: "잔금", amount: 13500000, dueDate: "2026-04-15", paidDate: null, status: "미수", method: null },
    ],
  },
  ct2: {
    id: "ct2",
    contractAmount: 62000000,
    contractDate: "2026-03-01",
    siteName: "잠실 엘스 42평 전체시공",
    siteId: "s4",
    customerName: "김민수",
    customerPhone: "010-1234-5678",
    memo: null,
    createdAt: "2026-03-01T09:00:00Z",
    estimateId: "e3",
    estimateAmount: 62000000,
    payments: [
      { id: "p4", type: "계약금", amount: 18600000, dueDate: "2026-03-01", paidDate: "2026-03-01", status: "완납", method: "계좌이체" },
      { id: "p5", type: "중도금", amount: 24800000, dueDate: "2026-04-15", paidDate: null, status: "미수", method: null },
      { id: "p6", type: "잔금", amount: 18600000, dueDate: "2026-05-30", paidDate: null, status: "미수", method: null },
    ],
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contract = DEMO_CONTRACTS[id];
  if (!contract) {
    return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json(contract);
}

export async function PUT() {
  return NextResponse.json({ message: "저장되었습니다 (데모 모드)" });
}

export async function DELETE() {
  return NextResponse.json({ message: "삭제되었습니다 (데모 모드)" });
}
