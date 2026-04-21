import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validatePortalToken } from "@/lib/portal-auth";
import { siteChatRooms, siteChatMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validatePortalToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 토큰입니다." },
      { status: 401 }
    );
  }

  // Find chat room for this site
  const rooms = await db
    .select()
    .from(siteChatRooms)
    .where(eq(siteChatRooms.siteId, result.site.id))
    .limit(1);

  if (rooms.length === 0) {
    return NextResponse.json({ messages: [] });
  }

  const room = rooms[0];

  const messages = await db
    .select({
      id: siteChatMessages.id,
      senderId: siteChatMessages.senderId,
      senderType: siteChatMessages.senderType,
      senderDisplayName: siteChatMessages.senderDisplayName,
      content: siteChatMessages.content,
      contentType: siteChatMessages.contentType,
      createdAt: siteChatMessages.createdAt,
    })
    .from(siteChatMessages)
    .where(eq(siteChatMessages.roomId, room.id))
    .orderBy(desc(siteChatMessages.createdAt))
    .limit(50);

  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validatePortalToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 토큰입니다." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "메시지 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  // Find chat room for this site
  const rooms = await db
    .select()
    .from(siteChatRooms)
    .where(eq(siteChatRooms.siteId, result.site.id))
    .limit(1);

  if (rooms.length === 0) {
    return NextResponse.json(
      { error: "채팅방을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const room = rooms[0];

  const [newMessage] = await db
    .insert(siteChatMessages)
    .values({
      roomId: room.id,
      senderType: "client",
      senderDisplayName: result.customer.name,
      content: content.trim(),
      contentType: "text",
    })
    .returning();

  return NextResponse.json({ message: newMessage });
}
