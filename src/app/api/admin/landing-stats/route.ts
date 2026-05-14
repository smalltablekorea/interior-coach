import { NextRequest } from "next/server";
import { and, desc, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoRequests, landingEvents } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/api-auth";
import { ok, err } from "@/lib/api/response";

/**
 * GET /api/admin/landing-stats?days=14
 * 일자별 방문(page_view) / CTA 클릭(cta_click) / 데모 신청 집계.
 * 서울 타임존(Asia/Seoul) 기준으로 날짜 그룹핑.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  const rawDays = Number(request.nextUrl.searchParams.get("days") || "14");
  const days = Math.min(90, Math.max(1, Number.isFinite(rawDays) ? rawDays : 14));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const eventsByDay = await db
      .select({
        day: sql<string>`to_char(${landingEvents.createdAt} AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD')`,
        eventType: landingEvents.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(landingEvents)
      .where(gte(landingEvents.createdAt, since))
      .groupBy(
        sql`to_char(${landingEvents.createdAt} AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD')`,
        landingEvents.eventType,
      );

    const demosByDay = await db
      .select({
        day: sql<string>`to_char(${demoRequests.createdAt} AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(demoRequests)
      .where(gte(demoRequests.createdAt, since))
      .groupBy(
        sql`to_char(${demoRequests.createdAt} AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD')`,
      );

    // 일자 버킷 만들기 (연속 일자 보장)
    const buckets = new Map<
      string,
      {
        day: string;
        pageView: number;
        sectionView: number;
        ctaClick: number;
        scrollDepth: number;
        demoRequests: number;
      }
    >();

    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = fmt.format(d);
      buckets.set(key, {
        day: key,
        pageView: 0,
        sectionView: 0,
        ctaClick: 0,
        scrollDepth: 0,
        demoRequests: 0,
      });
    }

    for (const row of eventsByDay) {
      const b = buckets.get(row.day);
      if (!b) continue;
      if (row.eventType === "page_view") b.pageView = row.count;
      else if (row.eventType === "section_view") b.sectionView = row.count;
      else if (row.eventType === "cta_click") b.ctaClick = row.count;
      else if (row.eventType === "scroll_depth") b.scrollDepth = row.count;
    }
    for (const row of demosByDay) {
      const b = buckets.get(row.day);
      if (b) b.demoRequests = row.count;
    }

    // CTA별 TOP
    const topCtas = await db
      .select({
        ctaName: landingEvents.ctaName,
        count: sql<number>`count(*)::int`,
      })
      .from(landingEvents)
      .where(
        and(
          gte(landingEvents.createdAt, since),
          sql`${landingEvents.eventType} = 'cta_click' AND ${landingEvents.ctaName} IS NOT NULL`,
        ),
      )
      .groupBy(landingEvents.ctaName)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return ok({
      range: { days, since: since.toISOString() },
      daily: [...buckets.values()].sort((a, b) => a.day.localeCompare(b.day)),
      topCtas,
    });
  } catch (e) {
    console.error("[admin/landing-stats]", e);
    return err(e instanceof Error ? e.message : "집계 실패", 500);
  }
}

export const dynamic = "force-dynamic";
