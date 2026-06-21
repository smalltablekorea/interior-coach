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
 *   현장 단위 공유 토큰 발급. 활성 토큰이 있으면 재사용.
 *   body: { expiresInDays? (기본 90일), renew? }
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
      expiresInDays?: number;
      renew?: boolean;
    };
    const expiresInDays = Math.max(1, Math.min(365, Number(body.expiresInDays) || 90));

    if (!body.renew) {
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
      if (existing && (!existing.expiresAt || existing.expiresAt > new Date())) {
        return ok({
          token: existing.token,
          url: `${BASE_URL}/d/${existing.token}`,
          expiresAt: existing.expiresAt,
          reused: true,
        });
      }
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);
    await db.insert(dailyLogShareTokens).values({
      siteId,
      workspaceId: auth.workspaceId,
      token,
      expiresAt,
      createdBy: auth.userId,
    });

    return ok({
      token,
      url: `${BASE_URL}/d/${token}`,
      expiresAt,
      reused: false,
    });
  } catch (e) {
    return serverError(e);
  }
}
