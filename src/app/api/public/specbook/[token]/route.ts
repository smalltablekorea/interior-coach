import { NextRequest } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sites,
  specbookCatalogs,
  specbookShareTokens,
} from "@/lib/db/schema";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * GET /api/public/specbook/[token]
 *   고객 무인증 카탈로그 조회. 토큰 검증 후 site + catalog 반환.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return err("token 필수", 400);

  try {
    const [share] = await db
      .select({
        id: specbookShareTokens.id,
        siteId: specbookShareTokens.siteId,
        expiresAt: specbookShareTokens.expiresAt,
        revokedAt: specbookShareTokens.revokedAt,
      })
      .from(specbookShareTokens)
      .where(eq(specbookShareTokens.token, token));

    if (!share) return err("유효하지 않은 링크입니다", 404);
    if (share.revokedAt) return err("취소된 링크입니다", 410);
    if (share.expiresAt && share.expiresAt < new Date())
      return err("만료된 링크입니다", 410);

    const [site] = await db
      .select({ id: sites.id, name: sites.name, address: sites.address })
      .from(sites)
      .where(and(eq(sites.id, share.siteId), isNull(sites.deletedAt)));

    if (!site) return err("현장 정보를 찾을 수 없습니다", 404);

    const [catalog] = await db
      .select({ data: specbookCatalogs.data, updatedAt: specbookCatalogs.updatedAt })
      .from(specbookCatalogs)
      .where(eq(specbookCatalogs.siteId, share.siteId));

    if (!catalog) return err("아직 등록된 자재가 없습니다", 404);

    return ok({
      site: { id: site.id, name: site.name, address: site.address },
      catalog: catalog.data,
      updatedAt: catalog.updatedAt,
    });
  } catch (e) {
    return serverError(e);
  }
}
