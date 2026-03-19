import { NextResponse } from "next/server";

// Demo photo data grouped by date
const DEMO_PHOTOS: Record<string, object[]> = {
  s1: [
    {
      id: "photo1",
      url: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=300&h=300&fit=crop",
      date: "2026-03-01",
      category: "철거",
      caption: "기존 주방 철거 시작",
      uploadedBy: "정우진",
      comments: [
        { id: "cm1", author: "김민수", text: "싱크대 배관 상태 확인 부탁드립니다", createdAt: "2026-03-01T10:30:00Z" },
        { id: "cm2", author: "정우진", text: "배관 상태 양호합니다. 교체 없이 진행 가능", createdAt: "2026-03-01T11:15:00Z" },
      ],
    },
    {
      id: "photo2",
      url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=300&fit=crop",
      date: "2026-03-01",
      category: "철거",
      caption: "거실 바닥재 철거 완료",
      uploadedBy: "정우진",
      comments: [
        { id: "cm3", author: "관리자", text: "바닥 평탄 작업 필요해 보입니다", createdAt: "2026-03-01T16:00:00Z" },
      ],
    },
    {
      id: "photo3",
      url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300&h=300&fit=crop",
      date: "2026-03-02",
      category: "철거",
      caption: "욕실 타일 철거",
      uploadedBy: "정우진",
      comments: [],
    },
    {
      id: "photo4",
      url: "https://images.unsplash.com/photo-1585128903994-9788298932a4?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1585128903994-9788298932a4?w=300&h=300&fit=crop",
      date: "2026-03-03",
      category: "철거",
      caption: "철거 완료 전경",
      uploadedBy: "정우진",
      comments: [
        { id: "cm4", author: "김민수", text: "깔끔하게 잘 됐네요", createdAt: "2026-03-03T17:00:00Z" },
      ],
    },
    {
      id: "photo5",
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop",
      date: "2026-03-04",
      category: "설비",
      caption: "급수 배관 교체 작업",
      uploadedBy: "한도현",
      comments: [
        { id: "cm5", author: "관리자", text: "동파이프로 교체하나요?", createdAt: "2026-03-04T09:30:00Z" },
        { id: "cm6", author: "한도현", text: "네, 동파이프로 전체 교체합니다", createdAt: "2026-03-04T09:45:00Z" },
      ],
    },
    {
      id: "photo6",
      url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop",
      date: "2026-03-04",
      category: "전기",
      caption: "전기 배선 작업 진행",
      uploadedBy: "장현우",
      comments: [],
    },
    {
      id: "photo7",
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop",
      date: "2026-03-05",
      category: "설비",
      caption: "배수관 연결 완료",
      uploadedBy: "한도현",
      comments: [
        { id: "cm7", author: "김민수", text: "수압 테스트 결과 알려주세요", createdAt: "2026-03-05T14:00:00Z" },
        { id: "cm8", author: "한도현", text: "수압 정상 확인했습니다. 사진 추가로 올리겠습니다", createdAt: "2026-03-05T14:30:00Z" },
      ],
    },
  ],
  s2: [],
  s3: [],
  s4: [
    {
      id: "photo10",
      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&h=300&fit=crop",
      date: "2026-02-25",
      category: "현장답사",
      caption: "시공 전 현장 답사",
      uploadedBy: "관리자",
      comments: [
        { id: "cm9", author: "김민수", text: "베란다 확장도 가능한지 확인 부탁드립니다", createdAt: "2026-02-25T15:00:00Z" },
      ],
    },
  ],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photos = DEMO_PHOTOS[id] || [];
  return NextResponse.json(photos);
}

export async function POST() {
  // Demo mode - in production this would save to DB + R2/S3
  return NextResponse.json({ message: "DB 미연결 (데모 모드)" }, { status: 503 });
}
