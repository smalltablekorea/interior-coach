import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsContent } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;
  try {
    const templateType = request.nextUrl.searchParams.get("templateType");

    const conditions = [workspaceFilter(smsContent.workspaceId, smsContent.userId, auth.workspaceId, auth.userId)];
    if (templateType) conditions.push(eq(smsContent.templateType, templateType));

    const rows = await db
      .select()
      .from(smsContent)
      .where(and(...conditions))
      .orderBy(desc(smsContent.createdAt));

    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { name, channel, templateType, subject, body: msgBody, variables } = body;

    if (!name || !templateType || !msgBody) {
      return err("이름, 유형, 내용은 필수입니다.");
    }

    const [row] = await db
      .insert(smsContent)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        name,
        channel: channel || "sms",
        templateType,
        subject,
        body: msgBody,
        variables,
      })
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return err("id required");
    }

    const [row] = await db
      .update(smsContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(smsContent.id, id), workspaceFilter(smsContent.workspaceId, smsContent.userId, auth.workspaceId, auth.userId)))
      .returning();

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;
  try {
    const { id } = await request.json();
    if (!id) {
      return err("id required");
    }

    await db.delete(smsContent).where(and(eq(smsContent.id, id), workspaceFilter(smsContent.workspaceId, smsContent.userId, auth.workspaceId, auth.userId)));
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
