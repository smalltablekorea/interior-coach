import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  sites,
  siteChatRooms,
  siteChatMessages,
  siteChatAttachments,
  siteChatParticipants,
  siteChatPinnedSummary,
  workspaces,
  workspaceMembers,
  user,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  SAMPLE_PROJECT,
  SAMPLE_MESSAGES,
  SAMPLE_ATTACHMENTS,
  SAMPLE_PINNED_SUMMARY,
} from "../../../../../supabase/seeds/sample-room-script";

/**
 * POST /api/site-chat/onboarding
 * 신규 유저 가입 직후 호출 — 샘플 워크스페이스 + 프로젝트 + 톡방 자동 생성
 * BetterAuth post-signup hook 또는 프론트에서 가입 완료 후 호출
 */
export async function POST() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  // 이미 샘플 방이 있는지 확인 (중복 방지)
  const [userData] = await db
    .select({ activeWorkspaceId: user.activeWorkspaceId })
    .from(user)
    .where(eq(user.id, auth.userId))
    .limit(1);

  if (userData?.activeWorkspaceId) {
    // 이미 워크스페이스가 있으면 해당 워크스페이스에서 샘플 방 확인
    const [existingSample] = await db
      .select({ id: siteChatRooms.id })
      .from(siteChatRooms)
      .where(
        and(
          eq(siteChatRooms.workspaceId, userData.activeWorkspaceId),
          eq(siteChatRooms.isSample, true),
        ),
      )
      .limit(1);

    if (existingSample) {
      return NextResponse.json(
        { message: "이미 샘플 톡방이 있습니다", roomId: existingSample.id },
        { status: 200 },
      );
    }
  }

  // 1. 워크스페이스 없으면 생성
  let workspaceId = userData?.activeWorkspaceId;

  if (!workspaceId) {
    const slug = `ws-${auth.userId.slice(0, 8)}-${Date.now().toString(36)}`;
    const [ws] = await db
      .insert(workspaces)
      .values({
        name: `${auth.session.user.name}의 워크스페이스`,
        slug,
        ownerId: auth.userId,
        plan: "free",
      })
      .returning();

    workspaceId = ws.id;

    // 멤버 추가
    await db.insert(workspaceMembers).values({
      workspaceId: ws.id,
      userId: auth.userId,
      role: "owner",
    });

    // activeWorkspaceId 설정
    await db
      .update(user)
      .set({ activeWorkspaceId: ws.id })
      .where(eq(user.id, auth.userId));
  }

  // 2. 샘플 프로젝트 생성
  const [site] = await db
    .insert(sites)
    .values({
      userId: auth.userId,
      workspaceId,
      name: SAMPLE_PROJECT.name,
      address: SAMPLE_PROJECT.address,
      buildingType: SAMPLE_PROJECT.buildingType,
      areaPyeong: SAMPLE_PROJECT.areaPyeong,
      status: SAMPLE_PROJECT.status,
      progress: SAMPLE_PROJECT.progress,
      budget: SAMPLE_PROJECT.budget,
      spent: SAMPLE_PROJECT.spent,
    })
    .returning();

  // 3. 톡방 생성 (is_sample = true)
  const [room] = await db
    .insert(siteChatRooms)
    .values({
      siteId: site.id,
      workspaceId,
      title: SAMPLE_PROJECT.name,
      clientPortalEnabled: true,
      clientPortalSlug: `sample-${auth.userId.slice(0, 8)}`,
      isSample: true,
    })
    .returning();

  // 4. 참여자 추가 (owner)
  await db.insert(siteChatParticipants).values({
    roomId: room.id,
    userId: auth.userId,
    role: "owner",
    displayName: auth.session.user.name,
    joinedVia: "direct",
  });

  // 5. 샘플 메시지 주입
  const baseTime = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 2주 전부터
  const insertedMessages: { id: string; index: number }[] = [];

  for (let i = 0; i < SAMPLE_MESSAGES.length; i++) {
    const msg = SAMPLE_MESSAGES[i];
    const createdAt = new Date(baseTime.getTime() + msg.minuteOffset * 60 * 1000);

    const [inserted] = await db
      .insert(siteChatMessages)
      .values({
        roomId: room.id,
        senderId: msg.senderType === "owner" ? auth.userId : null,
        senderType: msg.senderType,
        senderDisplayName:
          msg.senderType === "owner" ? auth.session.user.name : msg.senderDisplayName,
        content: msg.content,
        contentType: msg.contentType,
        metadata: msg.metadata || null,
        createdAt,
      })
      .returning();

    insertedMessages.push({ id: inserted.id, index: i });
  }

  // 6. 샘플 첨부파일 주입
  for (const att of SAMPLE_ATTACHMENTS) {
    const msgEntry = insertedMessages.find((m) => m.index === att.messageIndex);
    if (msgEntry) {
      await db.insert(siteChatAttachments).values({
        messageId: msgEntry.id,
        storagePath: att.storagePath,
        fileType: att.fileType,
        fileSize: att.fileSize,
        autoCategorizedTag: att.autoCategorizedTag,
      });
    }
  }

  // 7. pinned_summary 주입 (트리거가 빈 값 생성 → 업데이트)
  await db
    .update(siteChatPinnedSummary)
    .set({
      currentProgressPercent: SAMPLE_PINNED_SUMMARY.currentProgressPercent,
      nextMilestoneTitle: SAMPLE_PINNED_SUMMARY.nextMilestoneTitle,
      nextMilestoneDate: SAMPLE_PINNED_SUMMARY.nextMilestoneDate,
      pendingPaymentAmount: SAMPLE_PINNED_SUMMARY.pendingPaymentAmount,
      pendingPaymentDueDate: SAMPLE_PINNED_SUMMARY.pendingPaymentDueDate,
      openDefectsCount: SAMPLE_PINNED_SUMMARY.openDefectsCount,
      updatedAt: new Date(),
    })
    .where(eq(siteChatPinnedSummary.roomId, room.id));

  return NextResponse.json(
    {
      message: "샘플 톡방이 생성되었습니다",
      workspaceId,
      siteId: site.id,
      roomId: room.id,
    },
    { status: 201 },
  );
}
