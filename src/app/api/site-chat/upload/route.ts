import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  siteChatMessages,
  siteChatAttachments,
  siteChatRooms,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import { broadcastToRoom } from "@/lib/site-chat/utils";
import { stripHtml } from "@/lib/api/validate";
import { checkRateLimit as checkAiRateLimit } from "@/lib/api/ai-helpers";
import { getUserSubscription } from "@/lib/subscription";

const MAX_CAPTION_LENGTH = 4000;

/** 파일명에서 XSS 및 경로 조작 위험 문자를 제거하고, 저장용 안전한 파일명을 반환한다. */
function sanitizeFileName(raw: string): string {
  const stripped = stripHtml(raw);
  // 경로 구분자 및 제어 문자 제거
  const safe = stripped
    .replace(/[\\/]/g, "_")
    .replace(/\.\.+/g, ".")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim();
  return safe.slice(0, 200) || "file";
}

/** POST /api/site-chat/upload — 파일 업로드 + 메시지 생성 */
export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const roomId = formData.get("roomId") as string;
  const caption = formData.get("caption") as string | null;

  if (!file || !roomId) {
    return NextResponse.json(
      { error: "file과 roomId는 필수입니다" },
      { status: 400 },
    );
  }

  // 파일 크기 제한 (20MB)
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json(
      { error: "파일 크기는 20MB를 초과할 수 없습니다" },
      { status: 400 },
    );
  }

  // 워크스페이스 소속 방 확인
  const [room] = await db
    .select({ id: siteChatRooms.id })
    .from(siteChatRooms)
    .where(
      and(
        eq(siteChatRooms.id, roomId),
        eq(siteChatRooms.workspaceId, auth.workspaceId),
      ),
    )
    .limit(1);

  if (!room) {
    return NextResponse.json(
      { error: "톡방을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  // 파일 타입 판별
  const isImage = file.type.startsWith("image/");
  const contentType = isImage ? "image" : "file";

  // XSS 방어: 파일명 sanitize + blob 경로에 안전한 이름만 사용
  const safeFileName = sanitizeFileName(file.name);

  // Vercel Blob에 업로드
  const blob = await put(
    `site-chat/${auth.workspaceId}/${roomId}/${Date.now()}-${safeFileName}`,
    file,
    { access: "public" },
  );

  // 썸네일 (이미지인 경우 원본 URL 사용, 실제로는 리사이즈 서비스 연동)
  const thumbnailPath = isImage ? blob.url : null;

  // 참여자 정보
  const { siteChatParticipants } = await import("@/lib/db/schema");
  const [participant] = await db
    .select({
      role: siteChatParticipants.role,
      displayName: siteChatParticipants.displayName,
    })
    .from(siteChatParticipants)
    .where(
      and(
        eq(siteChatParticipants.roomId, roomId),
        eq(siteChatParticipants.userId, auth.userId),
      ),
    )
    .limit(1);

  const sanitizedCaption = caption
    ? stripHtml(caption).slice(0, MAX_CAPTION_LENGTH)
    : null;
  const sanitizedSessionName =
    stripHtml(auth.session.user.name ?? "").slice(0, 120) || "사용자";
  const displayName = participant?.displayName || sanitizedSessionName;

  // 메시지 생성 (캡션 없으면 안전 처리된 파일명을 콘텐츠로 사용)
  const [message] = await db
    .insert(siteChatMessages)
    .values({
      roomId,
      senderId: auth.userId,
      senderType: participant?.role || "team",
      senderDisplayName: displayName,
      content: sanitizedCaption && sanitizedCaption.trim() ? sanitizedCaption : safeFileName,
      contentType,
    })
    .returning();

  // 첨부파일 레코드 생성
  const [attachment] = await db
    .insert(siteChatAttachments)
    .values({
      messageId: message.id,
      storagePath: blob.url,
      fileType: file.type,
      fileSize: file.size,
      thumbnailPath,
    })
    .returning();

  // AI 자동 태깅 (이미지인 경우, 비동기)
  // AI-21: 업로더의 플랜별 분당 한도에 포함시켜 Anthropic 과금 폭탄 방지.
  // 한도 초과 시 태깅은 건너뛰되 업로드 자체는 성공으로 처리한다.
  if (isImage && process.env.ANTHROPIC_API_KEY) {
    const { plan } = await getUserSubscription(auth.userId);
    const gate = checkAiRateLimit(auth.userId, plan);
    if (gate.allowed) {
      tagImageAsync(attachment.id, blob.url).catch(() => {
        /* 태깅 실패는 무시 */
      });
    }
  }

  // SSE 브로드캐스트
  broadcastToRoom(roomId, "new_message", { ...message, attachments: [attachment] });

  return NextResponse.json({ message, attachment }, { status: 201 });
}

/** Claude Haiku로 이미지 자동 태깅 (비동기) */
async function tagImageAsync(attachmentId: string, imageUrl: string) {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "이 인테리어 시공 사진의 공간을 한 단어로 분류해주세요. 카테고리: bathroom, kitchen, living, bedroom, entrance, exterior, demolition, plumbing, electrical, flooring, painting, other. 카테고리 단어만 답해주세요.",
            },
          ],
        },
      ],
    });

    const tag =
      response.content[0].type === "text"
        ? response.content[0].text.trim().toLowerCase()
        : "other";

    await db
      .update(siteChatAttachments)
      .set({ autoCategorizedTag: tag })
      .where(eq(siteChatAttachments.id, attachmentId));
  } catch {
    // 태깅 실패 무시
  }
}
