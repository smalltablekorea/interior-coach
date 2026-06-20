import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, specbookCatalogs, specbookTemplates } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

/** POST — 현 카탈로그를 템플릿으로 저장. body: { name, description? } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const auth = await requireWorkspaceAuth("specbook", "write");
  if (!auth.ok) return auth.response;
  const { siteId } = await params;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
    };
    if (!body.name || !body.name.trim()) return err("템플릿 이름을 입력해주세요", 400);

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

    const [catalog] = await db
      .select({ data: specbookCatalogs.data })
      .from(specbookCatalogs)
      .where(eq(specbookCatalogs.siteId, siteId));
    if (!catalog) return err("저장할 카탈로그가 없습니다", 404);

    const [tpl] = await db
      .insert(specbookTemplates)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        data: catalog.data,
      })
      .returning({ id: specbookTemplates.id });

    return ok({ id: tpl.id, name: body.name.trim() });
  } catch (e) {
    return serverError(e);
  }
}
