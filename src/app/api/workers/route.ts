import { NextResponse } from "next/server";

const DEMO_WORKERS = [
  { id: "w1", name: "최영수", phone: "010-1111-2222", trade: "목공", dailyWage: 380000, memo: "경력 15년" },
  { id: "w2", name: "장현우", phone: "010-3333-4444", trade: "전기", dailyWage: 300000, memo: null },
  { id: "w3", name: "한도현", phone: "010-5555-6666", trade: "설비", dailyWage: 320000, memo: "보일러 전문" },
  { id: "w4", name: "이태훈", phone: "010-7777-8888", trade: "타일", dailyWage: 350000, memo: null },
  { id: "w5", name: "김상호", phone: "010-9999-0000", trade: "도배", dailyWage: 280000, memo: "실크/합지 가능" },
  { id: "w6", name: "정우진", phone: "010-2222-3333", trade: "철거", dailyWage: 250000, memo: null },
];

export async function GET() {
  return NextResponse.json(DEMO_WORKERS);
}

export async function POST() {
  return NextResponse.json({ message: "DB 미연결 (데모 모드)" }, { status: 503 });
}
