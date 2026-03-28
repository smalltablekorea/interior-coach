import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { constructionPhases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const body = await request.json();
    const { siteId, category, plannedStart, plannedEnd, status, progress, memo } = body;

    if (!siteId || !category) return err("siteId와 category는 필수입니다");

    const [row] = await db
      .insert(constructionPhases)
      .values({
        userId: uid,
        workspaceId: wid,
        siteId,
        category,
        plannedStart: plannedStart || null,
        plannedEnd: plannedEnd || null,
        status: status || "대기",
        progress: progress ?? (status === "완료" ? 100 : 0),
        memo: memo || null,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return err("id 필요");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.plannedStart !== undefined) data.plannedStart = updates.plannedStart || null;
    if (updates.plannedEnd !== undefined) data.plannedEnd = updates.plannedEnd || null;
    if (updates.actualStart !== undefined) data.actualStart = updates.actualStart || null;
    if (updates.actualEnd !== undefined) data.actualEnd = updates.actualEnd || null;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.progress !== undefined) data.progress = updates.progress;
    if (updates.memo !== undefined) data.memo = updates.memo || null;

    const [row] = await db
      .update(constructionPhases)
      .set(data)
      .where(and(eq(constructionPhases.id, id), workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid)))
      .returning();

    if (!row) return err("공정을 찾을 수 없습니다", 404);
    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "delete");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return err("id 필요");

    await db
      .delete(constructionPhases)
      .where(and(eq(constructionPhases.id, id), workspaceFilter(constructionPhases.workspaceId, constructionPhases.userId, wid, uid)));

    return ok({ message: "삭제되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}
