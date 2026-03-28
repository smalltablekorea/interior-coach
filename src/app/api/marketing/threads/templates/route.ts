import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { db } from "@/lib/db";
import { threadsTemplates } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";


export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const conditions = [workspaceFilter(threadsTemplates.workspaceId, threadsTemplates.userId, auth.workspaceId, auth.userId)];
  if (category) {
    conditions.push(eq(threadsTemplates.category, category));
  }

  const templates = await db
    .select()
    .from(threadsTemplates)
    .where(and(...conditions))
    .orderBy(desc(threadsTemplates.createdAt));

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { name, category, contentTemplate, hashtagTemplate } = body;

  if (!name || !category || !contentTemplate) {
    return NextResponse.json({ error: "name, category, contentTemplate 필수" }, { status: 400 });
  }

  const [created] = await db
    .insert(threadsTemplates)
    .values({ userId: auth.userId, workspaceId: auth.workspaceId, name, category, contentTemplate, hashtagTemplate: hashtagTemplate || null })
    .returning();

  return NextResponse.json(created);
}

export async function PUT(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  const [updated] = await db
    .update(threadsTemplates)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(threadsTemplates.id, id), workspaceFilter(threadsTemplates.workspaceId, threadsTemplates.userId, auth.workspaceId, auth.userId)))
    .returning();

  return NextResponse.json(updated || null);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "delete");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  await db
    .delete(threadsTemplates)
    .where(and(eq(threadsTemplates.id, id), workspaceFilter(threadsTemplates.workspaceId, threadsTemplates.userId, auth.workspaceId, auth.userId)));

  return NextResponse.json({ success: true });
}
