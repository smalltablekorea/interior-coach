import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const datePreset =
    request.nextUrl.searchParams.get("date_preset") || "last_30d";

  const token = await getValidToken(auth.userId, "meta_ads");
  if (!token) {
    return NextResponse.json(
      { error: "Meta Ads 계정이 연결되지 않았습니다." },
      { status: 401 }
    );
  }

  try {
    // Get ad account ID
    const accountResp = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${token}`
    );
    if (!accountResp.ok)
      throw new Error("광고 계정 조회 실패");

    const accountData = await accountResp.json();
    const adAccountId = accountData.data?.[0]?.id;
    if (!adAccountId)
      throw new Error("연결된 광고 계정이 없습니다");

    // Get insights
    const insightsResp = await fetch(
      `https://graph.facebook.com/v19.0/${adAccountId}/insights?` +
        new URLSearchParams({
          fields:
            "impressions,clicks,spend,ctr,cpc,cpm,reach,actions",
          date_preset: datePreset,
          access_token: token,
        })
    );
    if (!insightsResp.ok)
      throw new Error("광고 데이터 조회 실패");

    const insightsData = await insightsResp.json();
    return NextResponse.json(insightsData);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Meta Ads 데이터 조회 실패";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
