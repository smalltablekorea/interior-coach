import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, specbookCatalogs } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { emptyCatalog, validateCatalogShape } from "@/lib/specbook";

/** GET /api/specbook/sites/[siteId]/catalog — 카탈로그 조회 (없으면 빈 카탈로그) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const auth = await requireWorkspaceAuth("specbook", "read");
  if (!auth.ok) return auth.response;
  const { siteId } = await params;

  try {
    // 현장 소유권 확인
    const [site] = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(
        and(
          eq(sites.id, siteId),
          workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId),
          isNull(sites.deletedAt),
        ),
      );
    if (!site) return err("현장을 찾을 수 없습니다", 404);

    const [row] = await db
      .select()
      .from(specbookCatalogs)
      .where(eq(specbookCatalogs.siteId, siteId));

    return ok({
      site,
      catalog: row?.data ?? emptyCatalog(),
      exists: !!row,
      updatedAt: row?.updatedAt ?? null,
    });
  } catch (e) {
    return serverError(e);
  }
}

/** PUT — 카탈로그 저장 (upsert) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const auth = await requireWorkspaceAuth("specbook", "write");
  if (!auth.ok) return auth.response;
  const { siteId } = await params;

  try {
    const body = await req.json();
    if (!validateCatalogShape(body)) return err("카탈로그 형식이 올바르지 않습니다", 400);

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

    const [existing] = await db
      .select({ id: specbookCatalogs.id })
      .from(specbookCatalogs)
      .where(eq(specbookCatalogs.siteId, siteId));

    if (existing) {
      await db
        .update(specbookCatalogs)
        .set({ data: body, updatedAt: new Date() })
        .where(eq(specbookCatalogs.id, existing.id));
    } else {
      await db.insert(specbookCatalogs).values({
        siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        data: body,
      });
    }

    return ok({ saved: true });
  } catch (e) {
    return serverError(e);
  }
}
