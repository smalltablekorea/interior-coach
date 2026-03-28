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
    // Get ad accounts
    const accountResp = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${token}`
    );
    if (!accountResp.ok) throw new Error("광고 계정 조회 실패");
    const accountData = await accountResp.json();
    const adAccount = accountData.data?.[0];
    if (!adAccount) throw new Error("연결된 광고 계정이 없습니다");

    // Get account-level insights
    const insightsResp = await fetch(
      `https://graph.facebook.com/v19.0/${adAccount.id}/insights?` +
        new URLSearchParams({
          fields: "impressions,clicks,spend,ctr,cpc,cpm,reach,actions,conversions,cost_per_action_type",
          date_preset: datePreset,
          access_token: token,
        })
    );

    let insights = null;
    if (insightsResp.ok) {
      const insightsData = await insightsResp.json();
      const row = insightsData.data?.[0];
      if (row) {
        insights = {
          impressions: parseInt(row.impressions || "0"),
          clicks: parseInt(row.clicks || "0"),
          spend: parseFloat(row.spend || "0"),
          ctr: parseFloat(row.ctr || "0"),
          cpc: parseFloat(row.cpc || "0"),
          cpm: parseFloat(row.cpm || "0"),
          reach: parseInt(row.reach || "0"),
          actions: row.actions || [],
          conversions: row.conversions || [],
        };
      }
    }

    // Get campaigns summary
    const campaignsResp = await fetch(
      `https://graph.facebook.com/v19.0/${adAccount.id}/campaigns?` +
        new URLSearchParams({
          fields: "id,name,status,objective,daily_budget,lifetime_budget",
          limit: "20",
          access_token: token,
        })
    );

    let campaigns: { id: string; name: string; status: string; objective: string }[] = [];
    if (campaignsResp.ok) {
      const campaignsData = await campaignsResp.json();
      campaigns = (campaignsData.data || []).map(
        (c: { id: string; name: string; status: string; objective: string }) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
        })
      );
    }

    return NextResponse.json({
      account: {
        id: adAccount.id,
        name: adAccount.name,
        status: adAccount.account_status,
        currency: adAccount.currency,
        timezone: adAccount.timezone_name,
      },
      insights,
      campaigns,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Meta Ads 데이터 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
