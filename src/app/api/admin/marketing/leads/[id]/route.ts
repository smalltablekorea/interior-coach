import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { mktLeads, mktEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { LeadDetail, LeadTimeline } from "@/lib/types/marketing";

// 리드 상세 + 이벤트 타임라인
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.response;

  const { id } = await params;

  try {
    const [lead] = await db
      .select()
      .from(mktLeads)
      .where(eq(mktLeads.id, id));

    if (!lead) {
      return NextResponse.json({ error: "리드를 찾을 수 없습니다" }, { status: 404 });
    }

    // 이벤트 타임라인 (최근 50개, 민감정보 제외)
    let timeline: LeadTimeline[] = [];
    if (lead.userId) {
      const events = await db
        .select({
          eventType: mktEvents.eventType,
          occurredAt: mktEvents.occurredAt,
          metadata: mktEvents.metadata,
        })
        .from(mktEvents)
        .where(eq(mktEvents.userId, lead.userId))
        .orderBy(desc(mktEvents.occurredAt))
        .limit(50);

      timeline = events.map((e) => {
        // 민감정보 필터링: 업로드 원문 내용 제거
        const safeMeta = e.metadata ? sanitizeMetadata(e.metadata as Record<string, unknown>) : null;
        return {
          eventType: e.eventType,
          occurredAt: e.occurredAt.toISOString(),
          metadata: safeMeta,
        };
      });
    }

    // 다음 추천 액션 결정
    let recommendedAction: string | null = null;
    if (!lead.hasUploaded) {
      recommendedAction = "업로드 가이드 발송";
    } else if (!lead.hasSubmitted) {
      recommendedAction = "업로드 이어하기 리마인더";
    } else if (lead.hasAnalyzed && !lead.hasPaid) {
      recommendedAction = "결제 유도 메시지 발송";
    } else if (lead.hasPaid && !lead.hasViewedReport) {
      recommendedAction = "리포트 확인 안내";
    } else if (lead.hasViewedReport && !lead.hasInquired) {
      recommendedAction = "업체추천/후기 요청";
    }

    const detail: LeadDetail = {
      id: lead.id,
      userId: lead.userId,
      email: lead.email,
      name: lead.name,
      lastEvent: lead.lastEvent,
      lastEventAt: lead.lastEventAt?.toISOString() ?? null,
      source: lead.firstSource,
      medium: lead.firstMedium,
      campaign: lead.firstCampaign,
      leadScore: lead.leadScore,
      segment: lead.currentSegment,
      lastActiveAt: lead.lastActiveAt?.toISOString() ?? null,
      status: lead.status as LeadDetail["status"],
      paymentStatus: lead.hasPaid ? "paid" : lead.hasSubmitted ? "submitted" : null,
      createdAt: lead.createdAt.toISOString(),
      timeline,
      hasReport: lead.hasViewedReport ?? false,
      hasInquiry: lead.hasInquired ?? false,
      recommendedAction,
    };

    return NextResponse.json(detail);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "리드 상세 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 민감정보 필터링 (업로드 원문, 파일 내용 등 제거)
function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["file_content", "upload_data", "raw_text", "file_path", "file_url", "analysis_text"];
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!sensitiveKeys.includes(key)) {
      safe[key] = value;
    }
  }
  return safe;
}
