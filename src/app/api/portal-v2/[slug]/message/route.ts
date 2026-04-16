import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteChatRooms, siteChatMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, isSpam, verifyPortalPassword } from "@/lib/site-chat/utils";
import { broadcastToRoom } from "@/lib/site-chat/utils";
import { sendSms } from "@/lib/solapi";
import { workspaces, user } from "@/lib/db/schema";
import { portalChatMessageSchema, validateBody } from "@/lib/api/validate";

type Params = { params: Promise<{ slug: string }> };

/** POST /api/portal/[slug]/message — 고객이 메시지 남기기 (공개) */
export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  // Rate limit: IP당 분당 5회
  if (!checkRateLimit(`portal-post:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const parsed = await validateBody(req, portalChatMessageSchema);
  if (!parsed.ok) return parsed.response;
  const { content, displayName, password } = parsed.data;

  // 스팸 필터 (sanitize 후 남은 content 기준)
  const spamCheck = isSpam(content);
  if (spamCheck.spam) {
    return NextResponse.json(
      { error: spamCheck.reason },
      { status: 400 },
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
    if (!password) {
      return NextResponse.json(
        { error: "비밀번호가 필요합니다", requiresPassword: true },
        { status: 401 },
      );
    }
    const valid = await verifyPortalPassword(password, room.clientPortalPasswordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다" },
        { status: 401 },
      );
    }
  }

  // 메시지 저장 (content/displayName은 이미 sanitize됨)
  const [message] = await db
    .insert(siteChatMessages)
    .values({
      roomId: room.id,
      senderId: null,
      senderType: "client",
      senderDisplayName: displayName,
      content,
      contentType: "text",
    })
    .returning();

  // SSE 브로드캐스트
  broadcastToRoom(room.id, "new_message", message);

  // 워크스페이스 owner에게 SMS 알림 (비동기)
  notifyOwnerSms(room.workspaceId, room.title, displayName, content).catch(() => {
    /* SMS 실패 무시 */
  });

  return NextResponse.json({ message }, { status: 201 });
}

/** 워크스페이스 owner에게 SMS 발송 */
async function notifyOwnerSms(
  workspaceId: string,
  roomTitle: string,
  customerName: string,
  content: string,
) {
  // 워크스페이스 owner 찾기
  const [workspace] = await db
    .select({ ownerId: workspaces.ownerId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) return;

  const [owner] = await db
    .select({ phone: user.phone, name: user.name })
    .from(user)
    .where(eq(user.id, workspace.ownerId))
    .limit(1);

  if (!owner?.phone) return;

  const smsText = `[인테리어코치] ${roomTitle}\n고객 ${customerName}님 메시지: "${content.slice(0, 40)}${content.length > 40 ? "..." : ""}"`;

  await sendSms(owner.phone, smsText, smsText.length > 90);
}
