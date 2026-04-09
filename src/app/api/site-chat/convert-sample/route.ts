import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  sites,
  siteChatRooms,
  siteChatParticipants,
  siteChatMessages,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/site-chat/convert-sample
 * 샘플 프로젝트를 보관하고 새 진짜 프로젝트 + 톡방 생성
 */
export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { name, address, buildingType, areaPyeong } = body;

  if (!name) {
    return NextResponse.json({ error: "현장 이름은 필수입니다" }, { status: 400 });
  }

  // 새 현장 생성
  const [site] = await db
    .insert(sites)
    .values({
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      name,
      address: address || null,
      buildingType: buildingType || null,
      areaPyeong: areaPyeong || null,
      status: "상담중",
    })
    .returning();

  // 새 톡방 생성 (is_sample = false)
  const [room] = await db
    .insert(siteChatRooms)
    .values({
      siteId: site.id,
      workspaceId: auth.workspaceId,
      title: name,
      isSample: false,
    })
    .returning();

  // 참여자 추가
  await db.insert(siteChatParticipants).values({
    roomId: room.id,
    userId: auth.userId,
    role: "owner",
    displayName: auth.session.user.name,
    joinedVia: "direct",
  });

  // 시스템 메시지
  await db.insert(siteChatMessages).values({
    roomId: room.id,
    senderType: "system",
    senderDisplayName: "시스템",
    content: `새 현장 "${name}" 톡방이 생성되었습니다.`,
    contentType: "system_event",
  });

  return NextResponse.json(
    { site, room },
    { status: 201 },
  );
}

/**
 * DELETE /api/site-chat/convert-sample
 * 샘플 방 삭제 (유저가 원할 때)
 */
export async function DELETE() {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  // 샘플 방 찾기
  const sampleRooms = await db
    .select({ id: siteChatRooms.id, siteId: siteChatRooms.siteId })
    .from(siteChatRooms)
    .where(
      and(
        eq(siteChatRooms.workspaceId, auth.workspaceId),
        eq(siteChatRooms.isSample, true),
      ),
    );

  if (sampleRooms.length === 0) {
    return NextResponse.json({ error: "샘플 방이 없습니다" }, { status: 404 });
  }

  // 샘플 방 + 연관 현장 삭제
  for (const room of sampleRooms) {
    await db.delete(siteChatRooms).where(eq(siteChatRooms.id, room.id));
    // 샘플 현장도 삭제
    await db
      .update(sites)
      .set({ deletedAt: new Date() })
      .where(eq(sites.id, room.siteId));
  }

  return NextResponse.json({ success: true, deleted: sampleRooms.length });
}
