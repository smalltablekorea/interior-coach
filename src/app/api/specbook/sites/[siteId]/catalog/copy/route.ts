import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, specbookCatalogs, specbookTemplates } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";
import { emptyCatalog, validateCatalogShape } from "@/lib/specbook";

/**
 * POST /api/specbook/sites/[siteId]/catalog/copy
 *   body: { fromSiteId? } | { templateId? } | {}  → empty
 *   대상 현장의 카탈로그를 다른 현장 / 템플릿 / 빈값으로 초기화.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const auth = await requireWorkspaceAuth("specbook", "write");
  if (!auth.ok) return auth.response;
  const { siteId } = await params;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      fromSiteId?: string;
      templateId?: string;
    };

    // 대상 현장 소유권 확인
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

    let sourceData: unknown = emptyCatalog();

    if (body.fromSiteId) {
      // 다른 현장의 카탈로그 복제 (소유권 확인)
      const [src] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(
          and(
            eq(sites.id, body.fromSiteId),
            workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId),
            isNull(sites.deletedAt),
          ),
        );
      if (!src) return err("원본 현장에 접근 권한이 없습니다", 404);
      const [srcCatalog] = await db
        .select({ data: specbookCatalogs.data })
        .from(specbookCatalogs)
        .where(eq(specbookCatalogs.siteId, body.fromSiteId));
      if (!srcCatalog) return err("원본 현장에 카탈로그가 없습니다", 404);
      sourceData = srcCatalog.data;
    } else if (body.templateId) {
      const [tpl] = await db
        .select({ data: specbookTemplates.data })
        .from(specbookTemplates)
        .where(
          and(
            eq(specbookTemplates.id, body.templateId),
            workspaceFilter(
              specbookTemplates.workspaceId,
              specbookTemplates.userId,
              auth.workspaceId,
              auth.userId,
            ),
          ),
        );
      if (!tpl) return err("템플릿을 찾을 수 없습니다", 404);
      sourceData = tpl.data;
    }

    if (!validateCatalogShape(sourceData)) {
      return err("원본 카탈로그 형식이 올바르지 않습니다", 422);
    }

    const [existing] = await db
      .select({ id: specbookCatalogs.id })
      .from(specbookCatalogs)
      .where(eq(specbookCatalogs.siteId, siteId));

    if (existing) {
      await db
        .update(specbookCatalogs)
        .set({ data: sourceData, updatedAt: new Date() })
        .where(eq(specbookCatalogs.id, existing.id));
    } else {
      await db.insert(specbookCatalogs).values({
        siteId,
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        data: sourceData,
      });
    }

    return ok({ initialized: true });
  } catch (e) {
    return serverError(e);
  }
}
