import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  siteChatMessages,
  siteChatRooms,
  siteChatAttachments,
  siteChatParticipants,
} from "@/lib/db/schema";
import { eq, and, desc, lt, isNull } from "drizzle-orm";
import { broadcastToRoom } from "@/lib/site-chat/utils";

/** GET /api/site-chat/messages?roomId=xxx&cursor=xxx&limit=50 */
export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const cursor = searchParams.get("cursor"); // message id for pagination
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  if (!roomId) {
    return NextResponse.json({ error: "roomId는 필수입니다" }, { status: 400 });
  }

  // 워크스페이스 소속 방인지 확인
  const [room] = await db
    .select({ id: siteChatRooms.id })
    .from(siteChatRooms)
    .where(and(eq(siteChatRooms.id, roomId), eq(siteChatRooms.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!room) {
    return NextResponse.json({ error: "톡방을 찾을 수 없습니다" }, { status: 404 });
  }

  // 커서 기반 페이지네이션
  const conditions = [eq(siteChatMessages.roomId, roomId), isNull(siteChatMessages.deletedAt)];

  if (cursor) {
    // 커서 메시지의 createdAt 기준
    const [cursorMsg] = await db
      .select({ createdAt: siteChatMessages.createdAt })
      .from(siteChatMessages)
      .where(eq(siteChatMessages.id, cursor))
      .limit(1);

    if (cursorMsg) {
      conditions.push(lt(siteChatMessages.createdAt, cursorMsg.createdAt));
    }
  }

  const messages = await db
    .select()
    .from(siteChatMessages)
    .where(and(...conditions))
    .orderBy(desc(siteChatMessages.createdAt))
    .limit(limit + 1);

  const hasMore = messages.length > limit;
  const result = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? result[result.length - 1].id : null;

  // 첨부파일 한 번에 조회
  const messageIds = result.map((m) => m.id);
  let attachments: (typeof siteChatAttachments.$inferSelect)[] = [];
  if (messageIds.length > 0) {
    attachments = await db
      .select()
      .from(siteChatAttachments)
      .where(
        // IN 조건 — drizzle의 inArray 사용
        eq(siteChatAttachments.messageId, messageIds[0]), // 첫 번째 기본
      );
    // 실제로는 모든 메시지의 첨부파일을 조회해야 함
    if (messageIds.length > 1) {
      const { inArray } = await import("drizzle-orm");
      attachments = await db
        .select()
        .from(siteChatAttachments)
        .where(inArray(siteChatAttachments.messageId, messageIds));
    }
  }

  // 메시지별 첨부파일 매핑
  const attachmentMap = new Map<string, typeof attachments>();
  for (const att of attachments) {
    const list = attachmentMap.get(att.messageId) || [];
    list.push(att);
    attachmentMap.set(att.messageId, list);
  }

  // last_read_at 갱신
  await db
    .update(siteChatParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(siteChatParticipants.roomId, roomId),
        eq(siteChatParticipants.userId, auth.userId),
      ),
    );

  return NextResponse.json({
    messages: result.map((m) => ({
      ...m,
      attachments: attachmentMap.get(m.id) || [],
    })),
    nextCursor,
    hasMore,
  });
}

/** POST /api/site-chat/messages — 메시지 전송 */
export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { roomId, content, contentType, replyToId, metadata } = body;

  if (!roomId || !content) {
    return NextResponse.json({ error: "roomId와 content는 필수입니다" }, { status: 400 });
  }

  // 워크스페이스 소속 방인지 확인
  const [room] = await db
    .select({ id: siteChatRooms.id })
    .from(siteChatRooms)
    .where(and(eq(siteChatRooms.id, roomId), eq(siteChatRooms.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!room) {
    return NextResponse.json({ error: "톡방을 찾을 수 없습니다" }, { status: 404 });
  }

  // 참여자 확인 (없으면 자동 추가)
  const [participant] = await db
    .select({ role: siteChatParticipants.role, displayName: siteChatParticipants.displayName })
    .from(siteChatParticipants)
    .where(
      and(
        eq(siteChatParticipants.roomId, roomId),
        eq(siteChatParticipants.userId, auth.userId),
      ),
    )
    .limit(1);

  const senderType = participant?.role || "team";
  const displayName = participant?.displayName || auth.session.user.name;

  if (!participant) {
    await db.insert(siteChatParticipants).values({
      roomId,
      userId: auth.userId,
      role: "team",
      displayName: auth.session.user.name,
      joinedVia: "direct",
    });
  }

  const [message] = await db
    .insert(siteChatMessages)
    .values({
      roomId,
      senderId: auth.userId,
      senderType,
      senderDisplayName: displayName,
      content,
      contentType: contentType || "text",
      replyToId: replyToId || null,
      metadata: metadata || null,
    })
    .returning();

  // SSE 브로드캐스트
  broadcastToRoom(roomId, "new_message", message);

  return NextResponse.json({ message }, { status: 201 });
}
