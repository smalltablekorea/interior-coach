import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchAdlogDashboard, adlogLogin } from "@/lib/adlog-client";
import type { AdlogCredentials } from "@/lib/adlog-client";

/* ─── Helpers ─── */

async function getAdlogChannel() {
  const [ch] = await db
    .select()
    .from(marketingChannels)
    .where(eq(marketingChannels.channel, "adlog"))
    .limit(1);
  return ch ?? null;
}

function getCredentials(ch: { settings: unknown }): AdlogCredentials | null {
  const s = ch.settings as Record<string, string> | null;
  if (!s?.mb_id || !s?.mb_password) return null;
  return { mb_id: s.mb_id, mb_password: s.mb_password };
}

/* ─── GET: 애드로그 대시보드 데이터 조회 ─── */

export async function GET() {
  try {
    const ch = await getAdlogChannel();

    // 연동 안 된 상태
    if (!ch || !ch.isActive) {
      return NextResponse.json({
        connected: false,
        accountName: null,
        platforms: [],
        summary: null,
        campaigns: [],
      });
    }

    const creds = getCredentials(ch);
    if (!creds) {
      return NextResponse.json({
        connected: false,
        accountName: null,
        platforms: [],
        summary: null,
        campaigns: [],
        error: "저장된 자격증명이 없습니다.",
      });
    }

    // 애드로그에서 실시간 데이터 가져오기
    const dashboard = await fetchAdlogDashboard(creds);

    return NextResponse.json({
      ...dashboard,
      accountName: ch.accountName || dashboard.accountName,
      channelId: ch.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "애드로그 데이터 조회 실패";
    return NextResponse.json({ error: msg, connected: false }, { status: 500 });
  }
}

/* ─── POST: 애드로그 계정 연동 (로그인 테스트 후 저장) ─── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mb_id, mb_password } = body as { mb_id?: string; mb_password?: string };

    if (!mb_id || !mb_password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 1. 실제 로그인 테스트
    const loginResult = await adlogLogin({ mb_id, mb_password });
    if (!loginResult.ok) {
      return NextResponse.json(
        { error: loginResult.error || "로그인 실패" },
        { status: 401 }
      );
    }

    // 2. 기존 채널 확인
    const existing = await getAdlogChannel();

    if (existing) {
      // 기존 레코드 업데이트
      const [updated] = await db
        .update(marketingChannels)
        .set({
          accountName: mb_id,
          accountId: mb_id,
          settings: { mb_id, mb_password },
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(marketingChannels.id, existing.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: "애드로그 계정이 연동되었습니다.",
        channel: updated,
      });
    }

    // 3. 신규 생성
    const [created] = await db
      .insert(marketingChannels)
      .values({
        userId: "system",
        channel: "adlog",
        accountName: mb_id,
        accountId: mb_id,
        settings: { mb_id, mb_password },
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "애드로그 계정이 연동되었습니다.",
      channel: created,
    }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "연동 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ─── DELETE: 애드로그 연동 해제 ─── */

export async function DELETE() {
  try {
    const ch = await getAdlogChannel();
    if (!ch) {
      return NextResponse.json({ error: "연동된 애드로그 계정이 없습니다." }, { status: 404 });
    }

    await db
      .update(marketingChannels)
      .set({
        settings: null,
        isActive: false,
        accountName: null,
        accountId: null,
        updatedAt: new Date(),
      })
      .where(eq(marketingChannels.id, ch.id));

    return NextResponse.json({ success: true, message: "애드로그 연동이 해제되었습니다." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "연동 해제 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ─── PATCH: 수동 동기화 트리거 ─── */

export async function PATCH() {
  try {
    const ch = await getAdlogChannel();
    if (!ch || !ch.isActive) {
      return NextResponse.json({ error: "연동된 계정이 없습니다." }, { status: 400 });
    }

    const creds = getCredentials(ch);
    if (!creds) {
      return NextResponse.json({ error: "자격증명이 없습니다." }, { status: 400 });
    }

    const dashboard = await fetchAdlogDashboard(creds);
    if (!dashboard.connected) {
      return NextResponse.json({ error: "애드로그 데이터 동기화 실패. 계정을 확인해주세요." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: "동기화 완료",
      syncedAt: new Date().toISOString(),
      summary: dashboard.summary,
      campaignCount: dashboard.campaigns.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "동기화 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
