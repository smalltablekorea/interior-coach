import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktDailyMetrics, mktLeads } from "@/lib/db/schema";
import { sql, eq, and, gte, lte, count, sum } from "drizzle-orm";
import type { OverviewResponse, OverviewKPI, ActionItem, AnomalyAlert } from "@/lib/types/marketing";

function daysBefore(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function calcChange(current: number, previous: number): { changePercent: number; changeDirection: "up" | "down" | "flat" } {
  if (previous === 0) return { changePercent: current > 0 ? 100 : 0, changeDirection: current > 0 ? "up" : "flat" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { changePercent: Math.abs(pct), changeDirection: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "7d";
  const days = period === "30d" ? 30 : period === "14d" ? 14 : 7;

  const fromDate = daysBefore(days);
  const toDate = daysBefore(0);
  const prevFromDate = daysBefore(days * 2);
  const prevToDate = daysBefore(days);

  try {
    // 현재 기간 집계
    const [current] = await db
      .select({
        signups: sum(mktDailyMetrics.signups),
        uploadStarts: sum(mktDailyMetrics.uploadStarts),
        uploadSubmits: sum(mktDailyMetrics.uploadSubmits),
        analysisCompleted: sum(mktDailyMetrics.analysisCompleted),
        checkoutStarts: sum(mktDailyMetrics.checkoutStarts),
        paymentSucceeded: sum(mktDailyMetrics.paymentSucceeded),
        revenue: sum(mktDailyMetrics.revenue),
        inquiries: sum(mktDailyMetrics.inquiries),
      })
      .from(mktDailyMetrics)
      .where(and(gte(mktDailyMetrics.date, fromDate), lte(mktDailyMetrics.date, toDate)));

    // 이전 기간 집계
    const [previous] = await db
      .select({
        signups: sum(mktDailyMetrics.signups),
        uploadStarts: sum(mktDailyMetrics.uploadStarts),
        uploadSubmits: sum(mktDailyMetrics.uploadSubmits),
        analysisCompleted: sum(mktDailyMetrics.analysisCompleted),
        checkoutStarts: sum(mktDailyMetrics.checkoutStarts),
        paymentSucceeded: sum(mktDailyMetrics.paymentSucceeded),
        revenue: sum(mktDailyMetrics.revenue),
        inquiries: sum(mktDailyMetrics.inquiries),
      })
      .from(mktDailyMetrics)
      .where(and(gte(mktDailyMetrics.date, prevFromDate), lte(mktDailyMetrics.date, prevToDate)));

    const c = {
      signups: Number(current?.signups ?? 0),
      uploadStarts: Number(current?.uploadStarts ?? 0),
      uploadSubmits: Number(current?.uploadSubmits ?? 0),
      analysisCompleted: Number(current?.analysisCompleted ?? 0),
      checkoutStarts: Number(current?.checkoutStarts ?? 0),
      paymentSucceeded: Number(current?.paymentSucceeded ?? 0),
      revenue: Number(current?.revenue ?? 0),
      inquiries: Number(current?.inquiries ?? 0),
    };
    const p = {
      signups: Number(previous?.signups ?? 0),
      uploadStarts: Number(previous?.uploadStarts ?? 0),
      uploadSubmits: Number(previous?.uploadSubmits ?? 0),
      analysisCompleted: Number(previous?.analysisCompleted ?? 0),
      checkoutStarts: Number(previous?.checkoutStarts ?? 0),
      paymentSucceeded: Number(previous?.paymentSucceeded ?? 0),
      revenue: Number(previous?.revenue ?? 0),
      inquiries: Number(previous?.inquiries ?? 0),
    };

    const kpis: OverviewKPI[] = [
      { label: "신규가입", key: "signups", value: c.signups, previousValue: p.signups, ...calcChange(c.signups, p.signups) },
      { label: "업로드 시작", key: "upload_starts", value: c.uploadStarts, previousValue: p.uploadStarts, ...calcChange(c.uploadStarts, p.uploadStarts) },
      { label: "업로드 제출", key: "upload_submits", value: c.uploadSubmits, previousValue: p.uploadSubmits, ...calcChange(c.uploadSubmits, p.uploadSubmits) },
      { label: "분석 완료", key: "analysis_completed", value: c.analysisCompleted, previousValue: p.analysisCompleted, ...calcChange(c.analysisCompleted, p.analysisCompleted) },
      { label: "결제 시작", key: "checkout_starts", value: c.checkoutStarts, previousValue: p.checkoutStarts, ...calcChange(c.checkoutStarts, p.checkoutStarts) },
      { label: "결제 성공", key: "payment_succeeded", value: c.paymentSucceeded, previousValue: p.paymentSucceeded, ...calcChange(c.paymentSucceeded, p.paymentSucceeded) },
      { label: "매출", key: "revenue", value: c.revenue, previousValue: p.revenue, ...calcChange(c.revenue, p.revenue) },
      { label: "업체문의", key: "inquiries", value: c.inquiries, previousValue: p.inquiries, ...calcChange(c.inquiries, p.inquiries) },
    ];

    // 액션 아이템: 리드 기반 집계
    const [unpaidAfterUpload] = await db
      .select({ cnt: count() })
      .from(mktLeads)
      .where(and(eq(mktLeads.hasSubmitted, true), eq(mktLeads.hasPaid, false)));

    const [abandonedUpload] = await db
      .select({ cnt: count() })
      .from(mktLeads)
      .where(and(eq(mktLeads.hasSignedUp, true), eq(mktLeads.hasUploaded, false)));

    const dormantDate = new Date();
    dormantDate.setDate(dormantDate.getDate() - 7);
    const [dormant] = await db
      .select({ cnt: count() })
      .from(mktLeads)
      .where(and(
        eq(mktLeads.hasPaid, false),
        lte(mktLeads.lastActiveAt, dormantDate)
      ));

    const actionItems: ActionItem[] = [
      { type: "unpaid_after_upload", label: "업로드 완료 후 미결제", count: unpaidAfterUpload?.cnt ?? 0, urgency: "high" },
      { type: "abandoned_upload", label: "가입 후 업로드 미시작", count: abandonedUpload?.cnt ?? 0, urgency: "medium" },
      { type: "dormant_return", label: "7일 휴면 복귀 대상", count: dormant?.cnt ?? 0, urgency: "low" },
    ];

    // 이상징후: 전환율 급락 체크
    const anomalies: AnomalyAlert[] = [];
    if (c.uploadStarts > 0 && p.uploadStarts > 0) {
      const currentCR = c.uploadSubmits / c.uploadStarts;
      const previousCR = p.uploadSubmits / p.uploadStarts;
      if (previousCR > 0 && (previousCR - currentCR) / previousCR > 0.2) {
        anomalies.push({
          type: "conversion_drop",
          label: "전환율 급락",
          description: `업로드 제출 전환율이 ${Math.round(previousCR * 100)}% → ${Math.round(currentCR * 100)}%로 하락`,
          severity: "warning",
          currentValue: Math.round(currentCR * 100),
          previousValue: Math.round(previousCR * 100),
        });
      }
    }
    if (c.checkoutStarts > 0 && p.checkoutStarts > 0) {
      const currentPR = c.paymentSucceeded / c.checkoutStarts;
      const previousPR = p.paymentSucceeded / p.checkoutStarts;
      if (previousPR > 0 && (previousPR - currentPR) / previousPR > 0.15) {
        anomalies.push({
          type: "payment_rate_drop",
          label: "결제 성공률 하락",
          description: `결제 전환율 ${Math.round(previousPR * 100)}% → ${Math.round(currentPR * 100)}%`,
          severity: "critical",
          currentValue: Math.round(currentPR * 100),
          previousValue: Math.round(previousPR * 100),
        });
      }
    }

    const response: OverviewResponse = {
      kpis,
      actionItems,
      anomalies,
      period: { from: fromDate, to: toDate },
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "개요 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
