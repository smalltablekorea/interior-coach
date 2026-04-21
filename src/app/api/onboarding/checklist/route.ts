import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  sites,
  siteChatRooms,
  siteChatMessages,
  siteChatAttachments,
} from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

/**
 * GET /api/onboarding/checklist
 * Returns the onboarding checklist status for the current user.
 * Checks:
 *   1. "create" — has at least one non-sample site
 *   2. "photo" — has at least one photo attachment on any site chat
 *   3. "message" — has sent at least one message in any site chat
 *   4. "portal" — has at least one room with client portal enabled
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  // 1. Real (non-sample) sites
  const realSites = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.userId, auth.userId))
    .limit(100);

  // Filter: non-sample sites via chat rooms
  // A site is "sample" if its chat room has isSample=true
  const sampleSiteIds = await db
    .select({ siteId: siteChatRooms.siteId })
    .from(siteChatRooms)
    .where(eq(siteChatRooms.isSample, true));

  const sampleSet = new Set(sampleSiteIds.map((r) => r.siteId));
  const nonSampleSites = realSites.filter((s) => !sampleSet.has(s.id));
  const hasRealSite = nonSampleSites.length > 0;

  // 2. Has photo attachment in any room
  const [photoResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(siteChatAttachments)
    .innerJoin(
      siteChatMessages,
      eq(siteChatAttachments.messageId, siteChatMessages.id),
    )
    .innerJoin(siteChatRooms, eq(siteChatMessages.roomId, siteChatRooms.id))
    .where(
      and(
        eq(siteChatMessages.senderId, auth.userId),
        eq(siteChatRooms.isSample, false),
      ),
    );
  const hasPhoto = (photoResult?.count ?? 0) > 0;

  // 3. Has sent a message in any non-sample room
  const [messageResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(siteChatMessages)
    .innerJoin(siteChatRooms, eq(siteChatMessages.roomId, siteChatRooms.id))
    .where(
      and(
        eq(siteChatMessages.senderId, auth.userId),
        eq(siteChatRooms.isSample, false),
      ),
    );
  const hasMessage = (messageResult?.count ?? 0) > 0;

  // 4. Has a room with client portal enabled (non-sample)
  const [portalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(siteChatRooms)
    .innerJoin(sites, eq(siteChatRooms.siteId, sites.id))
    .where(
      and(
        eq(sites.userId, auth.userId),
        eq(siteChatRooms.clientPortalEnabled, true),
        eq(siteChatRooms.isSample, false),
      ),
    );
  const hasPortal = (portalResult?.count ?? 0) > 0;

  return NextResponse.json({
    items: [
      { id: "create", done: hasRealSite },
      { id: "photo", done: hasPhoto },
      { id: "message", done: hasMessage },
      { id: "portal", done: hasPortal },
    ],
    allDone: hasRealSite && hasPhoto && hasMessage && hasPortal,
    realSiteCount: nonSampleSites.length,
  });
}
