import { NextResponse } from "next/server";

const DEMO_ESTIMATES: Record<string, object> = {
  e1: {
    id: "e1",
    version: 1,
    totalAmount: 45000000,
    status: "승인",
    siteName: "강남 래미안 32평 리모델링",
    siteId: "s1",
    createdAt: "2026-03-02T09:00:00Z",
    customerName: "김민수",
    customerPhone: "010-1234-5678",
    siteAddress: "서울 강남구 역삼동 123-4",
    areaPyeong: 32,
    profitRate: 10,
    overheadRate: 5,
    vatEnabled: true,
    items: [
      { id: "ei1", category: "철거", itemName: "기존 구조물 철거", unit: "식", quantity: 1, unitPrice: 3500000, amount: 3500000 },
      { id: "ei2", category: "철거", itemName: "폐기물 처리", unit: "식", quantity: 1, unitPrice: 800000, amount: 800000 },
      { id: "ei3", category: "설비", itemName: "급·배수 배관 교체", unit: "식", quantity: 1, unitPrice: 4200000, amount: 4200000 },
      { id: "ei4", category: "설비", itemName: "보일러 교체", unit: "대", quantity: 1, unitPrice: 1800000, amount: 1800000 },
      { id: "ei5", category: "전기", itemName: "전기 배선 공사", unit: "식", quantity: 1, unitPrice: 3200000, amount: 3200000 },
      { id: "ei6", category: "전기", itemName: "조명 설치", unit: "개", quantity: 15, unitPrice: 80000, amount: 1200000 },
      { id: "ei7", category: "목공", itemName: "천장 몰딩·걸레받이", unit: "식", quantity: 1, unitPrice: 2800000, amount: 2800000 },
      { id: "ei8", category: "목공", itemName: "붙박이장 제작", unit: "식", quantity: 1, unitPrice: 4500000, amount: 4500000 },
      { id: "ei9", category: "타일", itemName: "욕실 타일 시공", unit: "식", quantity: 2, unitPrice: 2200000, amount: 4400000 },
      { id: "ei10", category: "타일", itemName: "주방 타일 시공", unit: "식", quantity: 1, unitPrice: 1500000, amount: 1500000 },
      { id: "ei11", category: "도배", itemName: "실크 벽지 시공", unit: "롤", quantity: 45, unitPrice: 55000, amount: 2475000 },
      { id: "ei12", category: "바닥", itemName: "강마루 시공", unit: "평", quantity: 28, unitPrice: 75000, amount: 2100000 },
    ],
  },
  e2: {
    id: "e2",
    version: 1,
    totalAmount: 18000000,
    status: "작성중",
    siteName: "반포 주방/욕실 리모델링",
    siteId: "s2",
    createdAt: "2026-03-13T14:00:00Z",
    customerName: "이정희",
    customerPhone: "010-9876-5432",
    siteAddress: "서울 서초구 반포동 456-7",
    areaPyeong: 24,
    profitRate: 10,
    overheadRate: 5,
    vatEnabled: true,
    items: [
      { id: "ei20", category: "철거", itemName: "주방·욕실 철거", unit: "식", quantity: 1, unitPrice: 2000000, amount: 2000000 },
      { id: "ei21", category: "설비", itemName: "급·배수 배관", unit: "식", quantity: 1, unitPrice: 3000000, amount: 3000000 },
      { id: "ei22", category: "타일", itemName: "욕실 타일", unit: "식", quantity: 1, unitPrice: 2500000, amount: 2500000 },
      { id: "ei23", category: "타일", itemName: "주방 타일", unit: "식", quantity: 1, unitPrice: 1800000, amount: 1800000 },
    ],
  },
  e3: {
    id: "e3",
    version: 2,
    totalAmount: 62000000,
    status: "발송",
    siteName: "잠실 엘스 42평 전체시공",
    siteId: "s4",
    createdAt: "2026-02-25T11:00:00Z",
    customerName: "김민수",
    customerPhone: "010-1234-5678",
    siteAddress: "서울 송파구 잠실동 88",
    areaPyeong: 42,
    profitRate: 12,
    overheadRate: 6,
    vatEnabled: true,
    items: [
      { id: "ei30", category: "철거", itemName: "전체 철거", unit: "식", quantity: 1, unitPrice: 5000000, amount: 5000000 },
      { id: "ei31", category: "설비", itemName: "전체 배관 교체", unit: "식", quantity: 1, unitPrice: 6500000, amount: 6500000 },
      { id: "ei32", category: "전기", itemName: "전기 전체 교체", unit: "식", quantity: 1, unitPrice: 5200000, amount: 5200000 },
      { id: "ei33", category: "목공", itemName: "천장·몰딩·가구", unit: "식", quantity: 1, unitPrice: 8500000, amount: 8500000 },
      { id: "ei34", category: "타일", itemName: "욕실 2개소·주방", unit: "식", quantity: 1, unitPrice: 7200000, amount: 7200000 },
      { id: "ei35", category: "도배", itemName: "전체 도배", unit: "식", quantity: 1, unitPrice: 4800000, amount: 4800000 },
      { id: "ei36", category: "바닥", itemName: "강마루 전체", unit: "평", quantity: 38, unitPrice: 80000, amount: 3040000 },
    ],
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const estimate = DEMO_ESTIMATES[id];
  if (!estimate) {
    return NextResponse.json({ error: "견적을 찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json(estimate);
}

export async function PUT() {
  return NextResponse.json({ message: "저장되었습니다 (데모 모드)" });
}

export async function DELETE() {
  return NextResponse.json({ message: "삭제되었습니다 (데모 모드)" });
}
