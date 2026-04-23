import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { landingEvents } from "@/lib/db/schema";
import { validateBody, landingEventSchema } from "@/lib/api/validate";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * POST /api/track-event — 랜딩페이지 이벤트 수집 (fire-and-forget)
 * - IP는 저장하지 않음, user_agent는 저장(브라우저 분포 분석용)
 * - 봇/자동화 노이즈 방지를 위해 IP당 분당 120회 soft limit
 * - DB 쓰기 실패는 204로 스왈로우 (트래킹 때문에 UX가 깨지면 안 됨)
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const gate = enforceApiRateLimit(`ip:${ip}`, {
    bucket: "track-event",
    max: 120,
    windowMs: 60_000,
  });
  if (!gate.ok) return gate.response;

  const parsed = await validateBody(request, landingEventSchema);
  if (!parsed.ok) {
    return new NextResponse(null, { status: 204 });
  }
  const input = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;

  try {
    await db.insert(landingEvents).values({
      sessionId: input.sessionId,
      eventType: input.eventType,
      sectionName: input.sectionName ?? null,
      ctaName: input.ctaName ?? null,
      scrollDepth: input.scrollDepth ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      referrer: input.referrer ?? null,
      userAgent,
    });
  } catch (e) {
    console.error("[track-event] insert 실패:", e);
  }

  return new NextResponse(null, { status: 204 });
}
