import { NextRequest } from "next/server";
import { and, eq, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, specbookShareTokens } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { generateToken } from "@/lib/specbook";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.interiorcoach.co.kr";

/**
 * POST /api/specbook/sites/[siteId]/share
 *   기존 활성 토큰이 있으면 재사용, 없으면 새로 발급.
 *   body: { expiresInDays? } (기본 30일)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const auth = await requireWorkspaceAuth("specbook", "write");
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

    const body = (await req.json().catch(() => ({}))) as { expiresInDays?: number; renew?: boolean };
    const expiresInDays = Math.max(1, Math.min(365, Number(body.expiresInDays) || 30));

    // 기존 유효 토큰 확인
    if (!body.renew) {
      const [existing] = await db
        .select()
        .from(specbookShareTokens)
        .where(
          and(
            eq(specbookShareTokens.siteId, siteId),
            isNull(specbookShareTokens.revokedAt),
          ),
        )
        .orderBy(desc(specbookShareTokens.createdAt))
        .limit(1);
      if (existing && (!existing.expiresAt || existing.expiresAt > new Date())) {
        return ok({
          token: existing.token,
          url: `${BASE_URL}/specbook/${existing.token}`,
          expiresAt: existing.expiresAt,
          reused: true,
        });
      }
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);
    await db.insert(specbookShareTokens).values({
      siteId,
      workspaceId: auth.workspaceId,
      token,
      expiresAt,
      createdBy: auth.userId,
    });

    return ok({
      token,
      url: `${BASE_URL}/specbook/${token}`,
      expiresAt,
      reused: false,
    });
  } catch (e) {
    return serverError(e);
  }
}
