import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  siteChatRooms,
  siteChatMessages,
  siteChatAttachments,
  siteChatPinnedSummary,
} from "@/lib/db/schema";
import { eq, and, desc, isNull, ne } from "drizzle-orm";
import { checkRateLimit, verifyPortalPassword } from "@/lib/site-chat/utils";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/portal/[slug] — 고객 포털 뷰 (공개) */
export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  // Rate limit: IP당 분당 30회
  if (!checkRateLimit(ip, 30, 60_000)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  // 방 조회
  const [room] = await db
    .select()
    .from(siteChatRooms)
    .where(eq(siteChatRooms.clientPortalSlug, slug))
    .limit(1);

  if (!room || !room.clientPortalEnabled) {
    return NextResponse.json({ error: "페이지를 찾을 수 없습니다" }, { status: 404 });
  }

  // 비밀번호 검증
  if (room.clientPortalPasswordHash) {
    const password = req.nextUrl.searchParams.get("password");
    if (!password) {
      return NextResponse.json(
        { error: "비밀번호가 필요합니다", requiresPassword: true },
        { status: 401 },
      );
    }
    const valid = await verifyPortalPassword(password, room.clientPortalPasswordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다", requiresPassword: true },
        { status: 401 },
      );
    }
  }

  // 메시지 조회 (최근 200개, 시스템 내부 메시지 제외)
  const messages = await db
    .select()
    .from(siteChatMessages)
    .where(
      and(
        eq(siteChatMessages.roomId, room.id),
        isNull(siteChatMessages.deletedAt),
        ne(siteChatMessages.contentType, "system_event"),
      ),
    )
    .orderBy(desc(siteChatMessages.createdAt))
    .limit(200);

  // 첨부파일
  const messageIds = messages.map((m) => m.id);
  let attachments: (typeof siteChatAttachments.$inferSelect)[] = [];
  if (messageIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    attachments = await db
      .select()
      .from(siteChatAttachments)
      .where(inArray(siteChatAttachments.messageId, messageIds));
  }

  const attachmentMap = new Map<string, (typeof siteChatAttachments.$inferSelect)[]>();
  for (const att of attachments) {
    const list = attachmentMap.get(att.messageId) || [];
    list.push(att);
    attachmentMap.set(att.messageId, list);
  }

  // 요약
  const [summary] = await db
    .select()
    .from(siteChatPinnedSummary)
    .where(eq(siteChatPinnedSummary.roomId, room.id))
    .limit(1);

  return NextResponse.json({
    room: {
      id: room.id,
      title: room.title,
      clientPortalEnabled: room.clientPortalEnabled,
    },
    messages: messages.reverse().map((m) => ({
      id: m.id,
      senderType: m.senderType,
      senderDisplayName: m.senderDisplayName,
      content: m.content,
      contentType: m.contentType,
      replyToId: m.replyToId,
      createdAt: m.createdAt,
      editedAt: m.editedAt,
      attachments: attachmentMap.get(m.id) || [],
    })),
    summary: summary || null,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
