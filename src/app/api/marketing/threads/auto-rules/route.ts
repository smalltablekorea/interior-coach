import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { threadsAutoRules, threadsTemplates } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";


export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

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
    .where(eq(threadsAutoRules.userId, auth.userId))
    .orderBy(desc(threadsAutoRules.createdAt));

  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { name, type, templateId, schedule, config } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "name, type 필수" }, { status: 400 });
  }

  const [created] = await db
    .insert(threadsAutoRules)
    .values({
      userId: auth.userId,
      name,
      type,
      templateId: templateId || null,
      schedule: schedule || null,
      config: config || null,
    })
    .returning();

  return NextResponse.json(created);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  const [updated] = await db
    .update(threadsAutoRules)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(threadsAutoRules.id, id), eq(threadsAutoRules.userId, auth.userId)))
    .returning();

  return NextResponse.json(updated || null);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  await db
    .delete(threadsAutoRules)
    .where(and(eq(threadsAutoRules.id, id), eq(threadsAutoRules.userId, auth.userId)));

  return NextResponse.json({ success: true });
}
