import { NextResponse } from "next/server";

const DEMO_WORKERS: Record<string, object> = {
  w1: {
    id: "w1",
    name: "최영수",
    phone: "010-1111-2222",
    trade: "목공",
    dailyWage: 380000,
    memo: "경력 15년",
    assignments: [
      { siteId: "s1", siteName: "강남 래미안 32평 리모델링", category: "목공", dates: "2026-03-07 ~ 03-15", dailyWage: 380000, days: 7, totalWage: 2660000 },
    ],
  },
  w2: {
    id: "w2",
    name: "장현우",
    phone: "010-3333-4444",
    trade: "전기",
    dailyWage: 300000,
    memo: null,
    assignments: [
      { siteId: "s1", siteName: "강남 래미안 32평 리모델링", category: "전기", dates: "2026-03-04 ~ 03-06", dailyWage: 300000, days: 3, totalWage: 900000 },
    ],
  },
  w3: {
    id: "w3",
    name: "한도현",
    phone: "010-5555-6666",
    trade: "설비",
    dailyWage: 320000,
    memo: "보일러 전문",
    assignments: [
      { siteId: "s1", siteName: "강남 래미안 32평 리모델링", category: "설비", dates: "2026-03-04 ~ 03-06", dailyWage: 320000, days: 3, totalWage: 960000 },
    ],
  },
  w4: {
    id: "w4",
    name: "이태훈",
    phone: "010-7777-8888",
    trade: "타일",
    dailyWage: 350000,
    memo: null,
    assignments: [
      { siteId: "s1", siteName: "강남 래미안 32평 리모델링", category: "타일", dates: "2026-03-16 ~ 03-20", dailyWage: 350000, days: 5, totalWage: 1750000 },
    ],
  },
  w5: {
    id: "w5",
    name: "김상호",
    phone: "010-9999-0000",
    trade: "도배",
    dailyWage: 280000,
    memo: "실크/합지 가능",
    assignments: [
      { siteId: "s1", siteName: "강남 래미안 32평 리모델링", category: "도배", dates: "2026-03-21 ~ 03-23", dailyWage: 280000, days: 3, totalWage: 840000 },
    ],
  },
  w6: {
    id: "w6",
    name: "정우진",
    phone: "010-2222-3333",
    trade: "철거",
    dailyWage: 250000,
    memo: null,
    assignments: [
      { siteId: "s1", siteName: "강남 래미안 32평 리모델링", category: "철거", dates: "2026-03-01 ~ 03-03", dailyWage: 250000, days: 3, totalWage: 750000 },
    ],
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const worker = DEMO_WORKERS[id];
  if (!worker) {
    return NextResponse.json({ error: "작업자를 찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json(worker);
}

export async function PUT() {
  return NextResponse.json({ message: "저장되었습니다 (데모 모드)" });
}

export async function DELETE() {
  return NextResponse.json({ message: "삭제되었습니다 (데모 모드)" });
}
