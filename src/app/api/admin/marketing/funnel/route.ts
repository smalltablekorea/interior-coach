import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktDailyMetrics } from "@/lib/db/schema";
import { and, gte, lte, sum } from "drizzle-orm";
import { FUNNEL_STAGES } from "@/lib/types/marketing";
import type { FunnelResponse, FunnelStage } from "@/lib/types/marketing";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || getDefaultFrom();
  const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);
  const channel = searchParams.get("channel") || undefined;
  const campaign = searchParams.get("campaign") || undefined;
  const device = searchParams.get("device") || undefined;

  try {
    const [agg] = await db
      .select({
        visits: sum(mktDailyMetrics.visits),
        signups: sum(mktDailyMetrics.signups),
        logins: sum(mktDailyMetrics.logins),
        uploadStarts: sum(mktDailyMetrics.uploadStarts),
        uploadSubmits: sum(mktDailyMetrics.uploadSubmits),
        analysisCompleted: sum(mktDailyMetrics.analysisCompleted),
        checkoutStarts: sum(mktDailyMetrics.checkoutStarts),
        paymentSucceeded: sum(mktDailyMetrics.paymentSucceeded),
        reportViews: sum(mktDailyMetrics.reportViews),
        inquiries: sum(mktDailyMetrics.inquiries),
      })
      .from(mktDailyMetrics)
      .where(and(gte(mktDailyMetrics.date, from), lte(mktDailyMetrics.date, to)));

    const values: Record<string, number> = {
      visit: Number(agg?.visits ?? 0),
      signup: Number(agg?.signups ?? 0),
      login: Number(agg?.logins ?? 0),
      upload_start: Number(agg?.uploadStarts ?? 0),
      upload_submit: Number(agg?.uploadSubmits ?? 0),
      analysis_done: Number(agg?.analysisCompleted ?? 0),
      checkout_start: Number(agg?.checkoutStarts ?? 0),
      payment_done: Number(agg?.paymentSucceeded ?? 0),
      report_view: Number(agg?.reportViews ?? 0),
      inquiry: Number(agg?.inquiries ?? 0),
    };

    const stages: FunnelStage[] = FUNNEL_STAGES.map((stage, i) => {
      const currentCount = values[stage.key] || 0;
      const prevCount = i > 0 ? (values[FUNNEL_STAGES[i - 1].key] || 0) : currentCount;
      const conversionRate = prevCount > 0 ? Math.round((currentCount / prevCount) * 1000) / 10 : 0;
      const dropoffRate = prevCount > 0 ? Math.round(((prevCount - currentCount) / prevCount) * 1000) / 10 : 0;

      return {
        key: stage.key,
        label: stage.label,
        count: currentCount,
        conversionRate: i === 0 ? 100 : conversionRate,
        dropoffRate: i === 0 ? 0 : dropoffRate,
      };
    });

    const response: FunnelResponse = {
      stages,
      period: { from, to },
      filters: { channel, campaign, device },
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "퍼널 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
