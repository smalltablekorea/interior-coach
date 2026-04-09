import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  siteChatRooms,
  siteChatParticipants,
  siteChatPinnedSummary,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPortalPassword, generatePortalSlug } from "@/lib/site-chat/utils";

type Params = { params: Promise<{ roomId: string }> };

/** 방 접근 권한 체크 (워크스페이스 소속 확인) */
async function getRoomForWorkspace(roomId: string, workspaceId: string) {
  const [room] = await db
    .select()
    .from(siteChatRooms)
    .where(and(eq(siteChatRooms.id, roomId), eq(siteChatRooms.workspaceId, workspaceId)))
    .limit(1);
  return room;
}

/** GET /api/site-chat/rooms/[roomId] — 톡방 상세 + 참여자 + 요약 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireWorkspaceAuth("sites", "read");
  if (!auth.ok) return auth.response;

  const { roomId } = await params;
  const room = await getRoomForWorkspace(roomId, auth.workspaceId);
  if (!room) {
    return NextResponse.json({ error: "톡방을 찾을 수 없습니다" }, { status: 404 });
  }

  const [participants, [summary]] = await Promise.all([
    db
      .select()
      .from(siteChatParticipants)
      .where(eq(siteChatParticipants.roomId, roomId)),
    db
      .select()
      .from(siteChatPinnedSummary)
      .where(eq(siteChatPinnedSummary.roomId, roomId))
      .limit(1),
  ]);

  return NextResponse.json({
    room: {
      ...room,
      clientPortalPasswordHash: undefined, // 해시 노출 방지
    },
    participants,
    summary: summary || null,
  });
}

/** PATCH /api/site-chat/rooms/[roomId] — 톡방 설정 수정 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const { roomId } = await params;
  const room = await getRoomForWorkspace(roomId, auth.workspaceId);
  if (!room) {
    return NextResponse.json({ error: "톡방을 찾을 수 없습니다" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Partial<typeof siteChatRooms.$inferInsert> = {};

  if (body.title !== undefined) updates.title = body.title;

  if (body.clientPortalEnabled !== undefined) {
    updates.clientPortalEnabled = body.clientPortalEnabled;
    // 포털 활성화 시 slug가 없으면 생성
    if (body.clientPortalEnabled && !room.clientPortalSlug) {
      updates.clientPortalSlug = generatePortalSlug(room.title);
    }
  }

  if (body.portalPassword !== undefined) {
    updates.clientPortalPasswordHash = body.portalPassword
      ? await hashPortalPassword(body.portalPassword)
      : null;
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(siteChatRooms)
    .set(updates)
    .where(eq(siteChatRooms.id, roomId))
    .returning();

  return NextResponse.json({
    room: { ...updated, clientPortalPasswordHash: undefined },
  });
}

/** DELETE /api/site-chat/rooms/[roomId] — 톡방 삭제 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const { roomId } = await params;
  const room = await getRoomForWorkspace(roomId, auth.workspaceId);
  if (!room) {
    return NextResponse.json({ error: "톡방을 찾을 수 없습니다" }, { status: 404 });
  }

  await db.delete(siteChatRooms).where(eq(siteChatRooms.id, roomId));

  return NextResponse.json({ success: true });
}
