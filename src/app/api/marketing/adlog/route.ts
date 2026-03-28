import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { fetchAdlogDashboard, adlogLogin } from "@/lib/adlog-client";
import type { AdlogCredentials } from "@/lib/adlog-client";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

/* ─── Helpers ─── */

async function getAdlogChannel(workspaceId: string, userId: string) {
  const [ch] = await db
    .select()
    .from(marketingChannels)
    .where(and(eq(marketingChannels.channel, "adlog"), workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, workspaceId, userId)))
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
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  try {
    const ch = await getAdlogChannel(auth.workspaceId, auth.userId);

    // 연동 안 된 상태
    if (!ch || !ch.isActive) {
      return ok({
        connected: false,
        accountName: null,
        platforms: [],
        summary: null,
        campaigns: [],
      });
    }

    const creds = getCredentials(ch);
    if (!creds) {
      return ok({
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

    return ok({
      ...dashboard,
      accountName: ch.accountName || dashboard.accountName,
      channelId: ch.id,
    });
  } catch (error) {
    return serverError(error);
  }
}

/* ─── POST: 애드로그 계정 연동 (로그인 테스트 후 저장) ─── */

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { mb_id, mb_password } = body as { mb_id?: string; mb_password?: string };

    if (!mb_id || !mb_password) {
      return err("아이디와 비밀번호를 입력해주세요.");
    }

    // 1. 실제 로그인 테스트
    const loginResult = await adlogLogin({ mb_id, mb_password });
    if (!loginResult.ok) {
      return err(loginResult.error || "로그인 실패", 401);
    }

    // 2. 기존 채널 확인
    const existing = await getAdlogChannel(auth.workspaceId, auth.userId);

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
        .where(and(eq(marketingChannels.id, existing.id), workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, auth.workspaceId, auth.userId)))
        .returning();

      return ok({
        success: true,
        message: "애드로그 계정이 연동되었습니다.",
        channel: updated,
      });
    }

    // 3. 신규 생성
    const [created] = await db
      .insert(marketingChannels)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        channel: "adlog",
        accountName: mb_id,
        accountId: mb_id,
        settings: { mb_id, mb_password },
        isActive: true,
      })
      .returning();

    return ok({
      success: true,
      message: "애드로그 계정이 연동되었습니다.",
      channel: created,
    });
  } catch (error) {
    return serverError(error);
  }
}

/* ─── DELETE: 애드로그 연동 해제 ─── */

export async function DELETE() {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;
  try {
    const ch = await getAdlogChannel(auth.workspaceId, auth.userId);
    if (!ch) {
      return err("연동된 애드로그 계정이 없습니다.", 404);
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
      .where(and(eq(marketingChannels.id, ch.id), workspaceFilter(marketingChannels.workspaceId, marketingChannels.userId, auth.workspaceId, auth.userId)));

    return ok({ success: true, message: "애드로그 연동이 해제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}

/* ─── PATCH: 수동 동기화 트리거 ─── */

export async function PATCH() {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  try {
    const ch = await getAdlogChannel(auth.workspaceId, auth.userId);
    if (!ch || !ch.isActive) {
      return err("연동된 계정이 없습니다.");
    }

    const creds = getCredentials(ch);
    if (!creds) {
      return err("자격증명이 없습니다.");
    }

    const dashboard = await fetchAdlogDashboard(creds);
    if (!dashboard.connected) {
      return err("애드로그 데이터 동기화 실패. 계정을 확인해주세요.", 502);
    }

    return ok({
      success: true,
      message: "동기화 완료",
      syncedAt: new Date().toISOString(),
      summary: dashboard.summary,
      campaignCount: dashboard.campaigns.length,
    });
  } catch (error) {
    return serverError(error);
  }
}
