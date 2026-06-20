import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, specbookSubmissions } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

async function findOwnedSubmission(
  id: string,
  auth: { workspaceId: string; userId: string },
) {
  const [row] = await db
    .select({
      sub: specbookSubmissions,
      siteOwnerUserId: sites.userId,
      siteWorkspaceId: sites.workspaceId,
    })
    .from(specbookSubmissions)
    .innerJoin(sites, eq(sites.id, specbookSubmissions.siteId))
    .where(
      and(
        eq(specbookSubmissions.id, id),
        workspaceFilter(sites.workspaceId, sites.userId, auth.workspaceId, auth.userId),
        isNull(sites.deletedAt),
      ),
    );
  return row?.sub ?? null;
}

/** PATCH — 상태 변경 (new ↔ confirmed) + memo */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWorkspaceAuth("specbook", "write");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const sub = await findOwnedSubmission(id, auth);
    if (!sub) return err("제출을 찾을 수 없습니다", 404);

    const body = (await req.json()) as { status?: string; memo?: string };
    const patch: Record<string, unknown> = {};
    if (body.status === "new" || body.status === "confirmed") {
      patch.status = body.status;
      patch.confirmedAt = body.status === "confirmed" ? new Date() : null;
      patch.confirmedBy = body.status === "confirmed" ? auth.userId : null;
    }
    if (typeof body.memo === "string") patch.memo = body.memo;
    if (Object.keys(patch).length === 0) return err("변경 항목이 없습니다", 400);

    await db.update(specbookSubmissions).set(patch).where(eq(specbookSubmissions.id, id));
    return ok({ updated: true });
  } catch (e) {
    return serverError(e);
  }
}

/** DELETE */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWorkspaceAuth("specbook", "delete");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const sub = await findOwnedSubmission(id, auth);
    if (!sub) return err("제출을 찾을 수 없습니다", 404);
    await db.delete(specbookSubmissions).where(eq(specbookSubmissions.id, id));
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
