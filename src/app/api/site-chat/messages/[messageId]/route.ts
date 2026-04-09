import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { siteChatMessages, siteChatRooms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { broadcastToRoom } from "@/lib/site-chat/utils";

type Params = { params: Promise<{ messageId: string }> };

/** PATCH /api/site-chat/messages/[messageId] — 메시지 수정 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const { messageId } = await params;
  const body = await req.json();

  // 메시지 조회 + 본인 확인
  const [message] = await db
    .select()
    .from(siteChatMessages)
    .where(eq(siteChatMessages.id, messageId))
    .limit(1);

  if (!message) {
    return NextResponse.json({ error: "메시지를 찾을 수 없습니다" }, { status: 404 });
  }

  // 워크스페이스 소속 방인지 확인
  const [room] = await db
    .select({ id: siteChatRooms.id })
    .from(siteChatRooms)
    .where(and(eq(siteChatRooms.id, message.roomId), eq(siteChatRooms.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!room) {
    return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  }

  // 본인 메시지만 수정 가능
  if (message.senderId !== auth.userId) {
    return NextResponse.json({ error: "본인 메시지만 수정할 수 있습니다" }, { status: 403 });
  }

  const [updated] = await db
    .update(siteChatMessages)
    .set({
      content: body.content,
      editedAt: new Date(),
    })
    .where(eq(siteChatMessages.id, messageId))
    .returning();

  broadcastToRoom(message.roomId, "message_edited", updated);

  return NextResponse.json({ message: updated });
}

/** DELETE /api/site-chat/messages/[messageId] — 메시지 소프트 삭제 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const { messageId } = await params;

  const [message] = await db
    .select()
    .from(siteChatMessages)
    .where(eq(siteChatMessages.id, messageId))
    .limit(1);

  if (!message) {
    return NextResponse.json({ error: "메시지를 찾을 수 없습니다" }, { status: 404 });
  }

  // 워크스페이스 소속 확인
  const [room] = await db
    .select({ id: siteChatRooms.id })
    .from(siteChatRooms)
    .where(and(eq(siteChatRooms.id, message.roomId), eq(siteChatRooms.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!room) {
    return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  }

  // 본인 메시지 또는 owner만 삭제 가능
  if (message.senderId !== auth.userId && auth.workspaceRole !== "owner") {
    return NextResponse.json({ error: "삭제 권한이 없습니다" }, { status: 403 });
  }

  const [deleted] = await db
    .update(siteChatMessages)
    .set({ deletedAt: new Date() })
    .where(eq(siteChatMessages.id, messageId))
    .returning();

  broadcastToRoom(message.roomId, "message_deleted", { id: messageId });

  return NextResponse.json({ message: deleted });
}
