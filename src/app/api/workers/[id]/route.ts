import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { workers, phaseWorkers, constructionPhases, sites } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, notFound, serverError } from "@/lib/api/response";
import { validateBody, workerSchema } from "@/lib/api/validate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [worker] = await db
    .select({
      id: workers.id,
      name: workers.name,
      phone: workers.phone,
      trade: workers.trade,
      dailyWage: workers.dailyWage,
      memo: workers.memo,
      createdAt: workers.createdAt,
    })
    .from(workers)
    .where(and(eq(workers.id, id), workspaceFilter(workers.workspaceId, workers.userId, auth.workspaceId, auth.userId), isNull(workers.deletedAt)));

  if (!worker) return notFound("작업자를 찾을 수 없습니다");

  const assignments = await db
    .select({
      siteId: constructionPhases.siteId,
      siteName: sites.name,
      category: constructionPhases.category,
      plannedStart: constructionPhases.plannedStart,
      plannedEnd: constructionPhases.plannedEnd,
      dailyWage: phaseWorkers.dailyWage,
    })
    .from(phaseWorkers)
    .innerJoin(constructionPhases, eq(phaseWorkers.phaseId, constructionPhases.id))
    .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
    .where(eq(phaseWorkers.workerId, id));

  return ok({ ...worker, assignments });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const validation = await validateBody(request, workerSchema.partial());
  if (!validation.ok) return validation.response;

  try {
    const [row] = await db
      .update(workers)
      .set(validation.data)
      .where(and(eq(workers.id, id), workspaceFilter(workers.workspaceId, workers.userId, auth.workspaceId, auth.userId), isNull(workers.deletedAt)))
      .returning();

    if (!row) return notFound("작업자를 찾을 수 없습니다");
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [row] = await db
    .update(workers)
    .set({ deletedAt: new Date() })
    .where(and(eq(workers.id, id), workspaceFilter(workers.workspaceId, workers.userId, auth.workspaceId, auth.userId), isNull(workers.deletedAt)))
    .returning({ id: workers.id });

  if (!row) return notFound("작업자를 찾을 수 없습니다");
  return ok({ id: row.id });
}
