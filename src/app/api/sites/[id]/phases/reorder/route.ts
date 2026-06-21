import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, constructionPhases } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * PATCH /api/sites/[id]/phases/reorder
 *   body: { order: string[] }   // phase id 를 새 순서대로
 *   해당 현장의 모든 phase 에 대해 sort_order 를 배열 인덱스로 일괄 갱신.
 *   UI 의 drag-to-reorder / 위·아래 버튼이 호출.
 */
const bodySchema = z.object({
  order: z.array(z.string().uuid()).min(1).max(500),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWorkspaceAuth("construction", "write");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return err("입력값이 올바르지 않습니다");

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          eq(sites.id, id),
          workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);
    if (!site) return err("현장을 찾을 수 없습니다", 404);

    // 보안: 전달된 phase id 가 정말 이 현장 소유인지 확인
    const owned = await db
      .select({ id: constructionPhases.id })
      .from(constructionPhases)
      .where(
        and(
          eq(constructionPhases.siteId, id),
          inArray(constructionPhases.id, parsed.data.order),
        ),
      );
    const ownedSet = new Set(owned.map((r) => r.id));
    if (owned.length !== parsed.data.order.length) {
      return err("이 현장에 속하지 않은 공정이 포함되어 있습니다", 400);
    }

    // 일괄 UPDATE — 인덱스를 sort_order 로
    for (let i = 0; i < parsed.data.order.length; i++) {
      const phaseId = parsed.data.order[i];
      if (!ownedSet.has(phaseId)) continue;
      await db
        .update(constructionPhases)
        .set({ sortOrder: i })
        .where(eq(constructionPhases.id, phaseId));
    }

    return ok({ siteId: id, count: parsed.data.order.length });
  } catch (e) {
    return serverError(e);
  }
}
