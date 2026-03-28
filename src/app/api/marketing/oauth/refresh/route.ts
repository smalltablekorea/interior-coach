import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { channel } = await request.json();
  if (!channel) {
    return NextResponse.json(
      { error: "channel required" },
      { status: 400 }
    );
  }

  const token = await getValidToken(auth.userId, channel);
  if (!token) {
    return NextResponse.json(
      { error: "토큰 갱신에 실패했습니다. 계정을 다시 연결해주세요." },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
