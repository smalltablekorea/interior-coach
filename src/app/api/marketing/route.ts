import { NextResponse } from "next/server";

const DEMO_INQUIRIES = [
  { id: "inq1", date: "2026-03-16", customerName: "김서연", phone: "010-1234-5678", channel: "네이버", content: "강남구 아파트 32평 전체 리모델링 문의", status: "신규" },
  { id: "inq2", date: "2026-03-15", customerName: "이준혁", phone: "010-2345-6789", channel: "인스타", content: "서초구 빌라 24평 부분 인테리어 (욕실+주방)", status: "상담중" },
  { id: "inq3", date: "2026-03-14", customerName: "박지민", phone: "010-3456-7890", channel: "지인소개", content: "송파구 아파트 42평 신혼집 인테리어", status: "견적발송" },
  { id: "inq4", date: "2026-03-12", customerName: "최영수", phone: "010-4567-8901", channel: "네이버", content: "마포구 오피스텔 16평 원룸 리모델링", status: "계약완료" },
  { id: "inq5", date: "2026-03-10", customerName: "정하은", phone: "010-5678-9012", channel: "현수막", content: "용산구 아파트 28평 욕실 리모델링", status: "상담중" },
  { id: "inq6", date: "2026-03-08", customerName: "한도윤", phone: "010-6789-0123", channel: "인스타", content: "성동구 빌라 20평 전체 인테리어", status: "계약완료" },
  { id: "inq7", date: "2026-03-05", customerName: "오수빈", phone: "010-7890-1234", channel: "네이버", content: "강동구 아파트 35평 주방 리모델링", status: "실패" },
  { id: "inq8", date: "2026-03-03", customerName: "윤태호", phone: "010-8901-2345", channel: "기타", content: "관악구 주택 40평 전체 리모델링", status: "견적발송" },
  { id: "inq9", date: "2026-03-01", customerName: "신미래", phone: "010-9012-3456", channel: "지인소개", content: "강서구 아파트 30평 거실+방 인테리어", status: "신규" },
];

const DEMO_CAMPAIGNS = [
  { id: "ad1", channel: "네이버", name: "네이버 키워드광고 - 강남 인테리어", startDate: "2026-03-01", endDate: "2026-03-31", budget: 2000000, spent: 1350000, inquiries: 12 },
  { id: "ad2", channel: "인스타", name: "인스타 릴스 광고 - 시공사례", startDate: "2026-03-01", endDate: "2026-03-31", budget: 1500000, spent: 980000, inquiries: 8 },
  { id: "ad3", channel: "페이스북", name: "페이스북 리타겟팅 광고", startDate: "2026-03-01", endDate: "2026-03-31", budget: 800000, spent: 650000, inquiries: 3 },
  { id: "ad4", channel: "유튜브", name: "유튜브 시공과정 영상광고", startDate: "2026-03-10", endDate: "2026-03-31", budget: 1200000, spent: 420000, inquiries: 5 },
  { id: "ad5", channel: "네이버", name: "네이버 블로그 체험단", startDate: "2026-02-15", endDate: "2026-03-15", budget: 500000, spent: 500000, inquiries: 6 },
];

const DEMO_PORTFOLIO = [
  { id: "pf1", projectName: "강남 래미안 모던 리모델링", location: "서울 강남구 도곡동", area: "32평", duration: "6주", photoUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600", tags: ["모던", "미니멀"] },
  { id: "pf2", projectName: "서초 반포자이 클래식 인테리어", location: "서울 서초구 반포동", area: "45평", duration: "8주", photoUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600", tags: ["클래식", "럭셔리"] },
  { id: "pf3", projectName: "성수동 빌라 북유럽풍", location: "서울 성동구 성수동", area: "22평", duration: "4주", photoUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600", tags: ["북유럽", "내추럴"] },
  { id: "pf4", projectName: "잠실 엘스 미니멀 리모델링", location: "서울 송파구 잠실동", area: "42평", duration: "7주", photoUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600", tags: ["미니멀", "모던"] },
  { id: "pf5", projectName: "마포 래미안 내추럴 인테리어", location: "서울 마포구 공덕동", area: "28평", duration: "5주", photoUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600", tags: ["내추럴", "북유럽"] },
];

export async function GET() {
  return NextResponse.json({
    inquiries: DEMO_INQUIRIES,
    campaigns: DEMO_CAMPAIGNS,
    portfolio: DEMO_PORTFOLIO,
  });
}

export async function POST() {
  return NextResponse.json(
    { message: "DB 미연결 (데모 모드)" },
    { status: 503 }
  );
}
