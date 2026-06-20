import { NextRequest } from "next/server";
import { and, eq, desc, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, specbookSubmissions } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

/**
 * GET /api/specbook/submissions?siteId=...
 *   siteId 있으면 그 현장의 제출 목록, 없으면 워크스페이스 전체.
 *   ?status=new|confirmed 선택.
 */
export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceAuth("specbook", "read");
  if (!auth.ok) return auth.response;

  try {
    const sp = req.nextUrl.searchParams;
    const siteId = sp.get("siteId");
    const status = sp.get("status");

    if (siteId) {
      // 단일 현장 — 소유권 확인
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
      if (!site) return ok([]);

      const conditions = [eq(specbookSubmissions.siteId, siteId)];
      if (status === "new" || status === "confirmed") {
        conditions.push(eq(specbookSubmissions.status, status));
      }
      const rows = await db
        .select()
        .from(specbookSubmissions)
        .where(and(...conditions))
        .orderBy(desc(specbookSubmissions.createdAt));
      return ok(rows);
    }

    // 워크스페이스 전체: 내 워크스페이스 사이트들의 제출
    const ownedSites = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(
        and(
          workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId),
          isNull(sites.deletedAt),
        ),
      );
    if (ownedSites.length === 0) return ok([]);
    const siteIds = ownedSites.map((s) => s.id);
    const conditions = [inArray(specbookSubmissions.siteId, siteIds)];
    if (status === "new" || status === "confirmed") {
      conditions.push(eq(specbookSubmissions.status, status));
    }
    const rows = await db
      .select()
      .from(specbookSubmissions)
      .where(and(...conditions))
      .orderBy(desc(specbookSubmissions.createdAt));

    const siteNameMap = new Map(ownedSites.map((s) => [s.id, s.name]));
    return ok(
      rows.map((r) => ({ ...r, siteName: siteNameMap.get(r.siteId) ?? null })),
    );
  } catch (e) {
    return serverError(e);
  }
}
