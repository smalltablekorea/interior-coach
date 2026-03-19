import { NextResponse } from "next/server";

const DEMO_PHASES = [
  { id: "ph1", category: "철거", plannedStart: "2026-03-01", plannedEnd: "2026-03-03", actualStart: "2026-03-01", actualEnd: "2026-03-03", progress: 100, status: "완료", memo: null, siteId: "s1", siteName: "강남 래미안 32평 리모델링" },
  { id: "ph2", category: "설비", plannedStart: "2026-03-04", plannedEnd: "2026-03-06", actualStart: "2026-03-04", actualEnd: null, progress: 80, status: "진행중", memo: null, siteId: "s1", siteName: "강남 래미안 32평 리모델링" },
  { id: "ph3", category: "전기", plannedStart: "2026-03-04", plannedEnd: "2026-03-06", actualStart: "2026-03-04", actualEnd: null, progress: 60, status: "진행중", memo: null, siteId: "s1", siteName: "강남 래미안 32평 리모델링" },
  { id: "ph4", category: "목공", plannedStart: "2026-03-07", plannedEnd: "2026-03-15", actualStart: null, actualEnd: null, progress: 0, status: "대기", memo: null, siteId: "s1", siteName: "강남 래미안 32평 리모델링" },
  { id: "ph5", category: "타일", plannedStart: "2026-03-16", plannedEnd: "2026-03-20", actualStart: null, actualEnd: null, progress: 0, status: "대기", memo: null, siteId: "s1", siteName: "강남 래미안 32평 리모델링" },
  { id: "ph6", category: "도배", plannedStart: "2026-03-21", plannedEnd: "2026-03-23", actualStart: null, actualEnd: null, progress: 0, status: "대기", memo: null, siteId: "s1", siteName: "강남 래미안 32평 리모델링" },
];

export async function GET() {
  return NextResponse.json(DEMO_PHASES);
}

export async function POST() {
  return NextResponse.json({ message: "DB 미연결 (데모 모드)" }, { status: 503 });
}
