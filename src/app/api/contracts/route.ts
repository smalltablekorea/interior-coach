import { NextResponse } from "next/server";

const DEMO_CONTRACTS = [
  {
    id: "ct1",
    contractAmount: 45000000,
    contractDate: "2026-03-05",
    siteName: "강남 래미안 32평 리모델링",
    createdAt: "2026-03-05T09:00:00Z",
    payments: [
      { id: "p1", type: "계약금", amount: 13500000, dueDate: "2026-03-05", paidDate: "2026-03-05", status: "완납" },
      { id: "p2", type: "중도금", amount: 18000000, dueDate: "2026-03-25", paidDate: null, status: "미수" },
      { id: "p3", type: "잔금", amount: 13500000, dueDate: "2026-04-15", paidDate: null, status: "미수" },
    ],
  },
  {
    id: "ct2",
    contractAmount: 62000000,
    contractDate: "2026-03-01",
    siteName: "잠실 엘스 42평 전체시공",
    createdAt: "2026-03-01T09:00:00Z",
    payments: [
      { id: "p4", type: "계약금", amount: 18600000, dueDate: "2026-03-01", paidDate: "2026-03-01", status: "완납" },
      { id: "p5", type: "중도금", amount: 24800000, dueDate: "2026-04-15", paidDate: null, status: "미수" },
      { id: "p6", type: "잔금", amount: 18600000, dueDate: "2026-05-30", paidDate: null, status: "미수" },
    ],
  },
];

export async function GET() {
  return NextResponse.json(DEMO_CONTRACTS);
}

export async function POST() {
  return NextResponse.json({ message: "DB 미연결 (데모 모드)" }, { status: 503 });
}
