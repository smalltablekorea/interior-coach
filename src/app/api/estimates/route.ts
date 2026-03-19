import { NextResponse } from "next/server";

const DEMO_ESTIMATES = [
  { id: "e1", version: 1, totalAmount: 45000000, status: "승인", siteName: "강남 래미안 32평 리모델링", siteId: "s1", createdAt: "2026-03-02T09:00:00Z" },
  { id: "e2", version: 1, totalAmount: 18000000, status: "작성중", siteName: "반포 주방/욕실 리모델링", siteId: "s2", createdAt: "2026-03-13T14:00:00Z" },
  { id: "e3", version: 2, totalAmount: 62000000, status: "발송", siteName: "잠실 엘스 42평 전체시공", siteId: "s4", createdAt: "2026-02-25T11:00:00Z" },
];

export async function GET() {
  return NextResponse.json(DEMO_ESTIMATES);
}

export async function POST() {
  return NextResponse.json({ message: "DB 미연결 (데모 모드)" }, { status: 503 });
}
