import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mktEvents, mktLeads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { LEAD_SCORE_RULES, MKT_EVENT_TYPES, type MktEventType } from "@/lib/types/marketing";

// 이벤트 수집 엔드포인트
// 주의: 이 엔드포인트는 admin 전용이 아닌 클라이언트에서 호출하는 수집용
// 인증된 사용자만 이벤트 기록 가능 (로그인 강제 유지)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    userId,
    sessionId,
    anonymousId,
    eventType,
    source,
    medium,
    campaign,
    content,
    term,
    landingPath,
    deviceType,
    region,
    experimentVariant,
    metadata,
  } = body as {
    userId?: string;
    sessionId?: string;
    anonymousId?: string;
    eventType: string;
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
    landingPath?: string;
    deviceType?: string;
    region?: string;
    experimentVariant?: string;
    metadata?: Record<string, unknown>;
  };

  if (!eventType) {
    return NextResponse.json({ error: "eventType 필수" }, { status: 400 });
  }

  // 이벤트 타입 유효성 검증
  if (!MKT_EVENT_TYPES.includes(eventType as MktEventType)) {
    return NextResponse.json({ error: `유효하지 않은 이벤트: ${eventType}` }, { status: 400 });
  }

  // userId 없이는 기록하지 않음 (로그인 강제)
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 민감정보 필터 (업로드 원문 제거)
  const safeMeta = metadata ? sanitizeEventMetadata(metadata) : null;

  try {
    // 이벤트 기록
    await db.insert(mktEvents).values({
      userId,
      sessionId: sessionId || null,
      anonymousId: anonymousId || null,
      eventType,
      source: source || null,
      medium: medium || null,
      campaign: campaign || null,
      content: content || null,
      term: term || null,
      landingPath: landingPath || null,
      deviceType: deviceType || null,
      region: region || null,
      experimentVariant: experimentVariant || null,
      metadata: safeMeta,
    });

    // 리드 업데이트 (점수 + 상태)
    await updateLeadFromEvent(userId, eventType as MktEventType, {
      source, medium, campaign, landingPath,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "이벤트 기록 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 리드 자동 업데이트
async function updateLeadFromEvent(
  userId: string,
  eventType: MktEventType,
  attribution: { source?: string; medium?: string; campaign?: string; landingPath?: string }
) {
  // 기존 리드 확인
  const [existing] = await db
    .select()
    .from(mktLeads)
    .where(eq(mktLeads.userId, userId));

  const scoreChange = LEAD_SCORE_RULES[eventType] || 0;
  const now = new Date();

  if (!existing) {
    // 리드 생성
    const funnelState = getFunnelState(eventType);
    await db.insert(mktLeads).values({
      userId,
      status: eventType === "signup_completed" ? "identified" : "anonymous",
      leadScore: Math.max(0, scoreChange),
      firstSource: attribution.source || null,
      firstMedium: attribution.medium || null,
      firstCampaign: attribution.campaign || null,
      firstLandingPath: attribution.landingPath || null,
      lastEvent: eventType,
      lastEventAt: now,
      lastActiveAt: now,
      ...funnelState,
    });
  } else {
    // 리드 업데이트
    const funnelUpdate = getFunnelState(eventType);
    const newScore = Math.max(0, existing.leadScore + scoreChange);
    const newStatus = deriveLeadStatus(existing, eventType);

    await db
      .update(mktLeads)
      .set({
        leadScore: newScore,
        status: newStatus,
        lastEvent: eventType,
        lastEventAt: now,
        lastActiveAt: now,
        ...funnelUpdate,
        updatedAt: now,
      })
      .where(eq(mktLeads.userId, userId));
  }
}

function getFunnelState(eventType: MktEventType): Record<string, boolean> {
  const map: Record<string, Record<string, boolean>> = {
    signup_completed: { hasSignedUp: true },
    upload_started: { hasUploaded: true },
    upload_submitted: { hasSubmitted: true },
    analysis_completed: { hasAnalyzed: true },
    payment_succeeded: { hasPaid: true },
    report_viewed: { hasViewedReport: true },
    inquiry_submitted: { hasInquired: true },
  };
  return map[eventType] || {};
}

function deriveLeadStatus(
  existing: { status: string; hasPaid: boolean | null },
  eventType: MktEventType
): string {
  if (eventType === "payment_succeeded" || existing.hasPaid) return "customer";
  if (["checkout_started", "paywall_viewed"].includes(eventType)) return "qualified";
  if (["upload_started", "upload_submitted", "analysis_completed"].includes(eventType)) return "engaged";
  if (eventType === "signup_completed") return "identified";
  return existing.status;
}

function sanitizeEventMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const blocked = ["file_content", "upload_data", "raw_text", "file_path", "file_url", "analysis_text", "password", "token"];
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (!blocked.includes(k)) safe[k] = v;
  }
  return safe;
}
