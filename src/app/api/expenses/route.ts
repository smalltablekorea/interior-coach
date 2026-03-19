import { NextResponse } from "next/server";

const DEMO_EXPENSES = [
  { id: "ex1", date: "2026-03-15", category: "자재비", description: "타일 자재 구매 (욕실)", amount: 1200000, siteId: "s1", siteName: "강남 래미안 32평 리모델링", paymentMethod: "카드", receiptUrl: null },
  { id: "ex2", date: "2026-03-14", category: "인건비", description: "철거 작업 인건비 (2일)", amount: 500000, siteId: "s1", siteName: "강남 래미안 32평 리모델링", paymentMethod: "계좌이체", receiptUrl: null },
  { id: "ex3", date: "2026-03-13", category: "자재비", description: "배관 자재 (PVC, 연결부속)", amount: 380000, siteId: "s1", siteName: "강남 래미안 32평 리모델링", paymentMethod: "카드", receiptUrl: null },
  { id: "ex4", date: "2026-03-12", category: "운반비", description: "철거 폐기물 처리", amount: 250000, siteId: "s1", siteName: "강남 래미안 32평 리모델링", paymentMethod: "현금", receiptUrl: null },
  { id: "ex5", date: "2026-03-10", category: "인건비", description: "설비 작업 인건비 (3일)", amount: 960000, siteId: "s1", siteName: "강남 래미안 32평 리모델링", paymentMethod: "계좌이체", receiptUrl: null },
  { id: "ex6", date: "2026-03-08", category: "자재비", description: "전선·스위치·콘센트", amount: 420000, siteId: "s1", siteName: "강남 래미안 32평 리모델링", paymentMethod: "카드", receiptUrl: null },
  { id: "ex7", date: "2026-03-05", category: "기타", description: "현장 식대", amount: 85000, siteId: "s1", siteName: "강남 래미안 32평 리모델링", paymentMethod: "현금", receiptUrl: null },
  { id: "ex8", date: "2026-03-03", category: "자재비", description: "석고보드·합판 구매", amount: 650000, siteId: "s4", siteName: "잠실 엘스 42평 전체시공", paymentMethod: "카드", receiptUrl: null },
  { id: "ex9", date: "2026-03-02", category: "인건비", description: "전기 작업 인건비", amount: 600000, siteId: "s4", siteName: "잠실 엘스 42평 전체시공", paymentMethod: "계좌이체", receiptUrl: null },
  { id: "ex10", date: "2026-03-01", category: "운반비", description: "자재 운반비", amount: 150000, siteId: "s4", siteName: "잠실 엘스 42평 전체시공", paymentMethod: "현금", receiptUrl: null },
];

export async function GET() {
  return NextResponse.json(DEMO_EXPENSES);
}

export async function POST() {
  return NextResponse.json({ message: "DB 미연결 (데모 모드)" }, { status: 503 });
}
