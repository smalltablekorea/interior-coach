import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  siteChatRooms,
  siteChatParticipants,
  siteChatPinnedSummary,
  sites,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generatePortalSlug, hashPortalPassword } from "@/lib/site-chat/utils";

/** GET /api/site-chat/rooms — 워크스페이스의 모든 톡방 목록 */
export async function GET() {
  const auth = await requireWorkspaceAuth("sites", "read");
  if (!auth.ok) return auth.response;

  const rooms = await db
    .select({
      id: siteChatRooms.id,
      siteId: siteChatRooms.siteId,
      title: siteChatRooms.title,
      clientPortalSlug: siteChatRooms.clientPortalSlug,
      clientPortalEnabled: siteChatRooms.clientPortalEnabled,
      createdAt: siteChatRooms.createdAt,
      updatedAt: siteChatRooms.updatedAt,
      // pinned summary
      progressPercent: siteChatPinnedSummary.currentProgressPercent,
      nextMilestone: siteChatPinnedSummary.nextMilestoneTitle,
      nextMilestoneDate: siteChatPinnedSummary.nextMilestoneDate,
      pendingPayment: siteChatPinnedSummary.pendingPaymentAmount,
      openDefects: siteChatPinnedSummary.openDefectsCount,
    })
    .from(siteChatRooms)
    .leftJoin(siteChatPinnedSummary, eq(siteChatPinnedSummary.roomId, siteChatRooms.id))
    .where(eq(siteChatRooms.workspaceId, auth.workspaceId))
    .orderBy(desc(siteChatRooms.updatedAt));

  return NextResponse.json({ rooms });
}

/** POST /api/site-chat/rooms — 새 톡방 생성 */
export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { siteId, title, enablePortal, portalPassword } = body;

  if (!siteId) {
    return NextResponse.json({ error: "siteId는 필수입니다" }, { status: 400 });
  }

  // 현장이 현재 워크스페이스에 속하는지 확인
  const [site] = await db
    .select({ id: sites.id, name: sites.name })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!site) {
    return NextResponse.json({ error: "현장을 찾을 수 없습니다" }, { status: 404 });
  }

  const roomTitle = title || site.name;
  const slug = enablePortal ? generatePortalSlug(roomTitle) : null;
  const passwordHash = enablePortal && portalPassword
    ? await hashPortalPassword(portalPassword)
    : null;

  const [room] = await db
    .insert(siteChatRooms)
    .values({
      siteId,
      workspaceId: auth.workspaceId,
      title: roomTitle,
      clientPortalSlug: slug,
      clientPortalEnabled: !!enablePortal,
      clientPortalPasswordHash: passwordHash,
    })
    .returning();

  // 생성자를 owner 참여자로 추가
  await db.insert(siteChatParticipants).values({
    roomId: room.id,
    userId: auth.userId,
    role: "owner",
    displayName: auth.session.user.name,
    joinedVia: "direct",
  });

  // 시스템 메시지: 방 생성
  const { siteChatMessages } = await import("@/lib/db/schema");
  await db.insert(siteChatMessages).values({
    roomId: room.id,
    senderType: "system",
    senderDisplayName: "시스템",
    content: `${auth.session.user.name}님이 톡방을 생성했습니다.`,
    contentType: "system_event",
  });

  return NextResponse.json({ room }, { status: 201 });
}
