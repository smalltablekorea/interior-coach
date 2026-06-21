import { NextRequest } from "next/server";
import { and, eq, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, dailyLogShareTokens } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { generateToken } from "@/lib/specbook";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.interiorcoach.co.kr";

/**
 * POST /api/daily-logs/sites/[siteId]/share
 *   현장 단위 공유 토큰 발급. 영구 링크 정책:
 *     - 현장당 활성 토큰 1개를 영구 유지 (expiresAt=null)
 *     - 같은 현장에서 반복 호출해도 동일 토큰 재사용 → 사용자가 한 번
 *       카톡으로 보낸 링크에 새 일지가 자동 누적됨
 *     - body.renew=true 일 때만 기존 토큰 revoke 후 새 토큰 발급
 *   body: { renew? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;
  const { siteId } = await params;

  try {
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          eq(sites.id, siteId),
          workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId),
          isNull(sites.deletedAt),
        ),
      );
    if (!site) return err("현장을 찾을 수 없습니다", 404);

    const body = (await req.json().catch(() => ({}))) as {
      renew?: boolean;
    };

    // 활성 토큰 조회 (만료 정책 제거: expiresAt 가 있어도 무시 — 새 정책은 영구)
    const [existing] = await db
      .select()
      .from(dailyLogShareTokens)
      .where(
        and(
          eq(dailyLogShareTokens.siteId, siteId),
          isNull(dailyLogShareTokens.revokedAt),
        ),
      )
      .orderBy(desc(dailyLogShareTokens.createdAt))
      .limit(1);

    if (!body.renew && existing) {
      return ok({
        token: existing.token,
        url: `${BASE_URL}/d/${existing.token}`,
        expiresAt: existing.expiresAt,
        reused: true,
      });
    }

    // renew 모드 — 기존 활성 토큰 revoke (새 링크로 갈아끼우길 원함)
    if (body.renew && existing) {
      await db
        .update(dailyLogShareTokens)
        .set({ revokedAt: new Date() })
        .where(eq(dailyLogShareTokens.id, existing.id));
    }

    // 새 토큰 발급 — 영구 (expiresAt=null)
    const token = generateToken();
    await db.insert(dailyLogShareTokens).values({
      siteId,
      workspaceId: auth.workspaceId,
      token,
      expiresAt: null,
      createdBy: auth.userId,
    });

    return ok({
      token,
      url: `${BASE_URL}/d/${token}`,
      expiresAt: null,
      reused: false,
    });
  } catch (e) {
    return serverError(e);
  }
}
