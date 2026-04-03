import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { db } from "@/lib/db";
import { threadsAutoRules, threadsTemplates } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ok, err, notFound, serverError } from "@/lib/api/response";


export async function GET() {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const rules = await db
      .select({
        id: threadsAutoRules.id,
        name: threadsAutoRules.name,
        type: threadsAutoRules.type,
        templateId: threadsAutoRules.templateId,
        templateName: threadsTemplates.name,
        schedule: threadsAutoRules.schedule,
        isActive: threadsAutoRules.isActive,
        lastTriggeredAt: threadsAutoRules.lastTriggeredAt,
        triggerCount: threadsAutoRules.triggerCount,
        config: threadsAutoRules.config,
        createdAt: threadsAutoRules.createdAt,
      })
      .from(threadsAutoRules)
      .leftJoin(threadsTemplates, eq(threadsAutoRules.templateId, threadsTemplates.id))
      .where(workspaceFilter(threadsAutoRules.workspaceId, threadsAutoRules.userId, wid, uid))
      .orderBy(desc(threadsAutoRules.createdAt));

    return ok(rules);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const body = await request.json();
    const { name, type, templateId, schedule, config } = body;

    if (!name || !type) {
      return err("name, type 필수");
    }

    const [created] = await db
      .insert(threadsAutoRules)
      .values({
        userId: uid,
        workspaceId: wid,
        name,
        type,
        templateId: templateId || null,
        schedule: schedule || null,
        config: config || null,
      })
      .returning();

    return ok(created);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return err("id 필수");
    }

    const [updated] = await db
      .update(threadsAutoRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(threadsAutoRules.id, id), workspaceFilter(threadsAutoRules.workspaceId, threadsAutoRules.userId, wid, uid)))
      .returning();

    if (!updated) return notFound("자동 규칙을 찾을 수 없습니다.");
    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return err("id 필수");
    }

    await db
      .delete(threadsAutoRules)
      .where(and(eq(threadsAutoRules.id, id), workspaceFilter(threadsAutoRules.workspaceId, threadsAutoRules.userId, wid, uid)));

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
